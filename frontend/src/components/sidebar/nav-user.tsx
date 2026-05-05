"use client"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import type { User } from "@/types/user"
import { CaretUpDownIcon, SparkleIcon, CheckCircleIcon, CreditCardIcon, BellIcon, SignOutIcon } from "@phosphor-icons/react"
import { UserIcon } from "lucide-react"
import Logout from "../auth/logout"
import { useState } from "react"
import FriendRequestDialog from "../friendRequest/FriendRequestDialog"
import ProfileDialog from "../profile/ProfileDialog"

import { useFriendStore } from "@/stores/useFriendStore" 

export function NavUser({
  user,
}: {
  user: User
}) {
  const { isMobile } = useSidebar()
  const [friendRequestOpen, setFriendRequestOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  // Danh sách lời mời kết bạn
  const receivedList = useFriendStore((state) => state.receivedList);
  const pendingRequestsCount = receivedList.length;
  return (
    <><SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton size="lg" className="aria-expanded:bg-muted" />
            }
          >
            <div className="relative">
                <Avatar>
                  <AvatarImage src={user.avatarURL} alt={user.displayName} />
                  <AvatarFallback>{user.displayName.charAt(0)}</AvatarFallback>
                </Avatar>
                {/* Đây là chấm đỏ để hiển thị rằng có lời mời kết bạn/ có thông báo gửi tới */}
                 {pendingRequestsCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-3 w-3 items-center justify-center rounded-full bg-red-500 ring-2 ring-background"></span>
                )}
              </div>

            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{user.displayName}</span>
              <span className="truncate text-xs">{user.username}</span>
            </div>
            <CaretUpDownIcon className="ml-auto size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <Avatar>
                    <AvatarImage src={user.avatarURL} alt={user.displayName} />
                    <AvatarFallback>{user.displayName.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{user.displayName}</span>
                    <span className="truncate text-xs">{user.username}</span>
                  </div>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => setProfileOpen(true)}>
                <UserIcon className="text-muted-foreground dark:group-focus:!text-accent-foreground"
                />
                Tài khoản
              </DropdownMenuItem>
              <DropdownMenuItem
                  onClick={() => setFriendRequestOpen(true)}
                  className="flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center">
                    <BellIcon className="mr-2 h-4 w-4 text-muted-foreground dark:group-focus:!text-accent-foreground" />
                    Thông báo
                  </div>
                  {/* Badge hiển thị số lượng thông báo */}
                  {pendingRequestsCount > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-medium text-white">
                      {pendingRequestsCount > 99 ? '99+' : pendingRequestsCount}
                    </span>
                  )}
                </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer" variant="destructive">
              <Logout/>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>

    <FriendRequestDialog
    open={friendRequestOpen}
    setOpen={setFriendRequestOpen}
    />
    <ProfileDialog 
    open={profileOpen}
    setOpen={setProfileOpen}
    />
    </>
  )
}
