import React from 'react'
import { Card } from '../ui/card'
import { formatOnlineTime, cn } from "@/lib/utils"
import { MoreHorizontal } from 'lucide-react'

interface ChatCardProps {
    convoId: string,
    name: string,
    timestamp?: Date,
    isActive: boolean,
    onSelect: (id: string) => void,
    unreadCounts?: number,
    leftSection: React.ReactNode,
    rightSection: React.ReactNode,
    subtitle: React.ReactNode
}

const ChatCard = ({
  convoId, name, timestamp, isActive, onSelect, unreadCounts, leftSection, rightSection ,subtitle  
}: ChatCardProps) => {
  return (
    <Card
        onClick={() => onSelect(convoId)}
        className={cn(
            "border-none p-3 cursor-pointer transition-smooth glass hover:bg-muted/30 group", 
            isActive && "ring-2 ring-primary/50 bg-muted/50"
        )}
    >
        <div className='flex items-center gap-3'>
            {/* Cột trái: Avatar */}
            <div className='relative flex-shrink-0'>{leftSection}</div>

            {/* Cột phải: Thông tin */}
            <div className='flex-1 min-w-0'>
                {/* Tên và Thời gian */}
                <div className='flex items-center justify-between mb-1 gap-2'>
                    <h3 className={cn("font-semibold text-sm truncate", unreadCounts && unreadCounts > 0 && "text-foreground")}>
                        {name}
                    </h3>
                    <span className='text-xs text-muted-foreground flex-shrink-0'>
                        {timestamp ? formatOnlineTime(timestamp) : ""}
                    </span>
                </div>

                {/* Tin nhắn cuối và Nút 3 chấm */}
                <div className='flex items-center justify-between gap-2 h-5'>
                    <div className='flex-1 min-w-0'>
                        {subtitle}
                    </div>
                    
                    {/* options - Chỉ hiện khi hover */}
                    <div className='flex-shrink-0 opacity-0 group-hover:opacity-100 transition-smooth'>
                        {rightSection}
                    </div>
                </div>
            </div>
        </div>
    </Card>
  )
}

export default ChatCard