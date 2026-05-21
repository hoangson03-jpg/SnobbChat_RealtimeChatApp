import React from 'react'
import { useChatStore } from '@/stores/useChatStore'
import DirectMessageCard from './DirectMessageCard';

const DirectMessageList = () => {
  const {conversations} = useChatStore();

  if(!conversations) return; 
  const directConversations = conversations
    .filter((convo) => convo.type === 'direct')
    .sort((a, b) => {
        // Lấy thời gian của tin nhắn cuối hoặc thời gian update
        const timeA = new Date(a.lastMessage?.createdAt || a.updatedAt || 0).getTime();
        const timeB = new Date(b.lastMessage?.createdAt || b.updatedAt || 0).getTime();
        
        return timeB - timeA; // Sắp xếp giảm dần (Mới nhất ở trên)
    });
  return (
     <div className="flex-1 overflow-y-auto p-2 space-y-2">
      {
        directConversations.map((convo) => (
          <DirectMessageCard key={convo._id} convo={convo} />
        ))
      }
    </div>
  )
}

export default DirectMessageList