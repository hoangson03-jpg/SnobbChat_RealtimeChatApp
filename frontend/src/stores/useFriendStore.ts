import { friendService } from "@/services/friendService";
import type { FriendState } from "@/types/store";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useFriendStore = create <FriendState>((set, get) => ({
    loading: false,
    friends: [],
    receivedList: [],
    sentList: [],
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
    addFriend: async (to, message) => {
        try {
            set({ loading: true });

            const resultMessage = await friendService.sendFriendRequest(to, message);

            return resultMessage;

        } catch (error: any) {
            console.error("Lỗi xảy ra khi add friend", error);

            // lấy message từ backend nếu có
            const msg = error?.response?.data?.message || "Gửi kết bạn thất bại";

            throw new Error(msg); // ❗ QUAN TRỌNG

        } finally {
            set({ loading: false });
        }
    },
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
            await friendService.acceptRequest(requestId);

            set((state) => ({
                receivedList: state.receivedList.filter((r) => r._id !== requestId)
            }))
        } catch (error) {
            console.error("Lỗi khi accept request", error);
        }
    },
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
    }
}))