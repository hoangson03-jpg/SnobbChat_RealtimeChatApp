import { useAuthStore } from '@/stores/useAuthStore'
import type { Conversation } from '@/types/chat'
import React, { useState } from 'react'
import ChatCard from './ChatCard';
import { cn } from '@/lib/utils';
import { useChatStore } from '@/stores/useChatStore';
import UnreadCountBadge from './UnreadCountBadge';
import GroupChatAvatar from './GroupChatAvatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Ellipsis, Trash2 } from 'lucide-react';

const GroupChatCard = ({convo} : {convo: Conversation}) => {
  const {user} = useAuthStore();
  const {activeConversationId, setActiveConversation, messages, fetchMessages} = useChatStore();
  const [openAlert, setOpenAlert] = useState(false);

    if(!user) return null;

    const otherUser = convo.participants.find((p) => p._id !== user._id);

    if(!otherUser) return null;

    const unreadCount = convo.unreadCounts[user._id];
    const name = Array.isArray(convo.group)
  ? convo.group?.[0]?.name
  : convo.group?.name;
    // console.log("Tên nhóm: ",name);
    // console.log("Số thành viên", convo.participants)
    const handleSelectConversation = async (id: string) => {
      setActiveConversation(id);
      if(!messages[id]){
        // todo: fetch messages
        await fetchMessages();
      }
    }
  return (
    <ChatCard
    convoId={convo._id}
    name={name}
    timestamp={
      convo.lastMessage?.createdAt ? new Date(convo.lastMessage.createdAt) : undefined
    }
    isActive={activeConversationId === convo._id}
    onSelect={handleSelectConversation}
    unreadCounts={unreadCount}
    leftSection={
      <>
        {unreadCount > 0 && <UnreadCountBadge unreadCount={unreadCount}/>}
        <GroupChatAvatar
        participants={convo.participants}
        type="chat"/>
      </>
    }
    subtitle={
      <p className={cn("text-sm truncate text-muted-foreground")}>           
        {convo.participants.length} thành viên
      </p>
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
  )
}

export default GroupChatCard