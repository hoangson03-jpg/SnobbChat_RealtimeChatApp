import React from 'react'
import { useAuthStore } from '@/stores/useAuthStore'
import { Button } from '../ui/button'
import { useNavigate } from 'react-router'
import { LogOut } from 'lucide-react'

const Logout = () => {
    const {signOut} = useAuthStore();
    const navigate = useNavigate();
    const handleLogout = async () => {
    try {
        console.log("Đang thực hiện Logout...");
        await signOut(); 
        navigate("/signin"); 
    } catch (error) {
        console.error("Lỗi tại Component Logout:", error);
    }
} 
  return (
    <Button
    className="w-full h-10 rounded-md cursor-pointer"
    variant={'completeGhost'}
    onClick={handleLogout}>
      <LogOut className='text-destructive' /> Đăng xuất</Button>
  )
}

export default Logout