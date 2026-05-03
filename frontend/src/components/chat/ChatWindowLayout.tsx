import { useChatStore } from '@/stores/useChatStore'
import React, { useEffect } from 'react'
import ChatWelcomeScreen from './ChatWelcomeScreen';
import ChatWindowSkeleton from './ChatWindowSkeleton';
import { SidebarInset } from '../ui/sidebar';
import ChatWindowHeader from './ChatWindowHeader';
import ChatWindowBody from './ChatWindowBody';
import MessageInput from './MessageInput';

const ChatWindowLayout = () => {

const activeConversationId = useChatStore(s => s.activeConversationId);
const conversations = useChatStore(s => s.conversations);
const loading = useChatStore(s => s.messagesLoading);
const markAsSeen = useChatStore(s => s.markAsSeen);

  const selectedConvo = conversations.find((c) => c._id === activeConversationId) ?? null;

  useEffect(() => {
  if (!activeConversationId) return;

  markAsSeen();
}, [activeConversationId]);

  if(!selectedConvo) {
    return <ChatWelcomeScreen />
  }

  if(loading){
    return <ChatWindowSkeleton />
  }

  return (
    <SidebarInset className='flex flex-col h-full flex-1 overflow-hidden rounded-sm shadow-md'>
      {/* Header */}
      <ChatWindowHeader chat={selectedConvo}/>

      {/* Body */}
      <div className='flex-1 overflow-y-auto bg-primary-foreground'>
      <ChatWindowBody />
      </div>

      {/* Footer */}
      <MessageInput selectedConvo={selectedConvo}/>
    </SidebarInset>
  )
}

export default ChatWindowLayout