import { useAuthStore } from '@/stores/useAuthStore'
import React, { useEffect, useState } from 'react'
import { Navigate, Outlet } from 'react-router';

const ProtectedRoute = () => {
    const { accessToken, user, loading, refresh, fetchMe } = useAuthStore();
    const [starting, setStarting] = useState(true);

    const init = async () => {
        try {
            // Cố gắng gọi refresh token (Sẽ ném lỗi 403 nếu chưa đăng nhập hoặc vừa đăng ký xong)
            await refresh(); 

            // Nếu thành công đi tiếp xuống đây
            const state = useAuthStore.getState();
            if (state.accessToken && !state.user) {
                await fetchMe();
            }
        } catch (error) {
            // Bắt lỗi 403 ở đây -> Code không bị crash/đơ nữa
            console.log("Chưa có token hoặc token hết hạn, chuẩn bị chuyển hướng...");
        } finally {
            // QUAN TRỌNG NHẤT: Bất kể lỗi hay không, đều phải tắt màn hình Loading
            setStarting(false);
        }
    }

    useEffect(() => {
        init();
    }, [])

    // Đang kiểm tra token -> Hiện loading
    if (starting || loading) {
        return <div className='flex h-screen items-center justify-center'>Đang tải trang...</div>
    }

    // Kiểm tra xong mà không có token -> Đá về trang signin
    if (!accessToken) {
        return (
            <Navigate 
             to='/signin'
             replace
            />
        )
    }

    // Có token -> Cho phép vào trang
    return (
        <Outlet />
    )
}

export default ProtectedRoute;