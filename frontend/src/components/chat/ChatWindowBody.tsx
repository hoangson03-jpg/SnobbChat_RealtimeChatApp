import { useChatStore } from '@/stores/useChatStore'
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import ChatWelcomeScreen from './ChatWelcomeScreen';
import MessageItem from './MessageItem';
import InfiniteScroll from 'react-infinite-scroll-component';

const ChatWindowBody = () => {
    const {activeConversationId, conversations, messages: allMessages, fetchMessages} = useChatStore();
    // const {user} = useChatStore();

    const messages = allMessages[activeConversationId!]?.items ?? [];

    // const reversedMessages = [...messages].reverse();

    const hasMore = allMessages[activeConversationId!]?.hasMore ?? false;
    
    const selectedConvo = conversations.find((c) => c._id === activeConversationId);

    const [lastMessageStatus, setLastMessageStatus] = useState<"delivered"|"seen">("delivered");

    // ref - tham chiếu cho thẻ div ở cuối trang
    const messagesEndRef = useRef<HTMLDivElement>(null);
    // ref - lưu vị trí hiện tại của cuộc hội thoại
    const containerRef = useRef<HTMLDivElement>(null);
    const key = `chat-scroll-${activeConversationId}`;

    // Cuộc hội thoại sau khi kết bạn thành công
    const isNewConnection = messages.length === 0;

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

    if(isNewConnection){
        return (
            <div className='p-4 h-full flex flex-col'>
        {isNewConnection && (
            <div className="text-center text-sm text-muted-foreground p-4">
                Hai bạn đã trở thành bạn bè. Hãy bắt đầu cuộc trò chuyện! 👋
            </div>
        )}
    </div>
        );
    }
 return (
        <div className='p-4 bg-primary-foreground h-full flex flex-col-reverse overflow-hidden'>
            <div
                id='scrollableDiv'
                onScroll={handleScrollSave}
                ref={containerRef}
                className='flex flex-col-reverse overflow-y-auto overflow-x-hidden beautiful-scrollbar'
            >
                {/* 3. Dùng Ref này để cuộn xuống đáy khi mới vào chat */}
                <div ref={messagesEndRef}></div>

                <InfiniteScroll
                    dataLength={messages.length}
                    next={() => fetchMoreMessages()}
                    hasMore={hasMore}
                    scrollableTarget="scrollableDiv"
                    loader={<p className="text-center text-xs p-2">Đang tải tin nhắn cũ...</p>}
                    inverse={true} // Báo cho thư viện biết ta đang cuộn ngược lên để lấy tin cũ
                    style={{
                        display: "flex", flexDirection: "column-reverse" // Giữ nguyên
                    }}
                >
                    {/* 4. Map trực tiếp mảng messages (Mới nhất ở đầu) */}
                    {messages.map((message, index) => (
                        <MessageItem
                            key={message._id}
                            message={message}
                            index={index}
                            messages={messages} // Truyền mảng gốc
                            selectedConvo={selectedConvo}
                            lastMessageStatus={lastMessageStatus}
                        />
                    ))}
                </InfiniteScroll>
            </div>
        </div>
    );
};

export default ChatWindowBody