import {create} from 'zustand';
import {io, Socket} from 'socket.io-client';
import { useAuthStore } from './useAuthStore';
import type { SocketState } from '@/types/store';
import { useChatStore } from './useChatStore';

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

        // 🔥 nếu chưa có convo thì add luôn
        const exists = chatStore.conversations.some(
            (c) => c._id === conversation._id
        );

        if (!exists) {
            chatStore.addConvo({
                ...conversation,
                unreadCounts
            });
        }

        chatStore.addMessage(message);

        chatStore.updateConversation({
            _id: conversation._id,
            lastMessage: {
                ...conversation.lastMessage,
                sender: {
                    _id: conversation.lastMessage.senderId
                }
            },
            lastMessageAt: conversation.lastMessageAt,
            unreadCounts
        });

        if (chatStore.activeConversationId === message.conversationId) {
            chatStore.markAsSeen();
        }
    });
        
        // read message
        socket.on("read-message", ({ conversation }) => {
        useChatStore.getState().updateConversation({
            ...conversation, // nếu backend đã populate
        });
    });

        // 🆕 new conversation (direct chat)
        socket.on("new-conversation", ({ conversation }) => {
            useChatStore.getState().addConvo(conversation);
        });

        // 🆕 friend request
        socket.on("friend-request", ({ request }) => {
            console.log("Có lời mời kết bạn mới", request);

            // nếu có store riêng thì update vào đó
            // ví dụ:
            // useFriendStore.getState().addReceivedRequest(request);
        });

        // 🆕 friend accepted
        socket.on("friend-accepted", ({ friend }) => {
            console.log("Kết bạn thành công", friend);

            // update lại danh sách bạn bè
            // useFriendStore.getState().addFriendLocal(friend);
        });
        // new group chat
        socket.on("new-group", ({conversation}) => {
            useChatStore.getState().addConvo(conversation); // hàm addConvo sẽ update store và từ đó UI cũng sẽ hiển thị group chat mới
            socket.emit("join-conversation", conversation._id);
        })
        
    },
    disconnectSocket: () => {
        const socket = get().socket;
        if(socket) {
            socket.disconnect();
            set({socket: null});
        }
    }
}))