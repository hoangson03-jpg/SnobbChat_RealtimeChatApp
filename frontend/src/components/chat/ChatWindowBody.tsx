import { useChatStore } from '@/stores/useChatStore'
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import ChatWelcomeScreen from './ChatWelcomeScreen';
import MessageItem from './MessageItem';
import InfiniteScroll from 'react-infinite-scroll-component';

const ChatWindowBody = () => {
    const {activeConversationId, conversations, messages: allMessages, fetchMessages} = useChatStore();
    // const {user} = useChatStore();

    const messages = allMessages[activeConversationId!]?.items ?? [];

    const reversedMessages = [...messages].reverse();  

    const hasMore = allMessages[activeConversationId!]?.hasMore ?? false;
    
    const selectedConvo = conversations.find((c) => c._id === activeConversationId);

    const [lastMessageStatus, setLastMessageStatus] = useState<"delivered"|"seen">("delivered");

    // ref - tham chiếu cho thẻ div ở cuối trang
    const messagesEndRef = useRef<HTMLDivElement>(null);
    // ref - lưu vị trí hiện tại của cuộc hội thoại
    const containerRef = useRef<HTMLDivElement>(null);
    const key = `chat-scroll-${activeConversationId}`;

    useEffect(() => {
        const lastMessage = selectedConvo?.lastMessage;
        if(!lastMessage) {
            return;
        }

        const seenBy = selectedConvo?.seenBy ?? [];

        const isSeen = seenBy.length > 0;

        setLastMessageStatus(isSeen ? "seen" : "delivered");

    }, [selectedConvo]);

    useEffect(() => {
        console.log("seenBy:", selectedConvo?.seenBy);
    }, [selectedConvo]);

    useLayoutEffect(() => {
        if(!messagesEndRef.current) { // Kiểm tra nếu Ref chưa trỏ tới bất cứ phần tử DOM nào
            return
        }

        messagesEndRef.current.scrollIntoView({
            behavior: 'smooth',
            block: 'end'
        })
    }, [activeConversationId])

    const fetchMoreMessages = async () => {
        if (!activeConversationId) {
            return
        }

        try {
            await fetchMessages(activeConversationId)
        } catch (error) {
            console.error("Lỗi xảy ra khi fetch thêm tin", error);
        }
    }

    const handleScrollSave = () => {
        const container = containerRef.current;
        if(!container || !activeConversationId) {
            return;
        }

        

        sessionStorage.setItem(key, JSON.stringify({
            scrollTop: container.scrollTop,
            scrollHeight: container.scrollHeight,
        }))
    }

    useLayoutEffect(() => {
    const container = containerRef.current;
    if(!container || !activeConversationId) {
        return;
    }
    const item = sessionStorage.getItem(key);

    if(item) {
        const {scrollTop} = JSON.parse(item);
        requestAnimationFrame(() => {
            container.scrollTop = scrollTop
        });
    }
    }, [messages.length])

    if(!selectedConvo){
        return <ChatWelcomeScreen/>;
    }

    if(!messages?.length){
        return (
            <div className='flex h-full items-center justify-center text-muted-foreground'>
                Chưa có tin nhắn nào trong cuộc hội thoại này
            </div>
        );
    }
  return (
    <div className='p-4 bg-primary-foreground h-full flex flex-col overflow-hidden'>
        <div
        id='scrollableDiv'
        onScroll={handleScrollSave}
        ref={containerRef}
        className='flex flex-col-reverse overflow-y-auto overflow-x-hidden beautiful-scrollbar'>
            <div ref={messagesEndRef}></div>
            <InfiniteScroll
            dataLength={messages.length}
            next={() => fetchMoreMessages()}
            hasMore={hasMore}
            scrollableTarget="scrollableDiv"
            loader={<p>Đang tải...</p>}
            inverse={true}
            style={{
                display: "flex",
                flexDirection: "column-reverse",
                overflow: "visible"
            }} >
            {reversedMessages.map((message, index) => (
                <MessageItem
                key={message._id ?? index}
                message={message}
                index={index}
                messages={reversedMessages}
                selectedConvo={selectedConvo}
                lastMessageStatus={lastMessageStatus}
                />
            ))}

            
            </InfiniteScroll>
        </div>
    </div>
  )
}

export default ChatWindowBody