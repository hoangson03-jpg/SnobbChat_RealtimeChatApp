import { chatService } from "@/services/chatService";
import type { ChatState } from "@/types/store";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useAuthStore } from "./useAuthStore";
import type { Conversation } from "@/types/chat";
import { useSocketStore } from "./useSocketStore";

export const useChatStore = create<ChatState>()(
    persist(
        (set,get) => ({
            conversations: [],
            messages: {},
            activeConversationId: null,
            convoLoading: false,
            messagesLoading: false,
            loading: false,

            setActiveConversation: (id) => set({activeConversationId: id}),
            reset: () => {
                set({
                    conversations: [],
                    messages: {},
                    activeConversationId: null,
                    convoLoading: false,
                    messagesLoading: false,
                });
            },
            fetchConversations: async () => {
                try {
                    set({ convoLoading: true });

                    const res = await chatService.fetchConversations();

                    set({
                    conversations: res.conversation, // ✅ chuẩn
                    convoLoading: false
                    });

                } catch (error) {
                    console.error(error);
                }
                },
                fetchMessages: async (conversationId) => {
                    const {activeConversationId, messages} = get();
                    const {user} = useAuthStore.getState();

                    const convoId = conversationId ?? activeConversationId;

                    if(!convoId) return;

                    const current = messages?.[convoId];
                    const nextCursor = current?.nextCursor ?? "";

                    if(nextCursor === null) return;
                    
                    set({messagesLoading: true});

                    try {
                        const {messages: fetched, cursor} = await chatService.fetchMessages(convoId, nextCursor);

                         const processed = fetched.map((m) => ({
                            ...m, 
                            isOwn: m.senderId === user?._id
                        }));

                        set((state) => {
                            const prev = state.messages[convoId]?.items ?? [];
                            const merge = prev.length > 0 ? [...processed, ...prev] : processed;

                            return {
                                messages: {
                                    ...state.messages,
                                    [convoId]: {
                                        items: merge,
                                        hasMore: !!cursor,
                                        nextCursor: cursor ?? null,
                                    },
                                },
                            };
                        });
                    } catch (error) {
                        console.error("Lỗi xảy ra khi fetchMessages: ", error);
                    } finally {
                        set({messagesLoading: false});
                    }
                },
                sendDirectMessage: async (recipientId, content, imgURL) => {
                    try {
                        const {activeConversationId} = get();
                        await chatService.sendDirectMessage(recipientId,
                            content,
                            imgURL,
                            activeConversationId || undefined
                        );

                        set((state) => ({
                            conversations: state.conversations.map((c) => c._id === activeConversationId ? {...c, seenBy: []} : c)
                        }))
                    } catch (error) {
                        console.error("Lỗi xảy ra khi create direct message ", error);
                    }
                },
                sendGroupMessage: async (conversationId, content, imgURL) => {
                    try {
                        await chatService.sendGroupMessage(
                            conversationId,
                            content,
                            imgURL,
                        )
                        set((state) => ({
                            conversations: state.conversations.map((c) => c._id === get().activeConversationId ? {...c, seenBy: []} : c)
                        }))
                    } catch (error) {
                        console.error("Lỗi xảy ra khi create group message ", error);
                    }
                },
                addMessage: async (message) => {
                    try {
                        const {user} = useAuthStore.getState();

                        message.isOwn = message.senderId === user?._id;

                        const convoId = message.conversationId;

                        set((state) => {
                            const prev = state.messages[convoId]?.items ?? [];

                            // 🔥 CHẶN DUPLICATE 100%
                            const exists = prev.some((m) => m._id === message._id);

                            if (exists) return {};

                            return {
                                messages: {
                                    ...state.messages,
                                    [convoId]: {
                                        items: [...prev, message],
                                        hasMore: state.messages[convoId]?.hasMore ?? true,
                                        nextCursor: state.messages[convoId]?.nextCursor ?? null,
                                    },
                                },
                            };
                        });
                    } catch (error) {
                        console.error("Lỗi xảy ra khi add message:", error);
                    }
                },
                updateConversation: async (conversation: Partial<Conversation>) => {
                    set((state) => ({
                        conversations: state.conversations.map((c) =>
                        c._id === conversation._id
                            ? {
                                ...c,
                                ...conversation,
                                // giữ data cũ nếu backend không trả
                                participants: conversation.participants ?? c.participants,
                                group: conversation.group ?? c.group,
                            }
                            : c
                        ),
                    }));
                },
                markAsSeen: async () => {
                    try {
                        const { user } = useAuthStore.getState();
                        const { activeConversationId, conversations } = get();

                        if (!activeConversationId || !user) {
                        return;
                        }

                        const convo = conversations.find((c) => c._id === activeConversationId);

                        if (!convo) {
                        return;
                        }

                        // Không có unread thì không cần gọi API
                        if ((convo.unreadCounts?.[user._id] ?? 0) === 0) {
                        return;
                        }

                        // Gọi API và lấy data mới từ backend
                        const updated = await chatService.markAsSeen(activeConversationId);

                        // Nếu backend không trả data → fallback (tránh crash)
                        if (!updated) {
                        console.warn("markAsSeen không trả về conversation");
                        return;
                        }

                        // Sync lại toàn bộ conversation từ backend
                        set((state) => ({
                            conversations: state.conversations.map((c) =>
                                c._id === updated._id
                                ? {
                                    ...c,
                                    seenBy: updated.seenBy,
                                    unreadCounts: updated.unreadCounts,
                                    }
                                : c
                            ),
                        }));

                    } catch (error) {
                        console.error("Lỗi xảy ra khi gọi markAsSeen trong store:", error);
                    }
                },
                addConvo: (convo) => {
                    set((state) => {
                        const exists = state.conversations.some((c) => c._id.toString() === convo._id.toString());

                        return {
                            conversations: exists ? state.conversations : [convo, ...state.conversations],
                            activeConversationId: convo._id
                        }
                    })
                },
                createConversation: async (type, name, memberIds) => {
                    try {
                        set({ loading: true });

                        const conversation = await chatService.createConversation(
                        type,
                        name,
                        memberIds
                        );

                        if (!conversation) return null;

                        // add vào store
                        get().addConvo(conversation);

                        // 🔥 join socket room
                        useSocketStore
                        .getState()
                        .socket?.emit("join-conversation", conversation._id);

                        // 🔥 set active (đảm bảo UI sync)
                        set({ activeConversationId: conversation._id });

                        return conversation; // ✅ QUAN TRỌNG
                    } catch (error) {
                        console.error("Lỗi createConversation", error);
                        return null;
                    } finally {
                        set({ loading: false });
                    }
                    }
        }),
    {
        name: "chat-storage",
        partialize: (state) => ({ conversations: state.conversations }) 
        // Khi reload trang thì danh sách chat vẫn được giữ lại
        // Không lưu danh sách tin nhắn vì nếu hacker chỉ thấy id của cuộc hội thoại thì cũng không sao
    })
);


