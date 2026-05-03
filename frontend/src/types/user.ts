export interface User {
    _id: string;
    username: string;
    email: string;
    displayName: string;
    avatarURL: string;
    bio?: string;
    phone?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface Friend {
    _id: string;
    username: string;
    displayName: string;
    avatarURL: string;
}

export interface FriendRequest {
    _id: string;
    from?:{
        id: string;
        username: string;
        displayName: string;
        avatarURL: string;
    };
    to:{
        id: string;
        username: string;
        displayName: string;
        avatarURL: string;
    };
    message: string;
    createdAt: string;
    updatedAt: string;
}