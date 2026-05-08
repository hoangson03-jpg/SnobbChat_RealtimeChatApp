import { friendService } from "@/services/friendService";
import type { FriendState } from "@/types/store";
import { toast } from "sonner";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useFriendStore = create <FriendState>((set, get) => ({
    loading: false,
    friends: [],
    receivedList: [],
    sentList: [],
    searchResults: [],
    searchHasMore: false,
    searchPage: 0,
    searchQuery: "",
    
    searchByUsername: async (username) => {
        try {
            set({loading: true});

            const user = await friendService.searchByUsername(username);

            return user;
        } catch (error) {
            console.error("Lỗi xảy ra khi tìm user bằng username", error);
            return null;
        }
        finally{
            set({loading: false});
        }
    },
    searchUsersList: async (query, page = 1) => {
    try {
        set({ loading: true });
        // Gọi API: /users/search?q=${query}&page=${page}&limit=10
        const res = await friendService.searchUsersList(query, page); 
        
        set((state) => ({
            searchResults: page === 1 ? res.users : [...state.searchResults, ...res.users],
            searchPage: page,
            searchHasMore: res.hasMore,
            searchQuery: query
        }));
    } catch (error) {
        console.error(error);
    } finally {
        set({ loading: false });
    }
},
    resetSearch: () => set({ searchResults: [], searchPage: 1, searchHasMore: false, searchQuery: "" }),
    addFriend: async (to, message) => {
        try {
            set({ loading: true });

            // Lấy data từ service (đã sửa ở bước 2 để nhận về cả request)
            const data = await friendService.sendFriendRequest(to, message);

            // THÊM DÒNG NÀY: Cập nhật UI ngay lập tức cho người gửi
            set((state) => ({
                sentList: [data.request, ...state.sentList]
            }));

            // Vẫn return message để UI hiển thị thông báo (toast) như cũ
            return data.message;

        } catch (error: any) {
            console.error("Lỗi xảy ra khi add friend", error);
            const msg = error?.response?.data?.message || "Gửi kết bạn thất bại";
            throw new Error(msg);
        } finally {
            set({ loading: false });
        }
    },
    addReceivedRequest: (request) => set((state) => ({
        receivedList: [request, ...state.receivedList]
    })),
    // Lọc bỏ request bị từ chối khỏi danh sách đã gửi
    removeSentRequest: (requestId) => set((state) => ({
        sentList: state.sentList.filter((r) => r._id !== requestId)
    })),
    getAllFriendRequests: async () => {
        try {
            set({loading: true});

            const result = await friendService.getAllFriendRequest();

            if(!result) {
                return;
            }

            const {received, sent} = result;

            set({receivedList: received, sentList: sent});
        } catch (error) {
            console.error("Lỗi xảy ra khi getAllFriendRequests", error)
        }
        finally{
            set({loading: false})
        }
    },
    acceptRequest: async (requestId) => {
        try {
            set({loading: true});
            // Lấy thông tin bạn mới từ API
            const newFriend = await friendService.acceptRequest(requestId);

            set((state) => ({
                // Xóa khỏi danh sách chờ
                receivedList: state.receivedList.filter((r) => r._id !== requestId),
                // Thêm luôn vào danh sách bạn bè
                friends: [newFriend, ...state.friends] 
            }))
        } catch (error) {
            console.error("Lỗi khi accept request", error);
        } finally {
            set({loading: false});
        }
    },
    handleFriendAcceptedSocket: (requestId, newFriend) => set((state) => ({
        // Xóa lời mời khỏi danh sách đã gửi
        sentList: state.sentList.filter((r) => r._id !== requestId),
        // Thêm bạn mới vào danh sách
        friends: [newFriend, ...state.friends]
    })),
    declineRequest: async (requestId) => {
        try {
            set({loading: true});
            await friendService.declineRequest(requestId);

            set((state) => ({
                receivedList: state.receivedList.filter((r) => r._id !== requestId)
            }))
        } catch (error) {
            console.error("Lỗi khi decline request", error);
        }
        finally{
            set({loading: false})
        }
    },
    getFriends: async () => {
        try {
            set({loading: true});
            const friends = await friendService.getFriendList();
            set({friends: friends});
        } catch (error) {
            console.error("Lỗi xảy ra khi load friends", error);
            set({friends: []});
        } finally {
            set({loading: false});
        }
    },
    
        removeFriend: async (friendId: string) => {
        try {
            set({ loading: true });
            
            // 1. Gọi API (Giả sử bạn đã viết hàm removeFriend trong friendService)
            await friendService.removeFriend(friendId);
            
            // 2. Cập nhật Store: Loại bỏ người bạn vừa xóa khỏi mảng
            set((state) => ({
                friends: state.friends.filter((f) => f._id !== friendId)
            }));
            
            // 3. (Tùy chọn) Hiển thị thông báo thành công
            toast.success("Đã hủy kết bạn thành công!");
        } catch (error) {
            console.error("Lỗi khi hủy kết bạn", error);
            toast.error("Không thể hủy kết bạn. Vui lòng thử lại.");
            throw error; // Ném lỗi để component bên ngoài biết nếu cần
        } finally {
            set({ loading: false });
        }
    },

    handleRemoveFriendSocket: (friendId: string) => {
        set((state) => ({
            friends: state.friends.filter(f => f._id !== friendId)
        }));
    },
}))