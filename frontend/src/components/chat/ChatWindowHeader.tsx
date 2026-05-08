import { useChatStore } from '@/stores/useChatStore'
import type { Conversation } from '@/types/chat'
import React, { useEffect, useMemo, useState } from 'react'
import { SidebarTrigger } from '../ui/sidebar';
import { useAuthStore } from '@/stores/useAuthStore';
import { Separator } from '../ui/separator';
import UserAvatar from './UserAvatar';
import StatusBadge from './StatusBadge';
import GroupChatAvatar from './GroupChatAvatar';
import { useSocketStore } from '@/stores/useSocketStore';
import ProfileDialog from "../profile/ProfileDialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { toast } from 'sonner';
import { useFriendStore } from '@/stores/useFriendStore';
import type { User } from '@/types/user';

const ChatWindowHeader = ({chat} : {chat? : Conversation}) => {
  const {user} = useAuthStore();
  const {onlineUsers} = useSocketStore();
  const [profileOpen, setProfileOpen] = useState(false);
  const removeFriend = useFriendStore((state) => state.removeFriend);
  
  const otherUsers = chat?.participants.filter((p) => p._id !== user?._id)
    const otherUser = useMemo(() => {
    if (chat?.type !== 'direct') return null;
    return chat?.participants.find((p) => p._id !== user?._id) || null;
  }, [chat?.participants, user?._id]);

  const userForProfile: User = {
      _id: otherUser?._id || "",
      displayName: otherUser?.displayName || "",
      avatarURL: otherUser?.avatarURL || "",
      username: "", // Nếu Participant không có, để rỗng
      email: "", // Nếu không có, để rỗng hoặc giá trị mặc định
      bio:  "",
  };

    // console.log("ChatWindowLayout render");
  
  // console.log(chat)

  if(!chat){
    return (
        <header className='md:hidden sticky top-0 z-10 flex items-center gap-2 px-4 py-2 w-full'>
            <SidebarTrigger className='-ml-1 text-foreground'/>
        </header>
    )
  }

  if(chat.type === 'direct'){
    if(!user || !otherUser) return;
  }
useEffect(() => {
  // console.log("Chat changed:", chat);
}, [chat]);

const handleRemoveFriend = async () => {
  
    if (!otherUser) return;
    try {
      await removeFriend(otherUser._id);
      toast.success("Đã hủy kết bạn!");
    } catch (err) {
      toast.error("Hủy kết bạn thất bại");
    }
  };
  return (
    <header className='sticky top-0 z-10 px-4 py-2 flex items-center bg-background'>
        <div className='flex items-center gap-2 w-full'>
            <SidebarTrigger className='-ml-1 text-foreground' />
            <Separator 
            orientation='vertical'
            className='mr-2 data-[orientation=vertical]:h-4'  />

            <div className='p-2 w-full flex items-center gap-3'>
                {/* avatar */}
                <DropdownMenu>
                <DropdownMenuTrigger className="outline-none">
                  <div className='relative cursor-pointer'>
                    {chat?.type === 'direct' ? (
                      <>
                        {/* Đã thêm type="chat" để khớp với Interface */}
                        <UserAvatar 
                          type="chat" 
                          name={otherUser?.displayName ?? "Snobbchat"} 
                          avatarURL={otherUser?.avatarURL ?? ""} 
                        />
                        <StatusBadge status={onlineUsers.includes(otherUser?._id ?? "") ? "online" : "offline"} />
                      </>
                    ) : (
                      <GroupChatAvatar participants={chat?.participants} type={'sidebar'} />
                    )}
                  </div>
                </DropdownMenuTrigger>

                {chat?.type === 'direct' && (
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem onClick={() => setProfileOpen(true)}>
                      Xem thông tin
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-red-500" onClick={handleRemoveFriend}>
                      Hủy kết bạn
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                )}
              </DropdownMenu>

              {/* Thêm ProfileDialog vào đây */}
              {otherUser && (
                <ProfileDialog 
                  open={profileOpen} 
                  setOpen={setProfileOpen} 
                  user={userForProfile} // Truyền user vào nếu ProfileDialog của bạn cần
                />
              )}
                {/* tên tài khoản ở header */}
                <h2 className='font-semibold text-foreground'>
                    {chat?.type === "direct" ? otherUser?.displayName : chat?.group?.name}
                </h2>
            </div>
        </div>
    </header>
  )
}

export default ChatWindowHeader