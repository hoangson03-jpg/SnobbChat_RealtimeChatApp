import { populate } from "dotenv";
import Conversation from "../models/Conversation.js";
import message from "../models/Message.js";
import {io} from '../socket/index.js'

export const createConversation = async (req, res) => {
    try {
        const { type, name, memberIds } = req.body;
        const userId = req.user?._id;

        if (!type || (type === 'group' && !name) || !memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
            return res.status(400).json({ message: "Tên nhóm và danh sách thành viên là bắt buộc" })
        }

        let conversation;

        if (type === 'direct') {
            const participantId = memberIds[0];
            conversation = await Conversation.findOne({
                type: 'direct',
                "participants.userId": { $all: [userId, participantId] },
            });

            if (!conversation) {
                conversation = new Conversation({
                    type: 'direct',
                    participants: [
                        { userId, joinedAt: new Date(), clearedAt: null },
                        { userId: participantId, joinedAt: new Date(), clearedAt: null }
                    ],
                    lastMessageAt: new Date()
                });
                await conversation.save();
            }
        }

        if (type === 'group') {
            conversation = new Conversation({
                type: 'group',
                participants: [
                    { userId, joinedAt: new Date(), clearedAt: null },
                    ...memberIds.map((id) => ({ userId: id, joinedAt: new Date(), clearedAt: null }))
                ],
                group: {
                    name,
                    createdBy: userId
                },
                lastMessageAt: new Date()
            });
            await conversation.save();
        }

        if (!conversation) {
            return res.status(400).json({ message: 'Kiểu của cuộc hội thoại không hợp lệ!' });
        }

        // Populate đầy đủ như code gốc của bạn
        await conversation.populate([
            { path: 'participants.userId', select: 'displayName avatarURL username bio' },
            { path: 'seenBy', select: 'displayName avatarURL username' },
            { path: 'lastMessage.senderId', select: 'displayName avatarURL username' }
        ]);

        // --- HÀM HELPER NỘI BỘ ĐỂ FORMAT DỮ LIỆU CHUẨN ---
        // Hàm này giữ nguyên cấu trúc "formatted" của bạn nhưng thêm logic ẩn tin nhắn
        const getFormattedForUser = (targetId) => {
            const convoObj = conversation.toObject();
            
            // Tìm participant tương ứng với người nhận (targetId)
            const pTarget = convoObj.participants.find(p => 
                (p.userId._id || p.userId).toString() === targetId.toString()
            );
            
            const clearedAtTime = pTarget?.clearedAt ? new Date(pTarget.clearedAt).getTime() : 0;
            const msgTime = convoObj.lastMessage?.createdAt ? new Date(convoObj.lastMessage.createdAt).getTime() : 0;

            // Logic ẩn tin nhắn nếu đã xóa lịch sử
            let finalLastMessage = convoObj.lastMessage;
            if (finalLastMessage && msgTime <= clearedAtTime) {
                finalLastMessage = null;
            }

            return {
                ...convoObj,
                lastMessage: finalLastMessage,
                participants: (convoObj.participants || []).map((p) => ({
                    _id: p.userId?._id || p.userId,
                    displayName: p.userId?.displayName,
                    avatarURL: p.userId?.avatarURL ?? null,
                    username: p.userId?.username,
                    clearedAt: p.clearedAt, // Để frontend so sánh
                    joinedAt: p.joinedAt
                }))
            };
        };

        // --- GỬI SOCKET EVENT ---
        if (type === "direct") {
            const allMembers = [userId, ...memberIds];
            allMembers.forEach((id) => {
                // Mỗi người nhận một bản "formatted" riêng theo clearedAt của họ
                const dataForMember = getFormattedForUser(id);
                io.to(id.toString()).emit("new-conversation", {
                    conversation: dataForMember,
                });
            });
        }

        if (type === 'group') {
            const allGroupMembers = [userId, ...memberIds];
            allGroupMembers.forEach((id) => {
                const dataForMember = getFormattedForUser(id);
                io.to(id.toString()).emit('new-group', dataForMember);
            });
        }

        // --- TRẢ VỀ CHO NGƯỜI GỌI API (CHÍNH LÀ userId) ---
        const formattedForMe = getFormattedForUser(userId);

        return res.status(201).json({ formatted: formattedForMe });

    } catch (error) {
        console.error("Lỗi khi tạo conversation:", error);
        return res.status(500).json({ message: 'Lỗi hệ thống!' })
    }
}

export const getConversation = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const conversations = await Conversation.find({ 'participants.userId': userId })
      .sort({ lastMessageAt: -1, updatedAt: -1 })
      .populate({ path: 'participants.userId', select: 'displayName avatarURL username bio' })
      .populate({ path: 'seenBy', select: 'displayName avatarURL' });

    const formatted = conversations.map((convo) => {
      const convoObj = convo.toObject();
      
      // Tìm participant là chính mình
      const me = convoObj.participants.find(p => p.userId._id.toString() === userId.toString());
      
      // Lấy mốc thời gian xóa (clearedAt). Nếu null thì mặc định là rất cũ
      const clearedAtTime = me?.clearedAt ? new Date(me.clearedAt).getTime() : 0;

      // Kiểm tra tin nhắn cuối cùng (lastMessage)
      let effectiveLastMessage = convoObj.lastMessage;
      
      if (effectiveLastMessage && effectiveLastMessage.createdAt) {
          const lastMsgTime = new Date(effectiveLastMessage.createdAt).getTime();

          // Nếu tin nhắn cuối cùng cũ hơn hoặc bằng thời điểm mình xóa lịch sử
          if (lastMsgTime <= clearedAtTime) {
              effectiveLastMessage = null; // Ẩn nội dung tin nhắn này đi
          }
      }

      // Map lại participants để trả về cấu trúc phẳng (flatten) cho Frontend dễ dùng
      const participants = convoObj.participants.map((p) => ({
          _id: p.userId._id,
          displayName: p.userId.displayName,
          avatarURL: p.userId.avatarURL ?? null,
          username: p.userId.username,
          bio: p.userId.bio,
          clearedAt: p.clearedAt, // Trả về để Frontend có thể debug/logic nếu cần
          joinedAt: p.joinedAt
      }));

      let unreadObj = {};
      if (convoObj.unreadCounts) {
          unreadObj = convoObj.unreadCounts instanceof Map 
              ? Object.fromEntries(convoObj.unreadCounts) 
              : convoObj.unreadCounts;
      }

      return {
        ...convoObj,
        participants,
        lastMessage: effectiveLastMessage, // Trả về null nếu đã bị xóa
        unreadCounts: unreadObj // Đảm bảo trả về object bình thường cho Frontend, dù lưu dưới dạng Map hay Object
      };
    })
    // - Nếu là Direct Message (1-1) mà lastMessage là null (do vừa xóa xong) -> Ẩn luôn khỏi danh sách bên trái.
    // - Nếu là Group Chat thì thường vẫn hiện tên nhóm ngay cả khi xóa lịch sử (tùy bạn chọn).
    .filter(convo => {
        if (convo.type === 'direct') {
            return convo.lastMessage !== null;
        }
        return true; // Luôn hiện nhóm, hoặc dùng (convo.lastMessage !== null) nếu muốn ẩn cả nhóm
    });

    return res.status(200).json({ conversation: formatted });
  } catch (error) {
    console.error("Lỗi getConversation:", error);
    return res.status(500).json({ message: 'Lỗi hệ thống!' });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { limit = 50, cursor } = req.query;
    const userId = req.user._id;

    // 1. Tìm clearedAt của user này
    const convo = await Conversation.findById(conversationId).select("participants");
    const me = convo?.participants.find(p => p.userId.toString() === userId.toString());
    const clearedAt = me?.clearedAt || new Date(0);

    // 2. Query tin nhắn phải lớn hơn clearedAt
    const query = { 
        conversationId,
        createdAt: { $gt: clearedAt } 
    };

    if (cursor) {
      query.createdAt = { ...query.createdAt, $lt: new Date(cursor) };
    }

    let messages = await message
      .find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit) + 1);

    // ... (Phần logic nextCursor giữ nguyên)
    let nextCursor = null;
    if (messages.length > Number(limit)) {
      const nextMessage = messages[messages.length - 1];
      nextCursor = nextMessage.createdAt.toISOString();
      messages.pop();
    }
    messages = messages.reverse();

    return res.status(200).json({ messages, nextCursor });
  } catch (error) {
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
        const userId = req.user._id;

        // Cập nhật clearedAt của đúng User đang thực hiện lệnh xóa để xóa "mềm"
        const updated = await Conversation.findOneAndUpdate(
            { 
                _id: conversationId, 
                "participants.userId": userId 
            },
            { 
                $set: { 
                    "participants.$.clearedAt": new Date(),
                    [`unreadCounts.${userId}`]: 0 // Reset tin nhắn chưa đọc
                } 
            },
            { new: true }
        );

        if (!updated) {
            return res.status(404).json({ message: "Không tìm thấy hội thoại" });
        }

        io.to(userId.toString()).emit("conversation-cleared", { 
          conversationId: conversationId 
        });

        return res.status(200).json({ 
            message: "Đã xóa lịch sử trò chuyện phía bạn", 
            conversationId 
        });
    } catch (error) {
        console.error("Lỗi xóa hội thoại:", error);
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
            return res.status(200).json({message: "Sender không cần mark as seen"})
        }

        // 1. Thực hiện update (Lệnh $set này của MongoDB chạy được trên cả Map và Object thường trong DB)
        const updated = await Conversation.findByIdAndUpdate(
            conversationId,
            {
                $addToSet: { seenBy: userId },
                $set: { [`unreadCounts.${userId}`]: 0 },
            },
            { returnDocument: 'after' }
        )
        .populate("participants.userId", "displayName avatarURL")
        .populate("seenBy", "displayName avatarURL")
        .populate("lastMessage.senderId", "displayName avatarURL");

        if (!updated) {
            return res.status(404).json({message: "Không tìm thấy cuộc trò chuyện"});
        }

        const updatedObj = updated.toObject();

        let unreadObj = {};
        if (updatedObj.unreadCounts) {
            if (updatedObj.unreadCounts instanceof Map) {
                // Nếu là Map của Mongoose
                unreadObj = Object.fromEntries(updatedObj.unreadCounts);
            } else if (typeof updatedObj.unreadCounts.entries === 'function') {
                // Nếu là Map thuần JS
                unreadObj = Object.fromEntries(updatedObj.unreadCounts);
            } else {
                // Nếu DB chưa migrate (vẫn là Object thường) -> Giữ nguyên Object
                unreadObj = updatedObj.unreadCounts || {};
            }
        }

        const formatted = {
            ...updatedObj,
            unreadCounts: unreadObj, 
            participants: (updatedObj.participants || []).map((p) => ({
                _id: p.userId?._id,
                displayName: p.userId?.displayName,
                avatarURL: p.userId?.avatarURL ?? null,
                joinedAt: p.joinedAt
            }))
        };

        // Bắn Socket cho room
        io.to(conversationId).emit("read-message", {
            conversation: formatted,
        });

        if (formatted.participants && formatted.participants.length > 0) {
            formatted.participants.forEach((p) => {
                const memberId = p._id || p.userId; 
                if (memberId) {
                    io.to(memberId.toString()).emit("read-message", {
                        conversation: formatted,
                    });
                }
            });
        }

        return res.status(200).json(formatted);
    } catch (error) {
        console.error("Lỗi chi tiết khi mark as seen:", error);
        return res.status(500).json({message: "Lỗi hệ thống!"});
    }
}