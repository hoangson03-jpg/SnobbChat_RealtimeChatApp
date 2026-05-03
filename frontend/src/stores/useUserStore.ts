
import { userService } from "@/services/userService";
import type { UserState } from "@/types/store";
import { create } from "zustand";
import { useAuthStore } from "./useAuthStore";
import { toast } from "sonner";
import { useChatStore } from "./useChatStore";

export const useUserStore = create<UserState>((set, get) => ({
    updateAvatarURL: async (formData) => {
        try {
            const {user, setUser} = useAuthStore.getState();
            const data = await userService.uploadAvatar(formData);

            if(user) {
                setUser ({
                    ...user,
                    avatarURL: data.avatarURL
                });

                useChatStore.getState().fetchConversations();
            }
        } catch (error) {
            console.error("Lỗi khi updateAvatarURL", error);
            toast.error("Upload avatar không thành công")
        }
    }
}))