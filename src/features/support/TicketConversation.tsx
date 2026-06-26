import {useState} from 'react';
import {Check, CheckCheck, Headphones, Loader2, Pencil, UserRound, X} from 'lucide-react';
import {formatDateTimeFa} from '../../utils/formatDateTime';
import {isMessageEditable, isMessageSeen, isOwnTicketMessage} from './messageUtils';
import type {SupportTicketMessage} from './types';

type TicketConversationProps = {
    messages: SupportTicketMessage[];
    mode: 'user' | 'admin';
    allowEdit?: boolean;
    onEditMessage?: (messageId: number | null, newText: string) => Promise<void>;
};

export default function TicketConversation({messages, mode, allowEdit = true, onEditMessage}: TicketConversationProps) {
    const [editingId, setEditingId] = useState<number | 'initial' | null>(null);
    const [editText, setEditText] = useState('');
    const [editSubmitting, setEditSubmitting] = useState(false);
    const [editError, setEditError] = useState<string | null>(null);

    const startEdit = (item: SupportTicketMessage) => {
        setEditingId(item.id ?? 'initial');
        setEditText(item.message);
        setEditError(null);
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditText('');
        setEditError(null);
    };

    const submitEdit = async (messageId: number | null) => {
        const normalized = editText.trim().replace(/\s+/g, ' ');
        if (!normalized) {
            setEditError('متن پیام را وارد کنید.');
            return;
        }
        if (!onEditMessage) {
            return;
        }

        setEditSubmitting(true);
        setEditError(null);
        try {
            await onEditMessage(messageId, normalized);
            cancelEdit();
        } catch (error) {
            setEditError(error instanceof Error ? error.message : 'ویرایش پیام ناموفق بود.');
        } finally {
            setEditSubmitting(false);
        }
    };

    return (
        <div
            className="flex min-h-[280px] flex-col gap-4 rounded-2xl border border-border/50 bg-gradient-to-b from-surface-2/50 to-surface p-3 sm:p-4">
            {messages.map((item, index) => {
                const isOwn = isOwnTicketMessage(mode, item.authorRole);
                const isAdminAuthor = item.authorRole === 'ADMIN';
                const isFirstOfGroup = index === 0 || messages[index - 1]?.authorRole !== item.authorRole;
                const isEditing = editingId === (item.id ?? 'initial');
                const canEdit = allowEdit && isOwn && isMessageEditable(item.seenAt) && onEditMessage != null;
                const seen = isOwn && isMessageSeen(item.seenAt);

                const displayName = isAdminAuthor && mode === 'user'
                    ? 'پشتیبانی'
                    : isOwn
                        ? 'شما'
                        : item.authorName;

                return (
                    <div
                        key={item.id ?? `initial-${index}`}
                        className={`flex w-full ${isOwn ? 'justify-end' : 'justify-start'}`}
                    >
                        <div
                            className={`flex max-w-[min(100%,22rem)] gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                            {isFirstOfGroup ? (
                                <span
                                    className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                                        isAdminAuthor
                                            ? 'bg-primary/12 text-primary'
                                            : 'bg-surface border border-border/70 text-muted'
                                    }`}
                                >
                                    {isAdminAuthor ? <Headphones className="h-3.5 w-3.5"/> :
                                        <UserRound className="h-3.5 w-3.5"/>}
                                </span>
                            ) : (
                                <span className="w-8 shrink-0"/>
                            )}

                            <div className={`min-w-0 ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
                                {isFirstOfGroup ? (
                                    <div
                                        className={`mb-1 flex items-center gap-2 px-1 ${isOwn ? 'flex-row-reverse' : ''}`}>
                                        <span className="text-[11px] font-semibold text-text">{displayName}</span>
                                    </div>
                                ) : null}

                                {isEditing ? (
                                    <div className="w-full min-w-[14rem] space-y-2">
                                        <textarea
                                            value={editText}
                                            onChange={(event) => setEditText(event.target.value)}
                                            rows={3}
                                            maxLength={2000}
                                            className="w-full resize-none rounded-xl border border-border/80 bg-surface px-3 py-2.5 text-sm leading-7 text-text outline-none focus:border-primary/45 focus:ring-2 focus:ring-primary/25"
                                        />
                                        {editError ? (
                                            <p className="text-[10px] text-negative">{editError}</p>
                                        ) : null}
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                type="button"
                                                onClick={cancelEdit}
                                                disabled={editSubmitting}
                                                className="inline-flex h-8 items-center gap-1 rounded-lg border border-border/70 px-2.5 text-[11px] text-muted transition hover:text-text disabled:opacity-70"
                                            >
                                                <X className="h-3.5 w-3.5"/>
                                                انصراف
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => void submitEdit(item.id)}
                                                disabled={editSubmitting}
                                                className="inline-flex h-8 items-center gap-1 rounded-lg bg-primary px-2.5 text-[11px] font-semibold text-white disabled:opacity-70"
                                            >
                                                {editSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin"/> :
                                                    <Check className="h-3.5 w-3.5"/>}
                                                ذخیره
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="group relative">
                                        <div
                                            className={`rounded-2xl px-3.5 py-2.5 text-sm leading-7 shadow-sm ${
                                                isOwn
                                                    ? 'rounded-tl-sm bg-primary text-white'
                                                    : 'rounded-tr-sm border border-border/60 bg-surface text-text'
                                            }`}
                                        >
                                            {item.message}
                                        </div>
                                        {canEdit ? (
                                            <button
                                                type="button"
                                                onClick={() => startEdit(item)}
                                                className={`absolute top-1 ${isOwn ? 'left-1' : 'right-1'} inline-flex h-6 w-6 items-center justify-center rounded-md bg-black/10 text-white opacity-0 transition group-hover:opacity-100 ${!isOwn ? 'bg-surface-2 text-muted' : ''}`}
                                                aria-label="ویرایش پیام"
                                            >
                                                <Pencil className="h-3 w-3"/>
                                            </button>
                                        ) : null}
                                    </div>
                                )}

                                <div className={`mt-1 flex items-center gap-2 px-1 ${isOwn ? 'flex-row-reverse' : ''}`}>
                                    <p className="text-[10px] tabular-nums text-muted" dir="ltr">
                                        {formatDateTimeFa(item.createdAt)}
                                    </p>
                                    {item.editedAt ? (
                                        <p className="text-[10px] text-muted">ویرایش شده</p>
                                    ) : null}
                                    {isOwn ? (
                                        seen ? (
                                            <CheckCheck className={`h-3.5 w-3.5 ${isOwn ? 'text-white/80' : 'text-primary'}`}/>
                                        ) : (
                                            <Check className={`h-3.5 w-3.5 ${isOwn ? 'text-white/60' : 'text-muted'}`}/>
                                        )
                                    ) : null}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
