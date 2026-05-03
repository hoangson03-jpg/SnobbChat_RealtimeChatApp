import React from 'react'
import { Badge } from '../ui/badge'

const UnreadCountBadge = ({unreadCount} : {unreadCount: number}) => {
  return (
   <div className="absolute -top-1 -right-1 size-5">
  {/* Ring */}
  <span className="absolute inset-0 rounded-full bg-primary/30 animate-ping"></span>

  {/* Badge */}
  <Badge
    variant="destructive"
    className="relative z-10 size-5 flex items-center justify-center p-0 text-[10px] font-semibold text-white bg-red-500 border border-background rounded-md"
  >
    {unreadCount > 9 ? "9+" : unreadCount}
  </Badge>
</div>
  )
}

export default UnreadCountBadge