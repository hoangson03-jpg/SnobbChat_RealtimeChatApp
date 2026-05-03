import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

interface IUserAvatarProps {
        type: "sidebar" | "chat" | "profile";
        name: string;
        avatarURL?: string;
        className?: string;
    }

const UserAvatar = ({type, name, avatarURL, className} : IUserAvatarProps) => {
    const bgColor = !avatarURL ? "bg-blue-400" : "";

    if (!name){
        name = "SnobbChat";
    }
    return (
        <Avatar
            className={cn(className ?? "", 
                type === "sidebar" && "size-12 text-base",
                type === "chat" && "size-8 text-sm",
                type === "profile" && "size-24 text-3xl shadow-md"
            )}>
                <AvatarImage src={avatarURL} alt={name}></AvatarImage>
                <AvatarFallback className={`${bgColor} text-white font-semibold`}>{name.charAt(0)}</AvatarFallback>
        </Avatar>
    )
}

export default UserAvatar;