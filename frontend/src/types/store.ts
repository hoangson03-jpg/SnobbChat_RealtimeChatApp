import type { Socket } from "socket.io-client";
import type { Conversation, Message } from "./chat";
import type { Friend, FriendRequest, User } from "./user";
import type { $ZodVoidInternals } from "zod/v4/core";

export interface AuthState {
    accessToken: string | null;
    user: User | null;
    loading: boolean;
    convoLoading: boolean;
    messagesLoading: boolean;
    setUser: (user: User) => void;

    clearState: () => void;
    signUp: (
        username: string,
        password: string,
        email: string,
        firstName: string,
        lastName: string
    ) => Promise<void>;

    signIn: (
        username: string,
        password: string
    ) => Promise<void>;

    signOut: () => Promise<void>;

    fetchMe: () => Promise<void>;

    refresh: () => Promise<void>;

    setAcessToken: (accessToken: string) => void;
}

export interface ThemeState {
    isDark: boolean;
    toggleTheme: () => void;
    setTheme: (dark: boolean) => void;
}

export interface ChatState {
    conversations: Conversation[];
    messages: Record<string, {
        items: Message[],
        hasMore: boolean, // infinite-scroll
        nextCursor?: string | null, // phân trang
    }>;
    activeConversationId: string | null;
    convoLoading: boolean;
    messagesLoading: boolean;
    loading: boolean;
    reset: () => void;

    setActiveConversation: (id: string | null) => void;
    fetchConversations: () => Promise<void>;
    fetchMessages: (conversationId?: string) => Promise<void>;
    sendDirectMessage: (
        recipientId: string,
        content: string,
        imgURL?: string
    ) => Promise<void>;
    sendGroupMessage: (
        conversationId: string,
        content: string,
        imgURL?: string
    ) => Promise<void>;
    // add message
    addMessage: (message: Message) => Promise<void>;
    // update convo
    updateConversation: (conversation: Partial<Conversation>) => Promise<void>;
    deleteConversation: (conversationId: string) => Promise<void>;
    markAsSeen: () => Promise<void>;
     addConvo: (convo: Conversation, setActive?: boolean) => void; 
    createConversation: (type: "group" | "direct", name: string, memberIds: string[]) => Promise<Conversation | null>;
    clearMessagesOfConvo: (conversationId: string) => void;
}

export interface SocketState {
    socket: Socket | null;
    onlineUsers: string[];
    connectSocket: () => void;
    disconnectSocket: () => void;
}

export interface FriendState {
    friends: Friend[];
    loading: boolean; // để biết khi nào api chạy xong
    receivedList: FriendRequest[];
    sentList: FriendRequest[];
    searchResults: User[];
    searchPage: number;
    searchHasMore: boolean;
    searchQuery: string;
    searchByUsername: (username: string) => Promise<User | null>;
    addFriend: (to: string, message?: string) => Promise<string>;
    getAllFriendRequests: () => Promise<void>;
    acceptRequest: (requestId: string) => Promise<void>;
    declineRequest: (requestId: string) => Promise<void>;
    getFriends: () => Promise<void>;
    addReceivedRequest: (request: any) => void; 
    removeSentRequest: (requestId: string) => void;
    handleFriendAcceptedSocket: (requestId: string, newFriend: any) => void;
    searchUsersList: (query: string, page?: number) => Promise<void>;
    resetSearch: () => void;
}

export interface UserState {
    updateAvatarURL: (formData: FormData) => Promise<void>;
}
