export const MESSAGE_EDIT_WINDOW_MS = 10 * 60 * 1000;

export const isMessageEditable = (createdAt: string) =>
    Date.now() - new Date(createdAt).getTime() < MESSAGE_EDIT_WINDOW_MS;

export const isOwnTicketMessage = (mode: 'user' | 'admin', authorRole: 'USER' | 'ADMIN') =>
    mode === 'user' ? authorRole === 'USER' : authorRole === 'ADMIN';
