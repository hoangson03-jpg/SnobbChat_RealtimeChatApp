import React from 'react'
import type { FieldErrors, UseFormRegister } from 'react-hook-form';
import type { IFormValues } from '../chat/AddFriendModal';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { UserPlus } from 'lucide-react';

interface SendRequestProps {
    register: UseFormRegister<IFormValues>;
        errors: FieldErrors<IFormValues>;
        loading: boolean;
        searchedUsername: string;
        onSubmit?: (e: React.FormEvent<HTMLFormElement>) => void;
        onBack: () => void;  
}

const SendFriendRequest = ({
    register, errors, loading, searchedUsername, onSubmit, onBack
} : SendRequestProps) => {
  return (
    <form onSubmit={onSubmit}>
        <div className='space-y-4'>
           <span className='success-message'>
                Tìm thấy <span className='font-semibold'>@{searchedUsername}</span> đây rồi!
            </span> 

            <div className='space-y-4'>
                <Label htmlFor='message' className='text-sm font-semibold'>
                    Giới thiệu
                </Label>
                <Textarea id='message' rows={3} placeholder='Cin chào ^-^ có thể kết bạn được không?...'
                className='glass border-border/50 focus:border-primary/50 transition-smooth resize-none'
                {...register("message")}
                />
            </div>

            <DialogFooter>
                <Button
                type='button'
                variant='outline'
                className='flex-1 glass hover:text-destructive'
                onClick={onBack}
                >
                    Quay lại
                </Button>
                <Button
                type='submit'
                disabled={loading}
                className='flex-1 bg-gradient-chat text-white hover:opacity-90 transition-smooth'
                >
                    {loading ? (
                        <span>Đang gửi...</span>

                    )
                    : (
                        <><UserPlus className='size-4 mr-2'/> Kết bạn</>
                    )
                }
                </Button>
            </DialogFooter>
        </div>

    </form>
  )
}

export default SendFriendRequest