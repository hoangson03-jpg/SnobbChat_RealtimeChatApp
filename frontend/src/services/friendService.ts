import api from '@/lib/axios';
import { useFriendStore } from '@/stores/useFriendStore';

export const friendService = {
    async searchByUsername(username: string) {
        const res = await api.get(`/users/search?username=${username}`);
        return res.data.user;
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