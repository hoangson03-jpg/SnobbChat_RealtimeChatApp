import type { Conversation } from '@/types/chat'
import React from 'react'
import ChatCard from './ChatCard.tsx'
import { useAuthStore } from '@/stores/useAuthStore.ts'
import { useChatStore } from '@/stores/useChatStore.ts'
import { cn } from '@/lib/utils.ts'
import UserAvatar from './UserAvatar.tsx'
import StatusBadge from './StatusBadge.tsx'
import UnreadCountBadge from './UnreadCountBadge.tsx'
import { useSocketStore } from '@/stores/useSocketStore.ts'

const DirectMessageCard = ({convo} : {convo: Conversation}) => {
    const {user} = useAuthStore();
    const activeConversationId = useChatStore(s => s.activeConversationId);
    const setActiveConversation = useChatStore(s => s.setActiveConversation);
    const messages = useChatStore(s => s.messages);
    const fetchMessages = useChatStore(s => s.fetchMessages);
    const {onlineUsers} = useSocketStore();
    // console.log("🔥 DirectMessageCard", convo);

    if(!user) return null;

    const otherUser = convo.participants.find((p) => p._id !== user._id);

    if(!otherUser) return null;

    const unreadCount = convo.unreadCounts[user._id];
    // console.log("tin chưa đọc:",unreadCount);

    const lastMessage = convo.lastMessage?.content ?? "";

    const handleSelectConversation = async (id: string) => {
      setActiveConversation(id);
      if(!messages[id]) {
        // todo: fetch messages
        await fetchMessages();
      }
    }
    
  return (
    <ChatCard
    convoId={convo._id}
    name={otherUser.displayName ?? ""}
    timestamp={
      convo.lastMessage?.createdAt ? new Date(convo.lastMessage.createdAt) : undefined
    }
    isActive={activeConversationId === convo._id}
    onSelect={handleSelectConversation}
    unreadCounts={unreadCount}
    leftSection={
      <>
      {/* todo: user avatar */}
      <UserAvatar type="sidebar" 
      name={otherUser.displayName ?? ""}
      avatarURL={otherUser.avatarURL ?? undefined}
      />
      {/* socket io */}
      {/* todo: status badge */}
      <StatusBadge status = {onlineUsers.includes(otherUser?._id ?? "") ? "online" : "offline"} />
      {/* todo: unread count */}
      {
        unreadCount > 0 && <UnreadCountBadge unreadCount={unreadCount}/>
      }
      </>
    }
    subtitle={
      <p className={cn("text-sm truncate", unreadCount > 0 ? "font-medium text-foreground" : "text-muted-foreground")}>
        {lastMessage}
      </p>
    }
    />
  )
}

export default DirectMessageCard