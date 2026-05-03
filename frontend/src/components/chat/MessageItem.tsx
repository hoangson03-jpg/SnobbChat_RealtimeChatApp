import { cn, formatMessageTime } from '@/lib/utils';
import type { Conversation, Message, Participant } from '@/types/chat'
import React from 'react'
import UserAvatar from './UserAvatar';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';

interface MessageItemProps {
    message: Message;
    index: number;
    messages: Message[];
    selectedConvo: Conversation;
    lastMessageStatus: "delivered" | "seen"
}

const MessageItem = ({message, index, messages, selectedConvo, lastMessageStatus} : MessageItemProps) => {
    const prev = messages[index - 1];

    const isShowTime =
    index === 0 ||
    !prev ||
    message.senderId !== prev.senderId ||
    (new Date(message.createdAt).getTime() - new Date(prev.createdAt).getTime()) > 5 * 60 * 1000;

    const isGroupBreak = isShowTime || 
    message.senderId !== prev?.senderId;

    const participant = selectedConvo.participants?.find(
        (p) => p._id && message.senderId && p._id.toString() === message.senderId.toString()
    );
     
  return (
    <>
    {/* time */}
            {isShowTime && (
  <div className="w-full text-center">
    <span className="text-xs text-muted-foreground px-1">
      {formatMessageTime(new Date(message.createdAt))}
    </span>
  </div>
)}
            <div
    className={cn('flex gap-2 message-bounce', message.isOwn ? "justify-end" : "justify-start")}
    >
        {/* avatar */}
    {!message.isOwn && (
        <div className='w-8'>
            {isGroupBreak && (
                <UserAvatar
                type='chat'
                name={participant?.displayName ?? "SnobbChat"}
                avatarURL={participant?.avatarUrl ?? undefined}
                />
            )}
        </div>
    )}
        {/* tin nhắn */}
        <div className={cn("max-w-xs lg:max-w-md space-y-1 flex flex-col mt-2 rounded-md", message.isOwn ? "items-end" : "items-start")}>
            <Card className={cn("p-3 rounded-sm", message.isOwn ? "chat-bubble-sent border-0" : "chat-bubble-received")}>
                <p className='text-sm leading-relaxed break-words'>{message.content}</p>
            </Card>
            
            {/* seen / delivered */}
            {message.isOwn && message._id === selectedConvo.lastMessage?._id && (
                <Badge
                    variant='outline'
                    className={cn("text-xs px-1.5 py-0.5 h-4 border-0", lastMessageStatus === 'seen' ? "bg-primary/20 text-primary rounded-md" : "bg-muted text-m rounded-md")}
                >
                    {lastMessageStatus}
                </Badge>
            )}
        </div>
    </div>
    </>
    
  )
}

export default MessageItem