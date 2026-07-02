import bourseAzmaLogo from '../assets/bourse-azma-logo.png';

type BourseAzmaLogoProps = {
    compact?: boolean;
    className?: string;
};

export default function BourseAzmaLogo({compact = false, className = ''}: BourseAzmaLogoProps) {
    return (
        <div className={`flex items-center gap-3 ${className}`}>
            <img
                src={bourseAzmaLogo}
                alt="بورس آزما"
                className={`${compact ? 'h-10 w-auto max-w-[120px]' : 'h-12 w-auto max-w-[148px]'} shrink-0 object-contain drop-shadow-[0_0_22px_rgba(0,229,201,0.32)]`}
            />
            {!compact ? (
                <div>
                    <p className="text-lg font-black leading-5 text-white">بورس آزما</p>
                    <p className="mt-1 text-[11px] font-semibold text-[#00E5C9]">bourse azma</p>
                </div>
            ) : null}
        </div>
    );
}
