import {Loader2} from 'lucide-react';
import type {useOrderPlacement} from './useOrderPlacement';

type OrderSubmitButtonsProps = {
    controller: ReturnType<typeof useOrderPlacement>;
};

export default function OrderSubmitButtons({controller}: OrderSubmitButtonsProps) {
    const {values, submitting, canSubmit, submit, isEditing} = controller;

    const isBuy = values.side === 'BUY';
    const submitBg = isBuy ? 'bg-positive' : 'bg-negative';
    const submitOutline = isBuy
        ? 'border-positive/50 text-positive hover:bg-positive/10'
        : 'border-negative/50 text-negative hover:bg-negative/10';

    return (
        <div className="grid grid-cols-[1fr_auto] gap-2">
            <button
                type="button"
                onClick={() => void submit(false)}
                disabled={!canSubmit}
                className={`flex h-11 items-center justify-center rounded-xl text-sm font-semibold text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60 ${submitBg}`}
            >
                {submitting ? (
                    <span className="flex items-center gap-1.5">
                        <Loader2 className="h-4 w-4 animate-spin"/>
                        در حال ثبت...
                    </span>
                ) : isEditing ? (
                    'ثبت ویرایش'
                ) : isBuy ? (
                    'ارسال خرید'
                ) : (
                    'ارسال فروش'
                )}
            </button>
            <button
                type="button"
                onClick={() => void submit(true)}
                disabled={!canSubmit}
                className={`flex h-11 items-center justify-center rounded-xl border bg-surface px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${submitOutline}`}
            >
                {isEditing ? 'ویرایش و بستن' : 'ارسال و بستن'}
            </button>
        </div>
    );
}
