import Friend from '../models/Friend.js'
import User from '../models/User.js';
import FriendRequest from '../models/FriendRequest.js';
import {io} from '../socket/index.js'
import Conversation from '../models/Conversation.js';


export const sendFriendRequest = async (req, res) => {
    try {
        const {to, message} = req.body;

        const from = req.user._id;

        if (from === to){
            return res.status(400).json({message: "Không thể gửi lời mời kết bạn tới chính mình"})
        }

        const userExist = await User.findById({_id: to});

        if(!userExist){
            return res.status(404).json({message: "Người dùng không tồn tại"})
        }

        let userA = from.toString();
        let userB = to.toString();

        if(userA > userB){
            [userA, userB] = [userB, userA];
        }

        const [alreadyFriends, existingRequest] = await Promise.all([
            Friend.findOne({userA, userB}),
            FriendRequest.findOne({
                $or: [
                    {from, to},
                    {from: to, to: from}
                ]

            })
        ]);

        if(alreadyFriends){
            return res.status(400).json({message: "Hai người đã là bạn bè"});
        }

        if(existingRequest){
            return res.status(400).json({message: "Đã có lời mời kết bạn"});
        }

        const request = await FriendRequest.create({
            from,
            to,
            message,
        });

         await request.populate([
            { path: "from", select: "_id username displayName avatarURL" },
            { path: "to", select: "_id username displayName avatarURL" }
        ]);

        io.to(to.toString()).emit("friend-request", { request });

        return res.status(201).json({message: "Gửi lời mời kết bạn thành công", request})

    } catch (error) {
        console.error('Lỗi khi gửi lời mời kết bạn', error);
        return res.status(500).json({message: 'Lỗi hệ thống!'});
    }
}

export const acceptFriendRequest = async (req, res) => {
    try {
        const {requestId} = req.params;
        const userId = req.user._id;

        const request = await FriendRequest.findById(requestId);

        if(!request){
            return res.status(404).json({message: "Không tồn tại lời mời kết bạn"});
        }
        if(request.to.toString() !== userId.toString()){
            return res.status(403).json({message: "Bạn không có quyền chấp nhận lời mời này"})
        }

        await Friend.create({
            userA: request.from,
            userB: request.to
        });

        await FriendRequest.findByIdAndDelete(requestId);

        // Lấy thông tin người gửi (để trả về API cho người bấm Accept)
        const fromUser = await User.findById(request.from).select('_id displayName avatarURL username').lean();
        
        // Lấy thông tin người nhận (để bắn Socket báo cho người gửi)
        const toUser = await User.findById(request.to).select('_id displayName avatarURL username').lean();

        // Bắn cho người gửi (request.from)
        io.to(request.from.toString()).emit("friend-accepted", {
            requestId: requestId,
            newFriend: {
                _id: toUser._id,
                displayName: toUser.displayName,
                avatarURL: toUser.avatarURL,
                username: toUser.username
            }
        });

        // Tạo một cuộc hội thoại mới sau khi thêm bạn thành công

        const newConvo = await Conversation.create({
            type: 'direct',
            participants: [
                { userId: request.from, joinedAt: new Date() },
                { userId: request.to, joinedAt: new Date() }
            ],
            lastMessageAt: new Date()
        });
        
        await newConvo.populate('participants.userId', 'displayName avatarURL username');

        const formatted = {
            _id: newConvo._id,
            type: 'direct',
            lastMessage: null,
            lastMessageAt: newConvo.lastMessageAt,
            participants: newConvo.participants.map(p => ({
                _id: p.userId._id, // Trích xuất ID
                displayName: p.userId.displayName,
                avatarURL: p.userId.avatarURL,
                username: p.userId.username,
                joinedAt: p.joinedAt
            })),
            unreadCounts: { [request.from]: 0, [request.to]: 0 }
        };

        // Emit bản đã format
        io.to(request.from.toString()).emit("new-conversation", { conversation: formatted });
        io.to(request.to.toString()).emit("new-conversation", { conversation: formatted });

        // Trả API về cho người bấm Accept
        return res.status(200).json({
            message: "Chấp nhận lời mời kết bạn thành công!",
            newFriend: {
                _id: fromUser._id,
                displayName: fromUser.displayName,
                avatarURL: fromUser.avatarURL,
                username: fromUser.username
            },
        });

    } catch (error) {
        console.error('Lỗi khi chấp nhận lời mời kết bạn', error);
        return res.status(500).json({message: 'Lỗi hệ thống!'});
    }
}

export const declineFriendRequest = async (req, res) => {
    try {
        const {requestId} = req.params;
        const userId = req.user._id;

        const request = await FriendRequest.findById(requestId);

        if(!request){
            return res.status(404).json({message: "Không tồn tại lời mời kết bạn"});
        }

        if(request.to.toString() !== userId.toString()){
            return res.status(403).json({message: "Bạn không có quyền từ chối lời mời này"})
        }

        await FriendRequest.findByIdAndDelete(requestId);

        // Bắn socket báo cho NGƯỜI GỬI biết là request đã bị từ chối
        io.to(request.from.toString()).emit("friend-request-declined", { requestId });

        return res.status(200).json({message: "Đã từ chối lời mời kết bạn", request});

    } catch (error) {
        console.error('Lỗi khi từ chối lời mời kết bạn', error);
        return res.status(500).json({message: 'Lỗi hệ thống!'});
    }
}

export const getAllFriends = async (req, res) => {
    try {
        const userId = req.user._id; //Object này được gán sẵn nhờ middleware Protected Route

        const friendShip = await Friend.find({ // Để tìm tất cả mối quan hệ bạn bè mà user đang ở một trong hai phía thì dùng toán tử or
            $or:[{
                userA: userId
            },{
                userB: userId
            }]
        })
        .populate("userA","_id displayName avatarURL username")
        .populate("userB","_id displayName avatarURL username")
        .lean();

        if(!friendShip.length){
            return res.status(200).json({friends: []})
        }

        const friends = friendShip.map((f) => f.userA._id.toString() === userId.toString() ? f.userB : f.userA);

        return res.status(200).json({friends});


    } catch (error) {
        console.error('Lỗi khi lấy danh sách tất cả bạn bè', error);
        return res.status(500).json({message: 'Lỗi hệ thống!'});
    }
}

export const getFriendsRequest = async (req, res) => {
    try {
        
        const userId = req.user._id;

        const populateFields = '_id username displayName avatarURL';

        const [sent, received] = await Promise.all([
            FriendRequest.find({from: userId}).populate("to", populateFields),
            FriendRequest.find({to: userId}).populate("from", populateFields),
        ])

        res.status(200).json({sent, received});

    } catch (error) {
        console.error('Lỗi khi lấy danh sách lởi mời kết bạn', error);
        return res.status(500).json({message: 'Lỗi hệ thống'});
    }
}

export const removeFriend = async (req, res) => {
    try {
        const { friendId } = req.params; // ID của người bạn cần xóa
        const userId = req.user._id;

        // 1. Xóa trong Collection Friend
        await Friend.deleteOne({
            $or: [
                { userA: userId, userB: friendId },
                { userA: friendId, userB: userId }
            ]
        });
        io.to(friendId.toString()).emit("friend-removed", { friendId: userId });

        return res.status(200).json({ message: "Đã hủy kết bạn" });
    } catch (error) {
        return res.status(500).json({ message: "Lỗi hệ thống" });
    }
}