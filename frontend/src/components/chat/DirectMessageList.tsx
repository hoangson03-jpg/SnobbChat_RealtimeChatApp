import React from 'react'
import { useChatStore } from '@/stores/useChatStore'
import DirectMessageCard from './DirectMessageCard';

const DirectMessageList = () => {
  const {conversations} = useChatStore();

  if(!conversations) return; 
  // console.log("🔥 DirectMessageList render");
  const directConversations = conversations.filter((convo) => convo.type === 'direct');
  // console.log("🔥 conversations:", conversations);
  // console.log("🔥 directConversations:", directConversations);
  return (
    <div className="flex-1 overflow-y-auto p-2 space-y-2">
      {
      directConversations.map((convo) => {
  // console.log("🔥 render convo:", convo);
  return <DirectMessageCard key={convo._id} convo={convo} />;
})
      }
      </div>
  )
}

export default DirectMessageList