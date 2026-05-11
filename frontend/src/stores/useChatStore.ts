import { chatService } from "@/services/chatService";
import type { ChatState } from "@/types/store";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useAuthStore } from "./useAuthStore";
import type { Conversation, Message } from "@/types/chat";
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
            offlineQueue: [],
            syncedMessageIds: [],

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
                sendDirectMessage: async (recipientId, content, imgURL, providedTempId?: string) => {
                    const { activeConversationId, addMessage, addMessageToQueue, replaceTempMessage } = get();
                    const currentUser = useAuthStore.getState().user;

                    const tempId = providedTempId || `temp_${Date.now()}`;
                    const tempMessage: Message = {
                        _id: tempId,
                        tempId: tempId,
                        conversationId: activeConversationId || "temp_convo",
                        senderId: currentUser?._id || "",
                        content,
                        createdAt: new Date().toISOString(),
                        isOwn: true,
                        status: 'pending' // Hiển thị đồng hồ cát ở UI
                    };

                    if (!providedTempId) {
                        addMessage(tempMessage); // Hiện ngay lên UI
                    }

                    try {
                        const res = await chatService.sendDirectMessage(
                            recipientId,
                            content,
                            imgURL,
                            activeConversationId || undefined,
                            tempId // THÊM DÒNG NÀY ĐỂ TRUYỀN XUỐNG SERVICE
                        );


                        // Nếu rớt mạng, API trả về undefined -> Ép văng lỗi để lọt xuống catch
                        if (!res) {
                            throw new Error("Không nhận được phản hồi từ Server (Có thể do rớt mạng)");
                        }

                        // Nếu Backend trả về dạng queued (mất mạng DB, nhưng backend vẫn sống)
                        if (res.status === 'queued') {
                            console.warn("Tin nhắn đã đưa vào Queue của Redis backend");
                            return; // Cứ để status là pending
                        }

                        // Nếu gửi thành công, thay thế tin nhắn tạm bằng tin nhắn thật từ backend
                        if (activeConversationId) {
                            replaceTempMessage(activeConversationId, tempId, res.message);
                        }

                        // Sau khi gửi thành công, cập nhật seenBy
                        set((state) => ({
                            conversations: state.conversations.map((c) => 
                                c._id === activeConversationId ? {...c, seenBy:[]} : c
                            )
                        }));
                    } catch (error: any) {
                        console.error("Lỗi xảy ra khi create direct message (Mất mạng)", error);
                        
                        // NẾU MẤT MẠNG HOÀN TOÀN: Đẩy vào Queue của Zustand để gửi lại sau
                        addMessageToQueue({
                            tempId,
                            type: 'direct',
                            recipientId,
                            content
                        });
                    }
                },
                sendGroupMessage: async (
                    conversationId: string,
                    content: string,
                    imgURL?: string,
                    providedTempId?: string
                ) => {
                    const { addMessage, addMessageToQueue, replaceTempMessage } = get();
                    // Giả sử useAuthStore.getState().user trả về object User hiện tại
                    const currentUser = useAuthStore.getState().user;

                    // 1. TẠO TIN NHẮN TẠM THỜI (Optimistic UI)
                    const tempId = providedTempId || `temp_group_${Date.now()}`; 
                    const tempMessage: Message = {
                        _id: tempId,
                        conversationId: conversationId,
                        senderId: currentUser?._id || "",
                        content: content,
                        imgUrl: imgURL || null,
                        createdAt: new Date().toISOString(),
                        isOwn: true,
                        tempId: tempId,
                        status: 'pending' // Hiển thị icon đang gửi ở UI
                    };

                    // Nếu là lần gửi đầu tiên (chưa có providedTempId), hiển thị ngay lên màn hình
                    if (!providedTempId) {
                        await addMessage(tempMessage); 
                    }

                    try {
                        // Gọi API lên Backend
                        const res = await chatService.sendGroupMessage(
                            conversationId, 
                            content, 
                            imgURL,
                            tempId // THÊM DÒNG NÀY 
                        );
                        
                        // Trải nghiệm mượt: Nếu Backend bị đứt DB và đưa vào Redis Queue
                        if (res.status === 'queued') {
                            console.warn("Backend đang lỗi DB, tin nhắn nhóm đã đưa vào Queue của Redis");
                            return; 
                        }

                        // Thành công: Thay thế tin nhắn ảo bằng tin nhắn thật từ DB trả về
                        replaceTempMessage(conversationId, tempId, res.message);

                        // Cập nhật Sidebar / Conversations list
                        set((state) => ({
                            conversations: state.conversations.map((c) => 
                                c._id === conversationId 
                                    ? { 
                                        ...c, 
                                        // FIX TYPE: seenBy cần mảng SeenUser[] (chỉ yêu cầu _id là bắt buộc)
                                        seenBy: currentUser ?[{ _id: currentUser._id }] :[], 
                                        
                                        // FIX TYPE: lastMessage phải match với interface LastMessage
                                        lastMessage: {
                                            _id: res.message._id,
                                            content: res.message.content || (res.message.imgUrl ? "Đã gửi một ảnh" : ""),
                                            createdAt: res.message.createdAt,
                                            sender: {
                                                _id: currentUser?._id || "",
                                                // Typecast sang any hoặc dùng property chuẩn của model User
                                                displayName: (currentUser as any)?.displayName || (currentUser as any)?.firstName || "Bạn",
                                                avatarUrl: (currentUser as any)?.avatarUrl || null
                                            }
                                        },
                                        // Cập nhật thời gian để đẩy cuộc hội thoại lên đầu danh sách
                                        updatedAt: new Date().toISOString() 
                                    } 
                                    : c
                            )
                        }));

                    } catch (error) {
                        console.error("Lỗi khi gửi tin nhắn nhóm:", error);

                        // FIX TYPE: Xử lý Record<string, { items: Message[] }> đúng cách trong khối catch
                        set((state) => {
                            const convoMessages = state.messages[conversationId];
                            if (!convoMessages) return state; // Nếu không tìm thấy, giữ nguyên state

                            return {
                                messages: {
                                    ...state.messages,
                                    [conversationId]: {
                                        ...convoMessages,
                                        items: convoMessages.items.map((msg) =>
                                            msg._id === tempId ? { ...msg, status: 'error' } : msg
                                        )
                                    }
                                }
                            };
                        });

                        // Đưa tin nhắn vào hàng đợi offline ở Client
                        addMessageToQueue({
                            tempId: tempId,
                            type: "group",
                            conversationId: conversationId,
                            content: content
                        });
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
                    },
                    replaceTempMessage: (
                        conversationId: string,
                        tempId: string,
                        realMessage: Message
                        ) => {
                        set((state) => {
                            const convo = state.messages[conversationId];

                            if (!convo) return state;

                            const prevItems = convo.items || [];

                            // 1. Remove temp message + tránh giữ bản cũ
                            const withoutTemp = prevItems.filter(
                            (msg) => msg._id !== tempId && msg.tempId !== tempId
                            );

                            // 2. Check duplicate real message
                            const exists = withoutTemp.some(
                            (msg) => msg._id === realMessage._id
                            );

                            // 3. Normalize message (fix type + trạng thái)
                            const normalized: Message = {
                            ...realMessage,
                            isOwn: true,
                            status: "sent",
                            };

                            // 4. Build final list
                            const items: Message[] = exists
                            ? withoutTemp
                            : [normalized, ...withoutTemp];

                            return {
                            messages: {
                                ...state.messages,
                                [conversationId]: {
                                ...convo,
                                items,
                                },
                            },
                            };
                        });
                    },
                    markMessageAsSynced: (messageId: string) => {
                        set((state) => {
                            const exists = state.syncedMessageIds.includes(messageId);

                            if (exists) return state;

                            return {
                            syncedMessageIds: [...state.syncedMessageIds, messageId],
                            };
                        });
                        },
                    addMessageToQueue: (payload) => {
                        set((state) => ({
                            offlineQueue: [...(state.offlineQueue || []), payload]
                        }));
                    },
                    retryOfflineMessages: async () => {
                        const { offlineQueue } = get();
                        if (!offlineQueue || offlineQueue.length === 0) return;

                        console.log("🔄 Đang thử gửi lại các tin nhắn offline...", offlineQueue);
                        
                        // Xóa queue hiện tại để tránh gửi lặp lại
                        set({ offlineQueue:[] });

                        for (const msg of offlineQueue) {
                            if (msg.type === 'direct' && msg.recipientId) {
                                await get().sendDirectMessage(msg.recipientId, msg.content, undefined, msg.tempId);
                            } else if (msg.type === 'group' && msg.conversationId) {
                                await get().sendGroupMessage(msg.conversationId, msg.content, undefined, msg.tempId);
                            }
                        }
                    },
        }),
    {
        name: "chat-storage",
        partialize: (state) => ({ conversations: state.conversations }) 
        // Khi reload trang thì danh sách chat vẫn được giữ lại
        // Không lưu danh sách tin nhắn vì nếu hacker chỉ thấy id của cuộc hội thoại thì cũng không sao
    })
);


