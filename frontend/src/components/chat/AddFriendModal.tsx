import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTrigger } from '../ui/dialog';
import { UserPlus } from 'lucide-react';
import type { User } from '@/types/user';
import { useFriendStore } from '@/stores/useFriendStore';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import SearchForm from '../AddFriendModal/SearchForm';
import SendFriendRequest from '../AddFriendModal/SendFriendRequest';

export interface IFormValues {
  username: string,
  message: string
}

type Step = "search" | "send";

const AddFriendModal = () => {

  // Quản lý trạng thái đóng/mở của Modal
  const [open, setOpen] = useState(false);
  
  // Quản lý các bước: Đang ở form tìm kiếm hay form gửi lời chào
  const [step, setStep] = useState<Step>("search");
  
  // Lưu user được chọn từ danh sách
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Lấy data từ Store (Đảm bảo bạn đã thêm các state này vào useFriendStore như hướng dẫn trước)
  const { 
    loading, 
    addFriend, 
    searchUsersList, 
    searchResults, 
    searchPage, 
    searchHasMore, 
    resetSearch 
  } = useFriendStore();

  const {
    register,
    handleSubmit, 
    watch,
    reset, 
    formState: {errors}
  } = useForm<IFormValues>({
    defaultValues: {username: "", message: ""},
  });

  const usernameValue = watch("username") || "";

  // 1. KHI NGƯỜI DÙNG BẤM TÌM KIẾM
  const handleSearch = handleSubmit(async (data) => {
    const username = data.username.trim();
    if(!username) return;

    // Gọi API trang 1
    await searchUsersList(username, 1);
  });

  // 2. KHI CUỘN XUỐNG DƯỚI CÙNG (INFINITE SCROLL)
  const handleLoadMore = () => {
    const username = usernameValue.trim();
    if(!username) return;
    
    // Tải tiếp trang tiếp theo
    searchUsersList(username, searchPage + 1);
  }

  // 3. KHI CLICK VÀO 1 USER TRONG DANH SÁCH
  const handleSelectUser = (user: User) => {
    setSelectedUser(user);
    setStep("send"); // Chuyển sang màn hình điền lời mời
  }

  // 4. KHI BẤM GỬI LỜI MỜI KẾT BẠN
  const handleSend = handleSubmit (async (data) => {
    if(!selectedUser) return;

    try {
      const message = await addFriend(selectedUser._id, data.message.trim());
      toast.success(message);
      
      // Đóng modal và reset trạng thái sau khi gửi thành công
      handleCloseModal();
    } catch (error: any) {
      toast.error(error.message);
    }
  });

  // 5. KHI ĐÓNG MODAL HOẶC BẤM CANCEL
  const handleCloseModal = () => {
    setOpen(false); // Đóng modal
    setTimeout(() => {
        // Delay nhẹ để tránh giật UI lúc Modal đang mờ đi
        reset(); 
        setStep("search");
        setSelectedUser(null);
        resetSearch(); // Xóa mảng danh sách trong Zustand
    }, 300);
  }

  return (
    <Dialog 
        open={open} 
        onOpenChange={(isOpen) => {
            if(!isOpen) handleCloseModal();
            else setOpen(true);
        }}
    >
      <DialogTrigger 
        render={
          <button
            type="button"
            className="flex justify-center items-center size-5 rounded-full hover:bg-sidebar-accent cursor-pointer z-10"
          >
            <UserPlus className="size-4" />
            <span className="sr-only">Kết bạn</span>
          </button>
        }
      />

      <DialogContent className={'sm:max-w-[425px] border-none'}>
        <DialogHeader>Kết bạn</DialogHeader>

        {/* BƯỚC 1: HIỂN THỊ FORM TÌM KIẾM VÀ DANH SÁCH */}
        {step === "search" && (
          <SearchForm
            register={register}
            errors={errors}
            usernameValue={usernameValue}
            loading={loading}
            
            // Các prop dành cho danh sách
            searchResults={searchResults}
            hasMore={searchHasMore}
            onLoadMore={handleLoadMore}
            onSelectUser={handleSelectUser}
            
            onSubmit={handleSearch}
            onCancel={handleCloseModal}
          />
        )}

        {/* BƯỚC 2: HIỂN THỊ FORM GỬI LỜI NHẮN */}
        {step === "send" && selectedUser && (
          <SendFriendRequest
            register={register}
            errors={errors}
            loading={loading}
            searchedUsername={selectedUser.username}
            onSubmit={handleSend}
            onBack={() => setStep("search")} // Quay lại danh sách
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

export default AddFriendModal