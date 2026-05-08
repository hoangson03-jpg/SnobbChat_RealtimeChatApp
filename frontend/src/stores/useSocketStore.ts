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

    // 1. Kiểm tra hội thoại đã có trong danh sách bên trái chưa
    const exists = chatStore.conversations.some((c) => c._id === convoId);

    if (!exists) {
        // Nếu chưa có (có thể do mới hoàn toàn hoặc do vừa bị ẩn đi vì xóa lịch sử)
        // Khi addConvo, mảng tin nhắn của ID này trong Store phải được reset về rỗng
        chatStore.addConvo({
            ...conversation,
            unreadCounts
        });
        
        // QUAN TRỌNG: Xóa sạch tin nhắn cũ của ID này trong store nếu có 
        // để đảm bảo tin nhắn mới là duy nhất
        chatStore.clearMessagesOfConvo(convoId); 
    }

    // 2. Thêm tin nhắn mới vào Store
    chatStore.addMessage(message);

    // 3. Cập nhật Sidebar (lastMessage, thời gian, số tin chưa đọc)
    chatStore.updateConversation({
        _id: convoId,
        lastMessage: message, // Dùng trực tiếp object message vừa nhận
        lastMessageAt: message.createdAt,
        unreadCounts
    });

    // 4. Nếu đang mở chính hội thoại này thì markAsSeen
    if (chatStore.activeConversationId === convoId) {
        chatStore.markAsSeen();
    }
    });
        
        // read message
        socket.on("read-message", ({ conversation }) => {
        useChatStore.getState().updateConversation({
            ...conversation, // nếu backend đã populate
        });
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
        
    },
    disconnectSocket: () => {
        const socket = get().socket;
        if(socket) {
            socket.disconnect();
            set({socket: null});
        }
    }
}))