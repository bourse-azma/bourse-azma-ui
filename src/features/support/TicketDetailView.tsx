import {type FormEvent, type KeyboardEvent, type ReactNode, useState} from 'react';
import {
    AlertCircle,
    ArrowRight,
    Check,
    ChevronDown,
    ChevronUp,
    Loader2,
    Send,
    Star,
    UserRound,
    XCircle,
} from 'lucide-react';
import {formatDateTimeFa} from '../../utils/formatDateTime';
import {formatNumberFa} from '../../utils/numberFormat';
import StarRating from './StarRating';
import TicketConversation from './TicketConversation';
import {getTicketLifecycle} from './supportStats';
import {CLOSED_BY_LABELS, isTicketClosed, SUPPORT_CATEGORY_META, SUPPORT_PRIORITY_META} from './supportMeta';
import type {SupportTicket, SupportTicketMessage} from './types';

const cardClass = 'rounded-2xl border border-border/70 bg-surface shadow-card dark:shadow-none';

type TicketDetailViewProps = {
    ticket: SupportTicket;
    messages: SupportTicketMessage[];
    mode: 'user' | 'admin';
    loading?: boolean;
    error?: string | null;
    success?: string | null;
    onBack: () => void;
    reply: string;
    onReplyChange: (value: string) => void;
    onSubmitReply: (event: FormEvent<HTMLFormElement>) => void;
    replySubmitting: boolean;
    showReply: boolean;
    onClose?: () => void;
    closeSubmitting?: boolean;
    showClose?: boolean;
    rating?: number;
    onRatingChange?: (value: number) => void;
    ratingComment?: string;
    onRatingCommentChange?: (value: string) => void;
    onSubmitRating?: () => void;
    ratingSubmitting?: boolean;
    ratingSuccess?: string | null;
    showRating?: boolean;
    replyPlaceholder?: string;
    replyInputId?: string;
    onEditMessage?: (messageId: number | null, newText: string) => Promise<void>;
};

export default function TicketDetailView({
                                             ticket,
                                             messages,
                                             mode,
                                             loading = false,
                                             error,
                                             success,
                                             onBack,
                                             reply,
                                             onReplyChange,
                                             onSubmitReply,
                                             replySubmitting,
                                             showReply,
                                             onClose,
                                             closeSubmitting = false,
                                             showClose = false,
                                             rating = 0,
                                             onRatingChange,
                                             ratingComment = '',
                                             onRatingCommentChange,
                                             onSubmitRating,
                                             ratingSubmitting = false,
                                             ratingSuccess,
                                             showRating = false,
                                             replyPlaceholder = 'پیام خود را بنویسید...',
                                             replyInputId = 'ticket-reply',
                                             onEditMessage,
                                         }: TicketDetailViewProps) {
    const [showUserDetails, setShowUserDetails] = useState(false);
    const lifecycle = getTicketLifecycle(ticket.status);
    const closedByLabel = ticket.status === 'CLOSED' && ticket.closedBy
        ? CLOSED_BY_LABELS[ticket.closedBy]
        : null;
    const categoryMeta = SUPPORT_CATEGORY_META[ticket.category];
    const priorityMeta = SUPPORT_PRIORITY_META[ticket.priority];
    const hasFooter = showReply || showClose;

    const handleReplyKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
        if (event.key !== 'Enter' || event.shiftKey) {
            return;
        }
        event.preventDefault();
        event.currentTarget.form?.requestSubmit();
    };

    const userDetails = ticket.user;
    const hasExtendedUserDetails = Boolean(
        userDetails?.firstName
        || userDetails?.lastName
        || userDetails?.nationalCode
        || userDetails?.phoneNumber
        || userDetails?.email,
    );

    let ratingSection: ReactNode = null;
    if (ticket.rating) {
        ratingSection = (
            <div className="rounded-xl border border-warning/20 bg-warning/8 p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-bold text-text">
                    <Star className="h-4 w-4 text-warning"/>
                    امتیاز کاربر
                </div>
                <StarRating value={ticket.rating} disabled size="md"/>
                {ticket.ratingComment ? (
                    <p className="mt-2 text-xs leading-6 text-muted">{ticket.ratingComment}</p>
                ) : null}
            </div>
        );
    } else if (showRating && onRatingChange && onSubmitRating) {
        ratingSection = (
            <div className="rounded-xl border border-border/60 bg-surface p-4">
                <p className="text-sm font-bold text-text">امتیاز به پشتیبانی</p>
                <div className="mt-3">
                    <StarRating value={rating} onChange={onRatingChange}/>
                </div>
                {onRatingCommentChange ? (
                    <textarea
                        value={ratingComment}
                        onChange={(event) => onRatingCommentChange(event.target.value)}
                        rows={2}
                        maxLength={500}
                        placeholder="نظر شما (اختیاری)"
                        className="mt-3 w-full resize-none rounded-xl border border-border/80 bg-surface-2 px-3 py-2.5 text-sm leading-7 text-text outline-none transition placeholder:text-muted focus:border-primary/45 focus:ring-2 focus:ring-primary/25"
                    />
                ) : null}
                {ratingSuccess ? (
                    <div
                        className="mt-3 flex items-center gap-2 rounded-xl border border-positive/30 bg-positive/10 px-3 py-2 text-xs text-positive">
                        <Check className="h-4 w-4"/>
                        {ratingSuccess}
                    </div>
                ) : (
                    <button
                        type="button"
                        onClick={onSubmitRating}
                        disabled={ratingSubmitting}
                        className="mt-3 inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-white transition hover:brightness-105 disabled:opacity-70"
                    >
                        {ratingSubmitting ? <Loader2 className="h-4 w-4 animate-spin"/> : <Star className="h-4 w-4"/>}
                        ثبت امتیاز
                    </button>
                )}
            </div>
        );
    }

    return (
        <section dir="rtl" className={`${cardClass} flex max-h-[min(88vh,760px)] flex-col overflow-hidden`}>
            <header className="shrink-0 border-b border-border/50 px-4 py-3 sm:px-5">
                <div className="flex items-start gap-3">
                    <button
                        type="button"
                        onClick={onBack}
                        className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border/70 text-muted transition hover:text-text"
                        aria-label="بازگشت"
                    >
                        <ArrowRight className="h-4 w-4"/>
                    </button>

                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                            <h2 className="text-sm font-black text-text sm:text-base">{ticket.subject}</h2>
                            <span
                                className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${lifecycle.className}`}>
                                {lifecycle.label}
                            </span>
                        </div>
                        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-muted">
                            <span>#{formatNumberFa(ticket.id)}</span>
                            <span>•</span>
                            <span>{categoryMeta.label}</span>
                            <span>•</span>
                            <span>{priorityMeta.label}</span>
                            {closedByLabel ? (
                                <>
                                    <span>•</span>
                                    <span>{closedByLabel}</span>
                                </>
                            ) : null}
                            <span>•</span>
                            <span dir="ltr">{formatDateTimeFa(ticket.createdAt)}</span>
                        </div>
                    </div>

                    {mode === 'admin' && ticket.user ? (
                        <button
                            type="button"
                            onClick={() => setShowUserDetails((prev) => !prev)}
                            className="hidden shrink-0 items-center gap-2 rounded-xl border border-border/60 bg-surface-2 px-3 py-2 transition hover:border-primary/30 sm:flex"
                        >
                            <UserRound className="h-4 w-4 text-muted"/>
                            <div className="min-w-0 text-right">
                                <p className="truncate text-xs font-bold text-text">{ticket.user.displayName}</p>
                                <p className="truncate text-[10px] text-muted">@{ticket.user.username}</p>
                            </div>
                            {hasExtendedUserDetails ? (
                                showUserDetails ? <ChevronUp className="h-3.5 w-3.5 text-muted"/> :
                                    <ChevronDown className="h-3.5 w-3.5 text-muted"/>
                            ) : null}
                        </button>
                    ) : null}
                </div>

                {mode === 'admin' && ticket.user ? (
                    <button
                        type="button"
                        onClick={() => setShowUserDetails((prev) => !prev)}
                        className="mt-2 flex w-full items-center gap-2 rounded-xl border border-border/60 bg-surface-2 px-3 py-2 sm:hidden"
                    >
                        <UserRound className="h-4 w-4 shrink-0 text-muted"/>
                        <div className="min-w-0 flex-1 text-right">
                            <p className="truncate text-xs font-bold text-text">{ticket.user.displayName}</p>
                            <p className="truncate text-[10px] text-muted">@{ticket.user.username}</p>
                        </div>
                        {hasExtendedUserDetails ? (
                            showUserDetails ? <ChevronUp className="h-3.5 w-3.5 text-muted"/> :
                                <ChevronDown className="h-3.5 w-3.5 text-muted"/>
                        ) : null}
                    </button>
                ) : null}

                {mode === 'admin' && showUserDetails && userDetails && hasExtendedUserDetails ? (
                    <div
                        className="mt-2 grid grid-cols-1 gap-2 rounded-xl border border-border/60 bg-surface-2 p-3 text-xs sm:grid-cols-2">
                        {userDetails.firstName || userDetails.lastName ? (
                            <div>
                                <p className="text-[10px] text-muted">نام و نام خانوادگی</p>
                                <p className="mt-0.5 font-semibold text-text">
                                    {[userDetails.firstName, userDetails.lastName].filter(Boolean).join(' ')}
                                </p>
                            </div>
                        ) : null}
                        <div>
                            <p className="text-[10px] text-muted">نام کاربری</p>
                            <p className="mt-0.5 font-semibold text-text" dir="ltr">@{userDetails.username}</p>
                        </div>
                        {userDetails.nationalCode ? (
                            <div>
                                <p className="text-[10px] text-muted">کد ملی</p>
                                <p className="mt-0.5 font-semibold text-text" dir="ltr">{userDetails.nationalCode}</p>
                            </div>
                        ) : null}
                        {userDetails.phoneNumber ? (
                            <div>
                                <p className="text-[10px] text-muted">شماره تماس</p>
                                <p className="mt-0.5 font-semibold text-text" dir="ltr">{userDetails.phoneNumber}</p>
                            </div>
                        ) : null}
                        {userDetails.email ? (
                            <div className="sm:col-span-2">
                                <p className="text-[10px] text-muted">ایمیل</p>
                                <p className="mt-0.5 font-semibold text-text" dir="ltr">{userDetails.email}</p>
                            </div>
                        ) : null}
                    </div>
                ) : null}
            </header>

            <div className="thin-scrollbar flex-1 space-y-3 overflow-y-auto p-4 sm:px-5">
                {loading ? (
                    <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted">
                        <Loader2 className="h-4 w-4 animate-spin"/>
                        در حال بارگذاری...
                    </div>
                ) : (
                    <>
                        {error ? (
                            <div
                                className="flex items-center gap-2 rounded-xl border border-negative/30 bg-negative/10 px-3 py-2 text-xs text-negative">
                                <AlertCircle className="h-4 w-4 shrink-0"/>
                                {error}
                            </div>
                        ) : null}
                        {success ? (
                            <div
                                className="flex items-center gap-2 rounded-xl border border-positive/30 bg-positive/10 px-3 py-2 text-xs text-positive">
                                <Check className="h-4 w-4 shrink-0"/>
                                {success}
                            </div>
                        ) : null}

                        <TicketConversation
                            messages={messages}
                            mode={mode}
                            allowEdit={mode === 'admin' ? true : !isTicketClosed(ticket.status)}
                            onEditMessage={onEditMessage}
                        />
                        {ratingSection}
                    </>
                )}
            </div>

            {hasFooter ? (
                <footer className="shrink-0 border-t border-border/50 bg-surface/95 p-3 backdrop-blur sm:px-4">
                    {showReply ? (
                        <form onSubmit={onSubmitReply} className="flex items-end gap-2">
                            <textarea
                                id={replyInputId}
                                value={reply}
                                onChange={(event) => onReplyChange(event.target.value)}
                                onKeyDown={handleReplyKeyDown}
                                rows={2}
                                maxLength={2000}
                                placeholder={replyPlaceholder}
                                className="min-h-[44px] flex-1 resize-none rounded-xl border border-border/80 bg-surface-2 px-3 py-2.5 text-sm leading-7 text-text outline-none transition placeholder:text-muted focus:border-primary/45 focus:ring-2 focus:ring-primary/25"
                            />
                            <button
                                type="submit"
                                disabled={replySubmitting}
                                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-white transition hover:brightness-105 disabled:opacity-70"
                                aria-label="ارسال"
                            >
                                {replySubmitting ? <Loader2 className="h-4 w-4 animate-spin"/> :
                                    <Send className="h-4 w-4"/>}
                            </button>
                        </form>
                    ) : null}

                    {showClose && onClose ? (
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={closeSubmitting}
                            className={`inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-border/80 bg-surface-2 text-sm font-semibold text-text transition hover:border-negative/30 hover:bg-negative/5 hover:text-negative disabled:opacity-70 ${showReply ? 'mt-2' : ''}`}
                        >
                            {closeSubmitting ? <Loader2 className="h-4 w-4 animate-spin"/> :
                                <XCircle className="h-4 w-4"/>}
                            بستن تیکت
                        </button>
                    ) : null}
                </footer>
            ) : null}
        </section>
    );
}
