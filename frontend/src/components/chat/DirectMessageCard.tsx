import type { Conversation } from '@/types/chat'
import React, { useState } from 'react'
import ChatCard from './ChatCard.tsx'
import { useAuthStore } from '@/stores/useAuthStore.ts'
import { useChatStore } from '@/stores/useChatStore.ts'
import { cn } from '@/lib/utils.ts'
import UserAvatar from './UserAvatar.tsx'
import StatusBadge from './StatusBadge.tsx'
import UnreadCountBadge from './UnreadCountBadge.tsx'
import { useSocketStore } from '@/stores/useSocketStore.ts'

// Import Icon từ lucide-react
import { Ellipsis, Trash2 } from 'lucide-react'

// Import thư viện UI
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuTrigger 
} from '../ui/dropdown-menu'
import { 
    AlertDialog, 
    AlertDialogAction, 
    AlertDialogCancel, 
    AlertDialogContent, 
    AlertDialogDescription, 
    AlertDialogFooter, 
    AlertDialogHeader, 
    AlertDialogTitle 
} from '../ui/alert-dialog.tsx'
import { toast } from 'sonner'

const DirectMessageCard = ({convo} : {convo: Conversation}) => {
    const {user} = useAuthStore();
    const activeConversationId = useChatStore(s => s.activeConversationId);
    const setActiveConversation = useChatStore(s => s.setActiveConversation);
    const messages = useChatStore(s => s.messages);
    const fetchMessages = useChatStore(s => s.fetchMessages);
    const deleteConversation = useChatStore(s => s.deleteConversation);
    
    const {onlineUsers} = useSocketStore();
    
    // State quản lý việc bật/tắt hộp thoại cảnh báo xóa
    const [openAlert, setOpenAlert] = useState(false);

    if(!user) return null;
    const me = convo.participants.find((p) => p._id === user._id); // Tìm chính mình

    const otherUser = convo.participants.find((p) => p._id !== user._id);
    if(!otherUser) return null;

    const unreadCount = convo.unreadCounts[user._id];


// 1. Lấy thời gian tin nhắn cuối (ưu tiên createdAt, fallback lastMessageAt)
const msgTime = convo.lastMessage?.createdAt || convo.lastMessageAt;

// 2. Logic so sánh: 
const isMessageCleared = () => {
    if (!msgTime || !me?.clearedAt) return false;

    const t1 = new Date(msgTime).getTime();
    const t2 = new Date(me.clearedAt).getTime();

    // Nếu tin nhắn được tạo trước hoặc bằng lúc mình xóa -> Ẩn
    return t1 <= t2;
};

// 3. Nếu là tin nhắn cũ đã bị xóa -> return null (Card biến mất khỏi Sidebar)
if (isMessageCleared()) return null;

const displayLastMessage = convo.lastMessage?.content ?? "";
    const handleSelectConversation = async (id: string) => {
      setActiveConversation(id);
      if(!messages[id]) {
        await fetchMessages();
      }
    }

    // Hàm gọi xóa
    const handleDelete = async () => {
        try {
            await deleteConversation(convo._id);
            toast.success("Đã xóa cuộc trò chuyện");
            setOpenAlert(false);
        } catch (error) {
            toast.error("Không thể xóa cuộc trò chuyện");
        }
    }
    
  return (
    <>
      <div className="relative group">
        
        <ChatCard
            convoId={convo._id}
            name={otherUser.displayName ?? ""}
            timestamp={convo.lastMessage?.createdAt ? new Date(convo.lastMessage.createdAt) : undefined}
            isActive={activeConversationId === convo._id}
            onSelect={handleSelectConversation}
            unreadCounts={unreadCount}
            leftSection={
                <>
                    <UserAvatar type="sidebar" name={otherUser.displayName ?? ""} avatarURL={otherUser.avatarURL ?? undefined} />
                    <StatusBadge status={onlineUsers.includes(otherUser?._id ?? "") ? "online" : "offline"} />
                    {unreadCount > 0 && <UnreadCountBadge unreadCount={unreadCount}/>}
                </>
            }
             subtitle={
            !isMessageCleared() && displayLastMessage ? (
                <p className={cn("text-sm truncate", unreadCount > 0 ? "font-medium text-foreground" : "text-muted-foreground")}>
                    {displayLastMessage}
                </p>
            ) : null
        }
            rightSection={
                <DropdownMenu>
                    <DropdownMenuTrigger 
                        className="p-1 rounded-md hover:bg-background/80 outline-none flex items-center justify-center"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <Ellipsis className="size-4 text-muted-foreground" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                            className="text-red-500 cursor-pointer"
                            onClick={(e) => {
                                e.stopPropagation(); 
                                setOpenAlert(true);
                            }}
                        >
                                    <Trash2 className="mr-2 size-4" />
                                    Xóa hội thoại
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    }
                />
        </div>
      {/* 3. alert delete convo */}
      <AlertDialog open={openAlert} onOpenChange={setOpenAlert}>
          <AlertDialogContent onClick={(e) => e.stopPropagation()}>
              <AlertDialogHeader>
                  <AlertDialogTitle>Xóa cuộc trò chuyện?</AlertDialogTitle>
                  <AlertDialogDescription>
                      Bạn sắp xóa cuộc trò chuyện với <span className="font-semibold text-foreground">{otherUser.displayName}</span>. 
                      Hành động này không thể hoàn tác.
                  </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                  <AlertDialogCancel onClick={(e) => e.stopPropagation()}>Hủy</AlertDialogCancel>
                  <AlertDialogAction 
                      onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleDelete();
                      }}
                      className="bg-red-500 hover:bg-red-600 text-white"
                  >
                      Xóa vĩnh viễn
                  </AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export default DirectMessageCard