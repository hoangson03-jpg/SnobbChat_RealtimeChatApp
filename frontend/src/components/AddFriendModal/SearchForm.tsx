import React, { useEffect, useRef } from 'react'
import type { FieldErrors, UseFormRegister } from 'react-hook-form'
import type { IFormValues } from '../chat/AddFriendModal'
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { DialogClose, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Search, UserPlus } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import type { User } from '@/types/user';

interface SearchFormProps {
    register: UseFormRegister<IFormValues>;
    errors: FieldErrors<IFormValues>;
    loading: boolean;
    usernameValue: string;
    
    // Thêm các props mới phục vụ cho list và infinite scroll
    searchResults: User[];
    hasMore: boolean;
    onLoadMore: () => void;
    onSelectUser: (user: User) => void; 
    
    onSubmit?: (e: React.FormEvent<HTMLFormElement>) => void;
    onCancel: () => void;  
}

const SearchForm = ({
    register, errors, loading, usernameValue, 
    searchResults, hasMore, onLoadMore, onSelectUser,
    onSubmit, onCancel
} : SearchFormProps) => {

    // Logic Infinite Scroll đơn giản bằng Intersection Observer
    const observerTarget = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting && hasMore && !loading) {
                    onLoadMore();
                }
            },
            { threshold: 1.0 }
        );

        if (observerTarget.current) {
            observer.observe(observerTarget.current);
        }

        return () => observer.disconnect();
    }, [hasMore, loading, onLoadMore]);

  return (
    <div className='space-y-4 flex flex-col h-full'>
        <form onSubmit={onSubmit} className='space-y-4'>
            <div className='space-y-2'>
                <Label htmlFor='username' className='text-sm font-semibold'>
                    Tìm bằng tên hoặc username
                </Label>
                <div className="flex gap-2">
                    <Input id='username'
                        placeholder='Nhập tên người dùng vào đây...'
                        className='glass border-border/50 focus:border-primary/50 transition-smooth flex-1'
                        {...register("username", {
                            required: "Vui lòng nhập từ khóa để tìm kiếm"
                        })}
                    />
                    <Button 
                        type='submit'
                        disabled={loading && searchResults.length === 0}
                        className='bg-gradient-chat text-white hover:opacity-90 transition-smooth shrink-0'
                    >
                        <Search className='size-4'/>
                    </Button>
                </div>
                {errors.username && (
                    <p className='error-message text-xs text-red-500'>{errors.username.message}</p>
                )}
            </div>
        </form>

        {/* KHU VỰC HIỂN THỊ DANH SÁCH (Có thanh cuộn) */}
        <div className='flex-1 overflow-y-auto space-y-2 pr-2 min-h-[200px] max-h-[300px] custom-scrollbar'>
            
            {/* Nếu mảng trống và không loading, mới báo Không có kết quả */}
            {searchResults.length === 0 && !loading && usernameValue?.trim() && (
                 <div className='text-center text-muted-foreground text-sm mt-4'>
                    Không có kết quả nào.
                 </div>
            )}

            {searchResults.map((user) => (
                <div 
                    key={user._id} 
                    className='flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-smooth glass cursor-pointer group'
                    onClick={() => onSelectUser(user)}
                >
                    <div className='flex items-center gap-3 overflow-hidden'>
                        <Avatar>
                            <AvatarImage src={user.avatarURL} />
                            <AvatarFallback>{user.displayName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className='flex flex-col truncate'>
                            <span className='text-sm font-medium truncate'>{user.displayName}</span>
                            <span className='text-xs text-muted-foreground truncate'>@{user.username}</span>
                        </div>
                    </div>
                    <Button size="icon" variant="ghost" className='rounded-full opacity-0 group-hover:opacity-100 transition-smooth'>
                        <UserPlus className="size-4 text-primary" />
                    </Button>
                </div>
            ))}

            {/* Điểm neo để kích hoạt load more */}
            <div ref={observerTarget} className="h-4 w-full flex items-center justify-center">
                {loading && searchResults.length > 0 && (
                    <span className="text-xs text-muted-foreground animate-pulse">Đang tải thêm...</span>
                )}
            </div>
        </div>

        <DialogFooter className="mt-auto pt-4 border-t border-border/30">
            {/* ĐÃ SỬA LẠI THÀNH PROP RENDER GIỐNG CODE CŨ CỦA BẠN */}
            <DialogClose 
                render={
                    <Button
                        type="button"
                        variant="outline"
                        className="w-full glass hover:text-destructive"
                        onClick={onCancel}
                    >
                        Đóng
                    </Button>
                }
            />
        </DialogFooter>
    </div>
  )
}

export default SearchForm