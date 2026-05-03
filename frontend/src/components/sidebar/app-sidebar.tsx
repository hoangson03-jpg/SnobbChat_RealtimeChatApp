"use client"

import * as React from "react"

import { NavUser } from "@/components/sidebar/nav-user.tsx"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { CommandIcon } from "@phosphor-icons/react"
import {  Moon, Sun } from "lucide-react"
import { Switch } from "../ui/switch"
import CreateNewChat from "../chat/CreateNewChat"
import NewGroupChatModel from "../chat/NewGroupChatModel"
import GroupChatList from "../chat/GroupChatList"
import AddFriendModel from "../chat/AddFriendModal"
import DirectMessageList from "../chat/DirectMessageList"
import { useThemeStore } from "@/stores/useThemeStore"
import { useAuthStore } from "@/stores/useAuthStore"
import NewGroupChatModal from "../chat/NewGroupChatModal"


export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {

  const {isDark, toggleTheme} = useThemeStore();
  const {user} = useAuthStore();

  return (
    <Sidebar variant="inset" {...props}>
      {/* header */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="bg-gradient-primary p-0 rounded-md" >
              <a href="#" className="flex w-full items-center">
                <div className="flex w-full items-center px-3 justify-between">
                  {/* Bên trái */}
                  <h1 className="text-xl font-bold text-white tracking-tight">
                    SnobbChat
                  </h1>
                    {/* Bên phải - Chuyển đổi theme dark/light */}
                  <div className="flex items-center gap-2">
                    <Sun className="size-3 text-white/80" />
                    <Switch
                      checked={isDark}
                      onCheckedChange={toggleTheme}
                      // Fix nhẹ lỗi typo 'check' thành 'checked' trong class của bạn
                      className="data-[state=checked]:bg-background/80"
                    />
                    <Moon className="size-3 text-white/80" />
                  </div>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      {/* Content */}
      <SidebarContent className="beautiful-scrollbar">
        {/* New chat */}
        <SidebarGroup>
          <CreateNewChat />
        </SidebarGroup>
        {/* Group chat */}
        <SidebarGroup>
          <div className="flex items-center justify-between">
            <SidebarGroupLabel className="uppercase">
              nhóm chat
            </SidebarGroupLabel>
            <NewGroupChatModal/>
          </div>
          <SidebarGroupContent>
            <GroupChatList />
          </SidebarGroupContent>
        </SidebarGroup>
        {/* Direct Message */}
        <SidebarGroup>
          <div className="flex items-center justify-between px-2">
          <SidebarGroupLabel className="uppercase">
            bạn bè
          </SidebarGroupLabel>
          <SidebarGroupAction
            title="Kết bạn"
            className="cursor-pointer"
            render={<AddFriendModel />}
          />
          </div>
          <SidebarGroupContent>
            <DirectMessageList />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      {/* Footer */}
      <SidebarFooter>
        {user && <NavUser user={user} />}
      </SidebarFooter>
    </Sidebar>
  )
}
