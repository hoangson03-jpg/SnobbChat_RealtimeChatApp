import Conversation from "../models/Conversation.js";
import Friend from "../models/Friend.js";

const pair = (a,b) => (a < b ? [a,b] : [b,a]);

export const checkFriendship = async (req, res, next) => { // 3 tham số tương ứng với request là yêu cầu gửi từ client, response là phản hồi trả về cho client, còn next là hàm gọi lại để chuyển sang Middleware hoặc Route kế tiếp
    try {
        const me = req.user._id.toString();
        const recipientId = req.body?.recipientId ?? null; // vế ?? là toán tử nulless, kiểm tra xem vế bên trái có phải là null hay undefined hay không, nếu đúng thì lấy giá trị bên phải
        const memberIds = req.body?.memberIds ?? []; // nếu rỗng thì ta trả về mảng rỗng

        if(!recipientId && memberIds.length === 0){
            return res.status(400).json({message: "Cần cung cấp recipientId hoặc memberIds"});
        }

        
        if(recipientId){
            const [userA, userB] = pair(me, recipientId);
            
            const isFriend = await Friend.findOne({userA, userB});

            if(!isFriend){
                return res.status(403).json({message: "Bạn chưa kết bạn với người này"});
            }

            return next();
        }

        // todo: chat nhóm
        const friendCheck = memberIds.map(async (memberId) => {
            const [userA, userB] = pair (me, memberId);
            const friend = await Friend.findOne({userA, userB});
            return friend ? null : memberId;
        })

        const results = await Promise.all(friendCheck);
        const notFriends = results.filter(Boolean); // lọc ra những memberId tức không phải bạn bè

        if(notFriends.length > 0){
            return res.status(403).json({ message: "Bạn chỉ có thể thêm bạn bè vào nhóm", notFriends});
        }

        return next();
    } catch (error) {
        console.error("Lỗi xảy ra khi kiểm tra mối quan hệ bạn bè");
        return res.status(500).json({message: "Lỗi hệ thống!"});
    }
}

export const checkGroupMembership = async (req, res, next) => {
    try {
        const {conversationId} = req.body;
        const userId = req.user._id;
        console.log(userId);

        const conversation = await Conversation.findById(conversationId)

        if(!conversation){
            return res.status(404).json({message: "Không tìm thấy cuộc hội thoại!"});
        }

        const isMember = conversation.participants.some((p) => {
            return p.userId.toString() === userId.toString();
        })

        if(!isMember){
            return res.status(403).json({message: "Bạn không ở trong nhóm này"});
        }

        req.conversation = conversation;

        return next();
    } catch (error) {
        console.error("Lỗi check route membership");
        return res.status(500).json("Lỗi hệ thống!");
    }
}