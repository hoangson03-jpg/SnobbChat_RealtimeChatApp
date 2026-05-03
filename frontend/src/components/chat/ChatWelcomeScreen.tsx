import React from 'react'
import { SidebarInset } from '../ui/sidebar'
import ChatWindowHeader from './ChatWindowHeader'

const ChatWelcomeScreen = () => {
  return (
    <SidebarInset className='flex w-full h-full bg-transparent'>
        <ChatWindowHeader />
        <div className='flex bg-primary-foreground rounded-2xl flex-1 items-center justify-center'>
            <div className='text-center'>
                <div className='size-24 mx-auto mb-6 bg-gradient-chat rounded-full flex items-center justify-center shadow-glow pulse-ring'>
                    <svg viewBox="-25 -30 150 150" className="w-full h-full">

                        <circle cx="50" cy="45" r="40" fill="#e5e5e5" stroke="black" strokeWidth="3"/>

                        <circle cx="25" cy="75" r="10" fill="#e5e5e5" stroke="black" strokeWidth="3"/>
                        <circle cx="15" cy="90" r="3" fill="#e5e5e5"/>

                        <circle cx="35" cy="45" r="4" fill="black"/>
                        <circle cx="50" cy="45" r="4" fill="black"/>
                        <circle cx="65" cy="45" r="4" fill="black"/>
                    </svg>
                </div>
                <h2 className='text-2xl font-bold mb-2 bg-gradient-chat bg-clip-text text-transparent'>
                    Chào mừng tới SnobbChat!
                    <p className='text-muted-foreground'>Chọn một cuộc hội thoại để bắt đầu nhắn tin thôi nào!</p>
                </h2>
            </div>
        </div>
    </SidebarInset>
  )
}

export default ChatWelcomeScreen