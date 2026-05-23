import { useAuthStore } from '@/stores/useAuthStore'
import type { Conversation } from '@/types/chat';
import React, { useState, useRef } from 'react'
import { Button } from '../ui/button';
import { ImagePlus, Send, X, Loader2 } from 'lucide-react';
import { Input } from '../ui/input';
import EmojiPicker from './EmojiPicker';
import { useChatStore } from '@/stores/useChatStore';
import { toast } from 'sonner';

const MessageInput = ({selectedConvo}  : {selectedConvo: Conversation}) => {
  const {user} = useAuthStore();
  const {sendDirectMessage, sendGroupMessage, sendImageMessage} = useChatStore();
  const [value, setValue] = useState("");

  if(!user){
    return;
  }

  // biến lưu trữ file ảnh được chọn
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const sendMessage = async () => {
    if(!value.trim) return null;
    const currVal = value;
    setValue("");
    try {
      if(selectedConvo.type === "direct"){
        const participants = selectedConvo.participants;
        const otherUser = participants.filter((p) => p._id !== user._id)[0];
        await sendDirectMessage(otherUser._id, currVal);
        console.log("TIN VỪA GỬI: ",currVal)
      }
      else{
        await sendGroupMessage(selectedConvo._id, currVal);
      }
    } catch (error) {
      console.error(error);
      toast.error("Lỗi xảy ra khi gửi tin nhắn. Bạn hãy thử lại!")
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if(e.key === "Enter") {
      e.preventDefault();
      sendMessage();
    }
  }

  // xử lý khi gửi ảnh
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
        toast.error("Vui lòng chọn định dạng ảnh hợp lệ");
        return;
    }
    try {
        setIsUploading(true);
        const recipientId = selectedConvo.type === "direct" 
            ? selectedConvo.participants.find(p => p._id !== user._id)?._id 
            : undefined;

        await sendImageMessage(selectedConvo._id, selectedConvo.type, file, recipientId);

        if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
        toast.error("Lỗi khi tải ảnh lên!");
    } finally {
        setIsUploading(false);
    }
  }

  return (
    <div className='flex items-center gap-2 p-3 min-h-[56px] bg-background'>
      <input 
        type="file" 
        hidden 
        ref={fileInputRef} 
        accept="image/*" 
        onChange={handleImageChange} 
      />
      
      <Button 
        variant="ghost" 
        size="icon" 
        className="hover:bg-primary/10 transition-smooth relative"
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
      >
        {isUploading ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className='size-4'/>}
      </Button>

      <div className='flex-1 relative'>
        <Input 
        onKeyPress={handleKeyPress}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder='Soạn tin nhắn'
        className='pr-20 h-9 bg-white border-border/50 focus:border-primary/50 transition-smooth resize-none'
        >
        </Input>
        <div className='absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1'>
            <Button 
            asChild // Chỉ là hình thức
            variant="ghost"
            size="icon"
            className="size-8 hover:bg-primary/10 transition-smooth">
              <div>
                {/* emoji picker */}
                <EmojiPicker onChange={(emoji: string) => setValue(`${value}${emoji}`)}/>
              </div>
            </Button>
          </div>
      </div>
      <Button 
      onClick={sendMessage}
      className='bg-gradient-chat hover:shadow-glow transition-smooth hover:scale-105' 
      disabled={!value.trim()}>
            <Send className='size-4 text-white' />
          </Button>
    </div>
  )
}

export default MessageInput