import { useAuthStore } from '@/stores/useAuthStore';
import axios from 'axios'
import { config } from 'zod';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    withCredentials: true,
});

// Gắn access token vào req header
api.interceptors.request.use((config) => {
    const {accessToken} = useAuthStore.getState();

    if(accessToken){
        config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
})

// tự động gọi refresh api khi access token hết hạn
api.interceptors.response.use((res) => res, async (error) =>{
    const originalRequest = error.config;

    // những api không cần check
    if(originalRequest.url.includes("/auth/signin") || originalRequest.url.includes("/auth/signup") || originalRequest.url.includes("/auth/refresh")){
        return Promise.reject(error);
    }
    originalRequest._retryCount = originalRequest._retryCount || 0;
    if(error.response?.status === 403 && originalRequest._retryCount < 4){
        originalRequest._retryCount ++;
        console.log("refresh", originalRequest._retryCount)
        try {
            const res = await api.post("/auth/refresh", {withCredentials: true})
            const newAcessToken = res.data.accessToken;

            useAuthStore.getState().setAcessToken(newAcessToken);

            originalRequest.headers.Authorization = `Bearer ${newAcessToken}`;
            return api(originalRequest)
        } catch (refreshError) {
            useAuthStore.getState().clearState();
            return Promise.reject(refreshError);
        }
    }

    return Promise.reject(error);
})
export default api;