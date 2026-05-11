import {create} from 'zustand';
import {io, Socket} from 'socket.io-client';
import { useAuthStore } from './useAuthStore';
import type { SocketState } from '@/types/store';
import { useChatStore } from './useChatStore';
import { useFriendStore } from './useFriendStore';

const baseURL = import.meta.env.VITE_SOCKET_URL

export const useSocketStore = create<SocketState>((set, get) => ({
    socket: null,
    onlineUsers: [],
    connectSocket: () => {
        const accessToken = useAuthStore.getState().accessToken;
        const existingSocket = get().socket;
        

        if(existingSocket) return; // tránh tạo nhiều socket

        const socket: Socket = io(baseURL, {
            auth: {token: accessToken},
        });
        set({socket});
        console.log("Socket URL:", baseURL);

        socket.on("connect", () => {
            console.log("Đã kết nối với socket");
        });
        // online users
        socket.on("online-users", (userIds) => {
            set({ onlineUsers: userIds })
        })

        // new message
        socket.on("new-message", ({ message, conversation, unreadCounts }) => {
        const chatStore = useChatStore.getState();
        const convoId = conversation._id;

        const current =
            chatStore.messages[convoId]?.items || [];

        // 🚨 CHECK DUPLICATE
        const exists = current.some(
            (m) =>
                m._id === message._id ||
                m.tempId === message._id
        );

        if (exists) return;

        // 1. add message an toàn
        chatStore.addMessage(message);

        // 2. update sidebar
        chatStore.updateConversation({
            _id: convoId,
            lastMessage: message,
            lastMessageAt: message.createdAt,
            unreadCounts
        });

        // 3. mark seen
        if (chatStore.activeConversationId === convoId) {
            chatStore.markAsSeen();
        }
    });

        // new conversation (direct chat)
        socket.on("new-conversation", ({ conversation }) => {
            console.log("Dữ liệu nhận từ socket:", conversation);
            // Truyền false (hoặc ko truyền) để UI của người nhận không tự nhảy sang box chat này
            useChatStore.getState().addConvo(conversation, false);
        });

        // friend request
        socket.on("friend-request", ({ request }) => {
            // console.log("Có lời mời kết bạn mới", request);
            useFriendStore.getState().addReceivedRequest(request);
        });

        // friend accepted
        socket.on("friend-accepted", ({ requestId, newFriend }) => {
            // console.log("Kết bạn thành công qua socket", newFriend);
            useFriendStore.getState().handleFriendAcceptedSocket(requestId, newFriend);
        });

        // request declined
        socket.on("friend-request-declined", ({requestId}) => {
            useFriendStore.getState().removeSentRequest(requestId);
        });
        socket.on("new-group", ({conversation}) => {
            useChatStore.getState().addConvo(conversation, false); // Truyền false tương tự
            socket.emit("join-conversation", conversation._id);
        });

        socket.on("conversation-cleared", ({ conversationId }) => {
            // Gọi hàm dọn dẹp trong ChatStore
            useChatStore.getState().clearMessagesOfConvo(conversationId);
        });

        // Backend báo đã lưu thành công tin nhắn kẹt từ Redis vào MongoDB
        socket.on("message-synced-success", ({ tempId, realMessage }) => {
    const chatStore = useChatStore.getState();
    const convoId = realMessage.conversationId;

    chatStore.replaceTempMessage(convoId, tempId, realMessage);

    chatStore.updateConversation({
        _id: convoId,
        lastMessage: realMessage,
        lastMessageAt: realMessage.createdAt
    });

    // 🚨 mark message đã sync để socket không add lại
    chatStore.markMessageAsSynced(realMessage._id);
});
    },
    disconnectSocket: () => {
        const socket = get().socket;
        if(socket) {
            socket.disconnect();
            set({socket: null});
        }
    }
}))