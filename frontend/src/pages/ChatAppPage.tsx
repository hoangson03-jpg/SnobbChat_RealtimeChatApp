import api from '@/lib/axios';
import { AppSidebar } from '../components/sidebar/app-sidebar.tsx';
import { SidebarProvider } from '@/components/ui/sidebar.tsx';
import ChatWindowLayout from '@/components/chat/ChatWindowLayout.tsx';

const ChatAppPage = () => {
  return (
    <SidebarProvider>
    
    <AppSidebar/>

    <div className='flex h-screen w-full p-2'>
      <ChatWindowLayout/>
    </div>

    </SidebarProvider>
  )
};

export default ChatAppPage