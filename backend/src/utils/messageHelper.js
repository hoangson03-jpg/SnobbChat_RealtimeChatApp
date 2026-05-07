export const updateConversationAfterCreateMessage = (conversation, message, senderId) => {
    conversation.set({
        seenBy: [],
        lastMessageAt: message.createdAt,
        lastMessage: {
            _id: message._id,
            content: message.content,
            senderId,
            createdAt: message.createdAt 
        }
    });

    if (!conversation.unreadCounts) {
        conversation.unreadCounts = new Map();
    }

    conversation.participants.forEach((p) => {
        const memberId = p.userId.toString();
        const isSender = memberId === senderId.toString();

        const prevCount = conversation.unreadCounts.get(memberId) || 0;

        conversation.unreadCounts.set(
            memberId,
            isSender ? 0 : prevCount + 1
        );
    });

    // QUAN TRỌNG
    conversation.markModified("unreadCounts");
};

export const emitNewMessage = (io, conversation, message) => {
    const convoId = conversation._id.toString();

    // Chuyển Map thành Object để Socket gửi đi được
    const unreadCountsObj = Object.fromEntries(conversation.unreadCounts);

    const dataToEmit = {
        message,
        conversation: {
            ...conversation.toObject(), // Gửi đầy đủ (bao gồm participants có clearedAt)
            unreadCounts: unreadCountsObj
        },
        unreadCounts: unreadCountsObj
    };

    // Emit cho room (những người đang mở chat)
    io.to(convoId).emit("new-message", dataToEmit);

    // Emit cho cá nhân (để cập nhật sidebar cho người đang ở trang khác)
    conversation.participants.forEach((p) => {
        io.to(p.userId.toString()).emit("new-message", dataToEmit);
    });
};

const maskAndFormatConvo = (convo, targetUserId) => {
    const convoObj = convo.toObject ? convo.toObject() : JSON.parse(JSON.stringify(convo));
    
    // 1. Tìm participant tương ứng với targetUserId để lấy clearedAt
    // Lưu ý: userId có thể đã được populate hoặc chưa tùy thời điểm gọi
    const me = convoObj.participants.find(p => 
        (p.userId._id?.toString() || p.userId?.toString()) === targetUserId.toString()
    );

    const clearedAtTime = me?.clearedAt ? new Date(me.clearedAt).getTime() : 0;

    // 2. Kiểm tra ẩn lastMessage
    if (convoObj.lastMessage && convoObj.lastMessage.createdAt) {
        const lastMsgTime = new Date(convoObj.lastMessage.createdAt).getTime();
        if (lastMsgTime <= clearedAtTime) {
            convoObj.lastMessage = null;
        }
    }

    // 3. Format lại participants giống cấu trúc getConversation
    convoObj.participants = convoObj.participants.map(p => ({
        _id: p.userId._id || p.userId, // fallback nếu chưa populate
        displayName: p.userId.displayName || "",
        avatarURL: p.userId.avatarURL ?? null,
        username: p.userId.username || "",
        bio: p.userId.bio || "",
        clearedAt: p.clearedAt,
        joinedAt: p.joinedAt
    }));

    return convoObj;
};