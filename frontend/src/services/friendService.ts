import api from '@/lib/axios';
import { useFriendStore } from '@/stores/useFriendStore';

export const friendService = {
    async searchByUsername(username: string) {
        const res = await api.get(`/users/search?username=${username}`);
        return res.data.user;
    },

    async searchUsersList(query: string, page: number = 1, limit: number = 10) {
        try {
            // Encode URI component để tránh lỗi khi người dùng nhập ký tự đặc biệt
            const encodedQuery = encodeURIComponent(query);
            
            // Chú ý: Nếu route của bạn đặt trong friend.route.js thì đổi "/users" thành "/friends"
            const res = await api.get(`/users/searchUsers?q=${encodedQuery}&page=${page}&limit=${limit}`);
            
            // Backend trả về: { users: [...], hasMore: boolean }
            return res.data; 
        } catch (error) {
            console.error("Lỗi khi gọi API searchUsersList", error);
            throw error;
        }
    },

    async sendFriendRequest(to: string, message?: string) {
        const res = await api.post("/friends/requests", {to, message});
        // Đổi từ return res.data.message thành return res.data
        return res.data; 
    },

    async getAllFriendRequest() {
        try {
            const res = await api.get("/friends/requests");
            const {sent, received} = res.data;
            return {sent, received};
        } catch (error) {
            console.error("Lỗi khi gửi getAllFriendRequest", error);
        }
    },

    async acceptRequest(requestId: string) {
        try {
            const res = await api.post(`/friends/requests/${requestId}/accept`);
            return res.data.newFriend; 
        } catch (error) {
            console.error("Lỗi khi gửi acceptRequest", error);
            throw error;
        }
    },

    async declineRequest(requestId: string) {
        try {
            await api.post(`/friends/requests/${requestId}/declined`);
        } catch (error) {
            console.error("Lỗi khi gửi declineRequest", error);
        }
    },

    async getFriendList() {
        const res = await api.get("/friends");
        return res.data.friends;
    }
}