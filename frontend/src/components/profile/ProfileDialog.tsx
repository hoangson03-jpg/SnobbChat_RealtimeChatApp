import type { Dispatch, SetStateAction } from "react";
import { Dialog, DialogContent } from "../ui/dialog";
import ProfileCard from "./ProfileCard";
import { useAuthStore } from "@/stores/useAuthStore";

interface ProfileDialogProps {
    open: boolean;
    setOpen: Dispatch<SetStateAction<boolean>>;
}

const ProfileDialog = ({open, setOpen} : ProfileDialogProps) => {
    const {user} = useAuthStore();
  return (
    <Dialog
    open={open}
    onOpenChange={setOpen}
    >
        <DialogContent className="w-full max-w-lg md:max-w-2xl rounded-md overflow-y-auto p-0 bg-transparent border-0 shadow-2xl">
            <div className="bg-gradient-glass">
                <div className="max-w-4xl mx-auto p-4">
                    {/* heading */}
                    <div className="mb-6">
                        <h1 className="text-2xl font-bold text-foreground">
                            Hồ sơ & Thiết lập 
                        </h1>
                    </div>
                    {/* Profile card */}
                    <ProfileCard
                    user={user}
                    />
                </div>
            </div>
        </DialogContent>
    </Dialog>
  )
}

export default ProfileDialog