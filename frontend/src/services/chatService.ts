import api from '../lib/axios';
import type { ConversationResponse, Message } from '@/types/chat';

interface FetchMessagesProps {
    messages: Message[],
    cursor?: string // Phân trang
}

const pageLimit = 50;

export const chatService = {
    async fetchConversations(): Promise<ConversationResponse> {
        const res = await api.get("/conversations");
        return res.data;
    },
    async fetchMessages(id: string, cursor?: string) : Promise<FetchMessagesProps> {
    const res = await api.get(`/conversations/${id}/messages?limit=${pageLimit}&cursor=${cursor}`);
    
    return {messages: res.data.messages, cursor: res.data.nextCursor}
    },
    sendDirectMessage: async (recipientId: string, content: string, imgURL?: string, conversationId?: string, tempId?: string) => {
    const response = await api.post('/messages/direct', {
        recipientId,
        content,
        imgURL,
        conversationId,
        tempId // Thêm tempId vào object body
    });
    return response.data;
    },
    sendGroupMessage: async (conversationId: string, content: string, imgURL?: string, tempId?: string) => {
        const response = await api.post('/messages/group', {
            conversationId,
            content,
            imgURL,
            tempId // BẮT BUỘC TRUYỀN XUỐNG ĐÂY
        });
        return response.data;
    },
    async markAsSeen(conversationId: string) {
        const res = await api.patch(`/conversations/${conversationId}/seen`);
        return res.data;
    },

    async createConversation (type: "direct" | "group", name: string, memberIds: string[]) {
        const res = await api.post("/conversations", {type, name, memberIds});
        return res.data.formatted;
    },

    async deleteConversation(conversationId: string) {
        const res = await api.delete(`/conversations/${conversationId}`);
        return res.data;
    }
}

