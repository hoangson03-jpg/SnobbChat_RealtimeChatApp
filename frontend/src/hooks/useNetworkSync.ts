import { useEffect } from 'react';
import { useChatStore } from '@/stores/useChatStore';
import { toast } from 'sonner';

export const useNetworkSync = () => {
    useEffect(() => {
        const handleOnline = () => {
            toast.success("Đã khôi phục kết nối mạng! Đang đồng bộ tin nhắn...");
            // Gọi hàm gửi lại các tin nhắn bị kẹt ở offlineQueue
            useChatStore.getState().retryOfflineMessages();
        };

        const handleOffline = () => {
            toast.error("Bạn đang offline. Tin nhắn sẽ được gửi khi có mạng lại.");
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    },[]);
};