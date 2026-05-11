import { MessageCache } from '../services/redisServices.js';
import Message from '../models/Message.js';
import Conversation from '../models/Conversation.js';

export const startSyncWorker = () => {
    console.log("Background Sync Worker Started");

    setInterval(async () => {
        try {
            const pendingMsg = await MessageCache.popFromOfflineQueue();
            if (!pendingMsg) return; // Queue rỗng, bỏ qua

            console.log("Đang đồng bộ tin nhắn offline từ Redis vào MongoDB...");
            
            // Lưu vào MongoDB ngầm
            const message = await Message.create({
                conversationId: pendingMsg.conversationId,
                senderId: pendingMsg.senderId,
                recipientId: pendingMsg.recipientId,
                content: pendingMsg.content
            });

            // Xử lý cập nhật cuộc hội thoại...
            const conversation = await Conversation.findById(pendingMsg.conversationId);
            if(conversation) {
               // Logic update conversation của bạn ở đây
               conversation.lastMessageAt = message.createdAt;
               await conversation.save();
            }

            // Có thể emit socket cho client báo "Tin nhắn đã được đồng bộ thành công"
            // io.to(...).emit("message-synced", { tempId: pendingMsg.tempId, realId: message._id });

        } catch (error) {
            console.error("Lỗi đồng bộ Queue, đẩy lại vào Queue:", error);
            // Nếu lỗi vẫn chưa hết (DB vẫn tèo), nhét ngược lại vào Queue
            // await MessageCache.pushToOfflineQueue(pendingMsg); 
        }
    }, 5000); // 5 giây chạy 1 lần
};