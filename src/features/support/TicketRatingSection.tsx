import {Check, Loader2, Star} from 'lucide-react';
import StarRating from './StarRating';

type TicketRatingSectionProps = {
    ticketRating: number | null;
    ticketRatingComment: string | null;
    rating: number;
    onRatingChange?: (value: number) => void;
    ratingComment: string;
    onRatingCommentChange?: (value: string) => void;
    onSubmitRating?: () => void;
    ratingSubmitting: boolean;
    ratingSuccess?: string | null;
    showRating: boolean;
};

export default function TicketRatingSection({
                                                ticketRating,
                                                ticketRatingComment,
                                                rating,
                                                onRatingChange,
                                                ratingComment,
                                                onRatingCommentChange,
                                                onSubmitRating,
                                                ratingSubmitting,
                                                ratingSuccess,
                                                showRating,
                                            }: TicketRatingSectionProps) {
    if (ticketRating) {
        return (
            <div className="rounded-xl border border-warning/20 bg-warning/8 p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-bold text-text">
                    <Star className="h-4 w-4 text-warning"/>
                    امتیاز کاربر
                </div>
                <StarRating value={ticketRating} disabled size="md"/>
                {ticketRatingComment ? (
                    <p className="mt-2 text-xs leading-6 text-muted">{ticketRatingComment}</p>
                ) : null}
            </div>
        );
    }

    if (!showRating || !onRatingChange || !onSubmitRating) {
        return null;
    }

    return (
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
