export type SupportRequestStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

export type SupportTicketClosedBy = 'USER' | 'ADMIN';

export type SupportRequestCategory =
    | 'TECHNICAL'
    | 'TRADING'
    | 'WALLET'
    | 'ACCOUNT'
    | 'SUGGESTION'
    | 'OTHER';

export type SupportRequestPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type SupportRequestUserSummary = {
    id: number;
    displayName: string;
    username: string;
    firstName?: string | null;
    lastName?: string | null;
    nationalCode?: string | null;
    phoneNumber?: string | null;
    email?: string | null;
};

export type SupportTicket = {
    id: number;
    subject: string;
    message: string;
    status: SupportRequestStatus;
    category: SupportRequestCategory;
    priority: SupportRequestPriority;
    rating: number | null;
    ratingComment: string | null;
    messageCount: number;
    lastReplyAt: string;
    createdAt: string;
    updatedAt: string;
    closedAt: string | null;
    closedBy: SupportTicketClosedBy | null;
    user: SupportRequestUserSummary | null;
};

export type SupportTicketMessage = {
    id: number | null;
    message: string;
    authorRole: 'USER' | 'ADMIN';
    authorName: string;
    authorUserId: number;
    createdAt: string;
    editedAt: string | null;
};

export type SupportTicketDetail = {
    ticket: SupportTicket;
    messages: SupportTicketMessage[];
};

export type CreateSupportTicketRequest = {
    subject: string;
    message: string;
    category: SupportRequestCategory;
    priority: SupportRequestPriority;
};

export type SupportTicketRatingRequest = {
    rating: number;
    comment?: string;
};

export type SupportTicketFilters = {
    status?: SupportRequestStatus;
    category?: SupportRequestCategory;
    priority?: SupportRequestPriority;
};
