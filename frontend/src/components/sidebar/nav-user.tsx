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

export function NavUser({
  user,
}: {
  user: User
}) {
  const { isMobile } = useSidebar()
  const [friendRequestOpen, setFriendRequestOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  return (
    <><SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton size="lg" className="aria-expanded:bg-muted" />
            }
          >
            <Avatar>
              <AvatarImage src={user.avatarURL} alt={user.displayName} />
              <AvatarFallback>{user.displayName.charAt(0)}</AvatarFallback>
            </Avatar>
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
              >
                <BellIcon className="text-muted-foreground dark:group-focus:!text-accent-foreground"
                />
                Thông báo
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
