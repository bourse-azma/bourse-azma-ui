import type {ReactNode} from 'react';

type DepthFillProps = {
    percent: number;
    tone: 'positive' | 'negative';
    origin: 'left' | 'right';
};

/** Flat background fill for table cells — no pill/track chrome. */
export function DepthFill({percent, tone, origin}: DepthFillProps) {
    if (percent <= 0) return null;

    const fillClass = tone === 'positive' ? 'bg-positive/20' : 'bg-negative/20';
    const originClass = origin === 'left' ? 'left-0 rounded-r-sm' : 'right-0 rounded-l-sm';

    return (
        <div
            aria-hidden
            className={`pointer-events-none absolute inset-y-0 ${originClass} ${fillClass} transition-[width] duration-500 ease-out`}
            style={{width: `${Math.min(100, percent)}%`}}
        />
    );
}

type PowerBarProps = {
    percent: number;
    tone: 'positive' | 'negative';
    origin: 'left' | 'right';
    children?: ReactNode;
    trackClassName?: string;
    fillClassName?: string;
};

/** Rounded track bar — used only in حقیقی/حقوقی section. */
export default function PowerBar({
                                     percent,
                                     tone,
                                     origin,
                                     children,
                                     trackClassName = 'min-h-[1.625rem] rounded-full bg-border/45',
                                     fillClassName,
                                 }: PowerBarProps) {
    const fillTone = fillClassName ?? (tone === 'positive' ? 'bg-positive/40' : 'bg-negative/40');
    const fillOrigin = origin === 'left' ? 'left-0 rounded-r-full' : 'right-0 rounded-l-full';
    const clamped = Math.min(100, Math.max(0, percent));

    return (
        <div className={`relative overflow-hidden ${trackClassName}`}>
            {clamped > 0 ? (
                <div
                    aria-hidden
                    className={`pointer-events-none absolute inset-y-0 ${fillOrigin} ${fillTone} transition-[width] duration-500 ease-out`}
                    style={{width: `${clamped}%`}}
                />
            ) : null}
            {children ? (
                <div className="relative z-[1] flex h-full items-center justify-center px-2">{children}</div>
            ) : null}
        </div>
    );
}
