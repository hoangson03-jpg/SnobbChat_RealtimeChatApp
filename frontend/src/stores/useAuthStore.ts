import {create} from 'zustand';
import {toast} from 'sonner';
import authService from '@/services/authService';
import type { AuthState } from '@/types/store';
import axios from 'axios'
import { data } from 'react-router';
import { persist } from 'zustand/middleware';
import { useChatStore } from './useChatStore';

export const useAuthStore = create<AuthState>()(
    persist((set, get) => ({
    accessToken: null,
    user: null,
    loading: false,
    messagesLoading: false,
    convoLoading: false,

    clearState: () => {
        set({accessToken: null, user: null, loading: false});
        localStorage.clear();
        useChatStore.getState().reset();
        sessionStorage.clear();
    },

    signUp: async (username, password, email, firstname, lastname) => {
        try {
            set({ loading: true });
            // gọi API
            await authService.signUp(username,password,email,firstname,lastname)

            toast.success('Đăng ký thành công! Bạn sẽ được chuyển sang trang đăng nhập');
        } catch (error) {
            console.error(error);
            toast.error('Đăng ký không thành công!');
        }
        finally{
            set({ loading: false });
        }
    },
    // 2 step verification OTP/ email
    verifyOTP: async (email, otp) => {
        try {
            set({ loading: true });
            const res = await authService.verifyOTP(email, otp);
            toast.success(res.message || 'Xác thực email thành công!');
            return true;
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Mã OTP không hợp lệ');
            return false;
        } finally {
            set({ loading: false });
        }
    },

    // Gửi lại mã OTP
    resendOTP: async (email) => {
        try {
            set({ loading: true });
            const res = await authService.resendOTP(email);
            toast.success(res.message || 'Mã OTP mới đã được gửi!');
            return true;
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Lỗi gửi lại mã');
            return false;
        } finally {
            set({ loading: false });
        }
    },

    signIn: async (username, password) => {
        try {
            get().clearState();
            set({ loading: true});
            localStorage.clear();
            useChatStore.getState().reset();
            // gọi API
            const {accessToken} = await authService.signIn(username, password);
            get().setAcessToken(accessToken);
            toast.success('Đăng nhập thành công! Chào mừng đến với SnobbChat!')

            await get().fetchMe();
            useChatStore.getState().fetchConversations();
            
        } catch (error) {
            console.error(error);
            toast.error('Đăng nhập thất bại!')
            throw error;
        }
        finally {
            set({ loading: false});
        }
    },

    signOut: async () => {
        try {
            set({ loading: true }); // Đánh dấu đang xử lý

            // 1. Ép trình duyệt phải đợi API phản hồi xong
            console.log("Gửi yêu cầu Logout...");
            const response = await authService.signOut();
            console.log("Server đã phản hồi:", response);

            // 2. Hiện Toast ngay khi API xong
            toast.success("Logout thành công!");

            // 3. Quan trọng: Tạo một khoảng trễ nhỏ (Optional)
            // để đảm bảo Toast đã được render vào DOM
            await new Promise(resolve => setTimeout(resolve, 300));

            // 4. Cuối cùng mới xóa state để chuyển trang
            get().clearState();

        } catch (error) {
            console.error("Lỗi API bị ngắt hoặc lỗi server:", error);
            toast.error("Logout thất bại!");
        } finally {
            set({ loading: false });
        }
    },

    fetchMe: async () => {
        try {
            set({loading: true});
            const user = await authService.fetchMe();
            console.log("Server có phản hồi", user)
            set({user});
        } catch (error) {
            console.error(error);
            set({user: null, accessToken: null});
            toast.error("Lỗi xảy ra khi lấy thông tin người dùng. Xin hãy thử lại")
        }
        finally {
            set({ loading: false });
        }
    },

    refresh: async () => {
    try {
        set({ loading: true });
        const { user, fetchMe, setAcessToken } = get();
        const accessToken = await authService.refresh();

        setAcessToken(accessToken);

        if (!user) {
            await fetchMe();
        }
    } catch (error) {
        console.error(error);

        if (axios.isAxiosError(error)) {
            const status = error.response?.status;
            if (status === 403) {
                toast.warning("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!");
            }
        } else {
            // Xử lý các lỗi khác không phải từ API (ví dụ: lỗi mạng, lỗi code frontend,...)
        }

        get().clearState();
    } finally {
        set({ loading: false });
    }
},

    setAcessToken: async (accessToken) => {
        set({accessToken});
    },

    setUser: (user) => {
        set({user});
    },
}), {
    name: "auth-storage",
    partialize: (state) => ({ user: state.user}), // chỉ persist user
}) 
);