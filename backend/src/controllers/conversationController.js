import { populate } from "dotenv";
import Conversation from "../models/Conversation.js";
import message from "../models/Message.js";
import {io} from '../socket/index.js'

export const createConversation = async (req, res) => {
    try {
        const {type, name, memberIds} = req.body; 
        const userId = req.user?._id;

        if(!type || (type === 'group' && !name) || !memberIds || !Array.isArray(memberIds) || memberIds.length === 0){
            return res.status(400).json({message: "Tên nhóm và danh sách thành viên là bắt buộc"})
        }

        let conversation;

        if(type === 'direct') {
            const participantId = memberIds[0];

            conversation = await Conversation.findOne({
                type: 'direct',
                "participants.userId": {$all: [userId, participantId]},
                
            })
            if(!conversation){
                conversation = new Conversation({
                    type: 'direct',
                    participants: [{userId}, {userId: participantId}],
                    lastMessageAt: new Date()
                });
                
                await conversation.save();
            }
        }

        if(type === 'group') {
            conversation = new Conversation({
                type: 'group',
                participants: [
                    {userId},
                    ...memberIds.map((id) => ({userId: id}))
                ],
                group:{
                    name,
                    createdBy: userId
                },
                lastMessageAt: new Date()
            });

            await conversation.save();
        }

        if(!conversation){
            return res.status(400).json({message: 'Kiểu của cuộc hội thoại không hợp lệ!'});
        }

        await conversation.populate([
            {path: 'participants.userId', select: 'displayName avatarURL username'},
            {
                path: 'seenBy', select: 'displayName avatarURL username'
            },
            {
                path: 'lastMessage.senderId', select: 'displayName avatarURL username'
            }
        ]);
        const formatted = {
          ...conversation.toObject(),
          participants: (conversation.participants || []).map((p) => ({
            _id: p.userId?._id,
            displayName: p.userId?.displayName,
            avatarURL: p.userId?.avatarURL ?? null,
            joinedAt: p.joinedAt
          }))
        };

        if (type === "direct") {
    const allMembers = [userId, ...memberIds];

    allMembers.forEach((id) => {
      io.to(id.toString()).emit("new-conversation", {
        conversation: formatted,
      });
    });
  }

        if(type === 'group') {
          memberIds.forEach((userId) => {
            io.to(userId).emit('new-group', formatted)
          })
        }
        return res.status(201).json({ formatted });
    } catch (error) {
        console.error("Lỗi khi tạo conversation/ cuộc trò chuyện");
        return res.status(500).json({ message: 'Lỗi hệ thống!'})
    }
}

export const getConversation = async (req, res) => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const conversation = await Conversation.find({
      'participants.userId': userId
    })
      .sort({ lastMessageAt: -1, updatedAt: -1 })
      .populate({
        path: 'participants.userId',
        select: 'displayName avatarURL'
      })
      .populate({
        path: 'seenBy',
        select: 'displayName avatarURL'
      });

    const formatted = conversation.map((convo) => {
      const participants = (convo.participants || [])
        .filter(p => p.userId)
        .map((p) => ({
          _id: p.userId._id,
          displayName: p.userId.displayName,
          avatarURL: p.userId.avatarURL ?? null,
          joinedAt: p.joinedAt
        }));

      return {
        ...convo.toObject(),
        participants,
        unreadCounts: convo.unreadCounts || {},
      };
    });

    return res.status(200).json({ conversation: formatted });

  } catch (error) {
    console.error("getConversation error:", error);
    return res.status(500).json({ message: 'Lỗi hệ thống!' });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { limit = 50, cursor } = req.query;

    const query = { conversationId };

    if (cursor) {
      query.createdAt = { $lt: new Date(cursor) };
    }

    let messages = await message
      .find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit) + 1);

    let nextCursor = null;

    if (messages.length > Number(limit)) {
      const nextMessage = messages[messages.length - 1];
      nextCursor = nextMessage.createdAt.toISOString();
      messages.pop();
    }

    messages = messages.reverse();

    return res.status(200).json({
      messages,
      nextCursor,
    });

  } catch (error) {
    console.error("getMessages error:", error);
    return res.status(500).json({ message: "Lỗi hệ thống!" });
  }
};

export const getUserConversationsForSocketIO = async (userId) => {
    try {
        const conversations = await Conversation.find(
            {'participants.userId': userId,},
            { _id: 1 });
        return conversations.map((c) => c._id.toString());
    } catch (error) {
        console.error("Lỗi khi lấy danh sách cuộc trò chuyện ", error);
        return [];
    }
};

export const deleteConversation = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const userId = req.user._id.toString(); // Chuyển về string để so sánh

        const conversation = await Conversation.findById(conversationId);

        if (!conversation) {
            return res.status(404).json({ message: "Không tìm thấy cuộc hội thoại" });
        }

        // Dùng .some() để kiểm tra trong mảng Object
        const isParticipant = conversation.participants.some(
            (p) => p.userId.toString() === userId
        );

        if (!isParticipant) {
            return res.status(403).json({ message: "Bạn không có quyền xóa cuộc hội thoại này" });
        }

        await message.deleteMany({ conversationId: conversationId });

        // Xóa hội thoại
        await Conversation.findByIdAndDelete(conversationId);

        return res.status(200).json({ 
            message: "Đã xóa cuộc hội thoại thành công", 
            conversationId 
        });

    } catch (error) {
        console.error("Lỗi khi xóa hội thoại:", error);
        return res.status(500).json({ message: "Lỗi hệ thống!" });
    }
};

export const markAsSeen = async (req, res) => {
    try {
        const {conversationId} = req.params;
        const userId = req.user._id.toString();

        const conversation = await Conversation.findById(conversationId).lean();

        if(!conversation) {
            return res.status(404).json({message: "Conversation không tồn tại"});
        }

        const last = conversation.lastMessage;

        if(!last) {
            return res.status(200).json({message: "Không có tin nhắn để mark as seen"});
        }

        if(last.senderId.toString() === userId) {
            return res.status(200).json({message: "Sender klhoong cần mark as seen"})
        }

        const updated = await Conversation.findByIdAndUpdate(
  conversationId,
  {
    $addToSet: { seenBy: userId },
    $set: { [`unreadCounts.${userId}`]: 0 },
  },
  { returnDocument: "after" }
)
.populate("participants.userId", "displayName avatarURL")
.populate("seenBy", "displayName avatarURL")
.populate("lastMessage.senderId", "displayName avatarURL");

const formatted = {
  ...updated.toObject(),
  participants: (updated.participants || []).map((p) => ({
    _id: p.userId?._id,
    displayName: p.userId?.displayName,
    avatarURL: p.userId?.avatarURL ?? null,
    joinedAt: p.joinedAt
  }))
};

       io.to(conversationId).emit("read-message", {
    conversation: formatted,
});

        return res.status(200).json(formatted);
    } catch (error) {
        console.error("Lỗi khi mark as seen ", error);
        return res.status(500).json({message: "Lỗi hệ thống!"});
    }
}

