export interface User {
    id: string;
    _id?: string;
    username: string;
    email: string;
    profilePicture?: string;
    bio?: string;
    college?: string;
    followersCount?: number;
    followingCount?: number;
    isFollowing?: boolean;
}

export interface Post {
    id: string;
    _id: string;
    user: User;
    caption: string;
    imageUrl?: string;
    thumbnailUrl?: string;
    timestamp: string;
    likes: number;
    liked: boolean;
    comments: number;
    poll?: Poll;
}

export interface Poll {
    id: string;
    question: string;
    options: PollOption[];
    duration: number;
    durationUnit: 'minutes' | 'hours' | 'days';
    allowVoteChange: boolean;
    expiresAt: string;
    totalVotes: number;
    hasVoted: boolean;
    userVote?: number;
}

export interface PollOption {
    id: string;
    text: string;
    votes: number;
}

export interface Comment {
    id: string;
    user: User;
    text: string;
    timestamp: string;
    likes: number;
    replies?: Comment[];
}

export interface Notification {
    _id: string;
    id?: string;
    recipient: string;
    sender: User;
    actor?: User; // Backward compatibility
    type: 'like' | 'comment' | 'follow' | 'mention' | 'message' | 'share' | 'reply';
    post?: Post;
    targetId?: string; // Backward compatibility
    comment?: string | Comment;
    content?: string;
    message?: string; // Backward compatibility
    isRead: boolean;
    createdAt: string;
    timestamp?: string; // Backward compatibility
}
