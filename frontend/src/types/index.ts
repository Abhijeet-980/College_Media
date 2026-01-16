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

export interface AnalyticsStats {
    overview: {
        totalLikes: number;
        totalViews: number;
        totalComments: number;
        totalShares: number;
    };
    engagementOverTime: {
        _id: string; // Date string
        likes: number;
    }[];
    topPosts: PerformancePost[];
}

export interface PerformancePost {
    _id: string;
    caption: string;
    likesCount: number;
    commentsCount: number;
    createdAt: string;
}

export interface TagAnalytics {
    _id: string; // Tag name
    count: number;
    avgLikes: number;
}

export interface Collection {
    _id: string;
    name: string;
    description?: string;
    color: string;
    isPublic: boolean;
    posts: string[] | Post[];
    createdAt: string;
    updatedAt: string;
}
