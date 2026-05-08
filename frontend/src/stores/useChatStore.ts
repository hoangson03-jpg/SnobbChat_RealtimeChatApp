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
                     isOwn: String(m.senderId) === String(user?._id)
                }));

                set((state) => {
                    const prev = state.messages[convoId]?.items ?? [];
                    
                    //  FIX DUPLICATE TIN NHẮN TẠI ĐÂY: Hợp nhất và loại bỏ các tin nhắn trùng id
                    const allMessages = [...processed, ...prev];
                    const uniqueMessages = Array.from(
                        new Map(allMessages.map(item => [item._id, item])).values()
                    );
                    
                    // Sắp xếp lại đảm bảo tin nhắn mới nhất nằm trên cùng (desc)
                    uniqueMessages.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

                    return {
                        messages: {
                            ...state.messages,
                            [convoId]: {
                                items: uniqueMessages, // Thay vì merge mảng đơn thuần
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
                    // 1. Lấy user đang đăng nhập từ AuthStore
                    const currentUser = useAuthStore.getState().user;
                    
                    if (!currentUser) {
                        console.error("DEBUG: Không tìm thấy thông tin user trong AuthStore");
                        return;
                    }

                    // 2. Lấy ID người gửi từ tin nhắn (Socket có thể trả về string hoặc object)
                    const senderId = typeof message.senderId === 'object' 
                        ? (message.senderId as any)._id 
                        : message.senderId;

                    // 3. So sánh ID (Dùng String() và kiểm tra cả ._id lẫn .id cho chắc)
                    const currentUserId = currentUser._id || (currentUser as any).id;
                    const isOwn = String(senderId) === String(currentUserId);

                    // --- Debug ---
                    // console.log("--- DEBUG IS_OWN ---");
                    // console.log("ID người gửi (từ tin nhắn):", senderId);
                    // console.log("ID của bạn (từ AuthStore):", currentUserId);
                    // console.log("Kết quả isOwn:", isOwn);

                    set((state) => {
                        const convoId = message.conversationId;
                        const prev = state.messages[convoId]?.items ?? [];

                        if (prev.some((m) => m._id === message._id)) return {};

                        // 4. Gán isOwn chuẩn xác vào message trước khi đưa vào Store
                        const processedMessage = { 
                            ...message, 
                            isOwn, 
                            senderId: String(senderId) 
                        };

                        return {
                            messages: {
                                ...state.messages,
                                [convoId]: {
                                    ...state.messages[convoId],
                                    items: [processedMessage, ...prev],
                                },
                            },
                        };
                    });
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

                
                deleteConversation: async (conversationId: string) => {
                try {
                    console.log("1. Bắt đầu gọi API xóa hội thoại:", conversationId);
                    await chatService.deleteConversation(conversationId);
                    console.log("2. API xóa thành công");

                    set((state) => {
                        const userId = useAuthStore.getState().user?._id;
                        const now = new Date().toISOString();

                        // Tìm hội thoại để kiểm tra trước khi update
                        const oldConvo = state.conversations.find(c => c._id === conversationId);
                        console.log("3. Dữ liệu cũ trong Store:", oldConvo?.participants);

                        const updatedConversations = state.conversations.map((c) => {
                            if (c._id === conversationId) {
                                return {
                                    ...c,
                                    participants: c.participants.map((p) => 
                                        p._id === userId ? { ...p, clearedAt: now } : p
                                    ),
                                    lastMessage: null // Ép mất tin nhắn ngay
                                };
                            }
                            return c;
                        });

                        console.log("4. Đã cập nhật clearedAt mới trong Store:", now);

                        return {
                            conversations: updatedConversations,
                            messages: { ...state.messages, [conversationId]: { items: [], hasMore: false } },
                            activeConversationId: state.activeConversationId === conversationId ? null : state.activeConversationId,
                        };
                    });
                } catch (error) {
                    console.error("LỖI DEBUG STORE:", error);
                    throw error;
                }
            },

            clearMessagesOfConvo: (id: string) => {
                set((state) => {
                    const newMessages = { ...state.messages };
                    delete newMessages[id];
                    return { messages: newMessages };
                });
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
                addConvo: (convo, setActive = false) => {
                    console.log("🔥 Đang thêm conversation vào store:", convo);
                        set((state) => {
                        const exists = state.conversations.find((c) => c._id.toString() === convo._id.toString());

                        return {
                            // Nếu đã tồn tại thì update nó với data mới nhất (để đồng bộ tên, avatar,...), chưa có thì thêm mới
                            conversations: exists 
                                ? state.conversations.map(c => c._id.toString() === convo._id.toString() ? { ...c, ...convo } : c)
                                : [convo, ...state.conversations],
                                
                            // Chỉ set active khi hành động này do BẢN THÂN USER bấm tạo/chọn chat (setActive = true)
                            activeConversationId: setActive ? convo._id : state.activeConversationId
                        }
                    })
                },
                createConversation: async (type, name, memberIds) => {
                     try {
                set({ loading: true });
                const conversation = await chatService.createConversation(type, name, memberIds);
                if (!conversation) return null;

                // GỌI addConvo VÀ TRUYỀN true ĐỂ MÌNH ĐƯỢC REDIRECT ĐẾN CHAT ĐÓ
                get().addConvo(conversation, true);

                useSocketStore.getState().socket?.emit("join-conversation", conversation._id);
                // set({ activeConversationId: conversation._id }); // Có thể bỏ dòng này vì addConvo đã làm rồi

                return conversation; 
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


