import redisClient from '../config/redis.js'; // Đường dẫn tới file redis của bạn

// --- XỬ LÝ USER CACHE ---
export const UserCache = {
    // Lấy user từ cache
    get: async (username) => {
        const data = await redisClient.get(`user:username:${username}`);
        return data ? JSON.parse(data) : null;
    },
    // Set user vào cache (TTL: 1 giờ)
    set: async (user) => {
        await redisClient.setEx(`user:username:${user.username}`, 3600, JSON.stringify(user));
    },
    // Xóa cache khi user update thông tin (avatar, tên...)
    invalidate: async (username) => {
        await redisClient.del(`user:username:${username}`);
    }
};

// --- XỬ LÝ MESSAGE OFFLINE QUEUE / CACHE ---
export const MessageCache = {
    // Lưu tin nhắn tạm thời vào Redis List (Queue) khi MongoDB lỗi
    pushToOfflineQueue: async (messageData) => {
        await redisClient.lPush('offline_messages_queue', JSON.stringify(messageData));
    },
    
    // Lấy tin nhắn ra khỏi Queue để lưu vào DB (dùng cho Background Job)
    popFromOfflineQueue: async () => {
        const data = await redisClient.rPop('offline_messages_queue');
        return data ? JSON.parse(data) : null;
    },

    // (Tuỳ chọn) Cache 50 tin nhắn mới nhất của 1 cuộc hội thoại để load nhanh
    cacheRecentMessages: async (conversationId, message) => {
        const key = `chat:recent:${conversationId}`;
        await redisClient.lPush(key, JSON.stringify(message));
        await redisClient.lTrim(key, 0, 49); // Chỉ giữ lại 50 tin nhắn gần nhất
    }
};