import { useAuthStore } from '@/stores/useAuthStore'
import type { Conversation } from '@/types/chat'
import React from 'react'
import ChatCard from './ChatCard';
import { cn } from '@/lib/utils';
import { useChatStore } from '@/stores/useChatStore';
import UnreadCountBadge from './UnreadCountBadge';
import GroupChatAvatar from './GroupChatAvatar';

const GroupChatCard = ({convo} : {convo: Conversation}) => {
  const {user} = useAuthStore();
  const {activeConversationId, setActiveConversation, messages, fetchMessages} = useChatStore();

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
    />
  )
}

export default GroupChatCard