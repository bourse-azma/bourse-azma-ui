export const isMessageEditable = (seenAt: string | null | undefined) => !seenAt;

export const isOwnTicketMessage = (mode: 'user' | 'admin', authorRole: 'USER' | 'ADMIN') =>
    mode === 'user' ? authorRole === 'USER' : authorRole === 'ADMIN';

export const isMessageSeen = (seenAt: string | null | undefined) =>
    typeof seenAt === 'string' && seenAt.trim() !== '';
