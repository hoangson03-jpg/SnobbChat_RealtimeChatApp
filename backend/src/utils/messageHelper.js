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

    // emit cho room
    io.to(convoId).emit("new-message", {
        message,
        conversation: {
            _id: conversation._id,
            lastMessage: conversation.lastMessage,
            lastMessageAt: conversation.lastMessageAt
        },
        unreadCounts: conversation.unreadCounts
    });

    // emit cho từng user
    conversation.participants.forEach((p) => {
        const userId = p.userId.toString();

        io.to(userId).emit("new-message", {
            message,
            conversation: {
                _id: conversation._id,
                lastMessage: conversation.lastMessage,
                lastMessageAt: conversation.lastMessageAt
            },
            unreadCounts: conversation.unreadCounts
        });
    });
};