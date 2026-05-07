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
    // TRONG flex-col-reverse:
    // index + 1 mới là tin nhắn cũ hơn (nằm ở trên)
    const olderMsg = messages[index + 1]; 

    const isOwn = message.isOwn;

    // Hiển thị thời gian nếu là tin nhắn cũ nhất (cuối mảng) 
    // hoặc khoảng cách với tin cũ hơn > 5 phút
    const isShowTime =
        index === messages.length - 1 || 
        !olderMsg || 
        (new Date(message.createdAt).getTime() - new Date(olderMsg.createdAt).getTime()) > 5 * 60 * 1000;

    // Ngắt nhóm avatar nếu tin cũ hơn là của người khác hoặc có mốc thời gian
    const isGroupBreak = 
        index === messages.length - 1 ||
        !olderMsg ||
        isShowTime || 
        String(message.senderId) !== String(olderMsg.senderId);

    const participant = selectedConvo.participants?.find(
        (p) => String(p._id) === String(message.senderId)
    );
     
  return (
    <div className="flex flex-col w-full">
        {/* 1. TIN NHẮN */}
        <div className={cn('flex gap-2 mb-1', isOwn ? "flex-row-reverse" : "flex-row")}>
            {/* Avatar - Chỉ hiện cho đối phương */}
            {!isOwn ? (
                <div className='w-8 flex-shrink-0'>
                    {isGroupBreak && (
                        <UserAvatar
                            type='chat'
                            name={participant?.displayName ?? "User"}
                            avatarURL={participant?.avatarURL ?? undefined}
                        />
                    )}
                </div>
            ) : <div className="w-8" />}

            {/* Khối nội dung */}
            <div className={cn("max-w-[70%] flex flex-col", isOwn ? "items-end" : "items-start")}>
                <Card className={cn(
                    "p-3 rounded-2xl shadow-none border-none", 
                    isOwn ? "bg-primary text-primary-foreground rounded-br-none" : "bg-muted rounded-bl-none"
                )}>
                    <p className='text-sm leading-relaxed break-words'>{message.content}</p>
                </Card>
                
                {/* Status: Seen / Delivered (Chỉ hiện cho tin nhắn cuối cùng của mình) */}
                {isOwn && index === 0 && (
                    <span className="text-[10px] text-muted-foreground mt-1 lowercase">
                        {lastMessageStatus}
                    </span>
                )}
            </div>
        </div>

        {/* 2. MỐC THỜI GIAN (Hiển thị PHÍA TRÊN tin nhắn) */}
        {/* Trong flex-col-reverse, cái gì viết sau sẽ hiện ở trên */}
        {isShowTime && (
            <div className="w-full text-center my-4">
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">
                    {formatMessageTime(new Date(message.createdAt))}
                </span>
            </div>
        )}
    </div>
  )
}

export default MessageItem