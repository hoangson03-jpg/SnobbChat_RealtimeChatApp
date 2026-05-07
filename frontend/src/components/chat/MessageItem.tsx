import { cn, formatMessageTime } from '@/lib/utils';
import type { Conversation, Message, Participant } from '@/types/chat'
import React from 'react'
import UserAvatar from './UserAvatar';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { replaceTextWithEmoji } from '@/lib/emojiMap';


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

    // Xử lý text thành emoji
    const content = message.content ?? "";
    const parsedContent = replaceTextWithEmoji(content);

    // tin nhắn chỉ gồm 1 emoji duy nhất
    const checkIsBigEmoji = (text: string) => {
    if (!text) return false;
    const trimmed = text.trim();
    
    // 1. Kiểm tra độ dài (thường chỉ phóng to nếu dưới 3 emoji)
    if (trimmed.length > 8) return false; 

    // 2. Regex này kiểm tra xem có chứa chữ cái hoặc chữ số không
    // Nếu có chữ hoặc số thì KHÔNG PHẢI là "Big Emoji"
    const hasAlphaNumeric = /[a-zA-Z0-9áàảãạâấầẩẫậăắằẳẵặéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵđ]/i.test(trimmed);
    
    // 3. Sử dụng Extended_Pictographic để chỉ định danh các icon hình ảnh
    // và đảm bảo toàn bộ chuỗi chỉ chứa emoji
    const isOnlyEmoji = /^(\p{Extended_Pictographic}|\s)+$/u.test(trimmed);

    return isOnlyEmoji && !hasAlphaNumeric;
};

const isBigEmoji = checkIsBigEmoji(parsedContent);
     
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
                    "p-3 rounded-2xl shadow-none border-none transition-all", 
                    isBigEmoji 
                        ? "bg-transparent !p-0 text-4xl" // Nếu chỉ có emoji thì ẩn nền và phóng to
                        : (isOwn ? "bg-primary text-primary-foreground rounded-br-none" : "bg-muted rounded-bl-none")
                )}>
                    <p className='leading-relaxed break-words whitespace-pre-wrap'>
                        {parsedContent}
                    </p>
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