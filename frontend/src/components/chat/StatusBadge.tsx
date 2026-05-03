import { cn } from '@/lib/utils'
import React from 'react'

const StatusBadge = ({status} : {status: "online" | "offline"}) => {
  return (
    <div className={cn(
        "absolute -bottom-0.5 -right-0.5 size-4 rounded-full border-2 border-card",
        status === "offline" && "status-offline",
        status === "online" && "status-online"
    )}></div>
  )
}

export default StatusBadge