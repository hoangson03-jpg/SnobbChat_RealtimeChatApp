import type { Friend } from "@/types/user"
import UserAvatar from "../chat/UserAvatar";
import { X } from "lucide-react";


interface SelectedUserListProps {
    invitedUsers: Friend[];
    onRemove: (user: Friend) => void;
}

const SelectedUsersList = ({invitedUsers, onRemove} : SelectedUserListProps) => {
    if(invitedUsers.length === 0){
        return;
    }
  return (
    <div className="flex flex-wrap gap-2 pt-2">
        {
            invitedUsers.map((iu) => (
                <div 
                key={iu._id}
                className="flex items-center gap-1 bg-muted text-sm rounded-full px-3 py-1"
                >
                    <UserAvatar
                        type="chat"
                        name={iu.displayName}
                        avatarURL={iu.avatarURL}
                        />
                    <span>{iu.displayName}</span>

                    <X
                    className="size-3 cursor-pointer hover:text-destructive"
                    onClick={() => onRemove(iu)}
                    />
                </div>
            ))
        }
    </div>
  )
}

export default SelectedUsersList