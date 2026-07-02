import type {LucideIcon} from 'lucide-react';

export function IconBadge({icon: Icon, accent = 'teal'}: { icon: LucideIcon; accent?: 'teal' | 'gold' }) {
    return (
        <span
            className={`inline-flex h-12 w-12 items-center justify-center rounded-lg border ${
                accent === 'teal'
                    ? 'border-[#00E5C9]/30 bg-[#00E5C9]/10 text-[#00E5C9]'
                    : 'border-[#FFB300]/35 bg-[#FFB300]/10 text-[#FFB300]'
            }`}
        >
            <Icon className="h-6 w-6" strokeWidth={1.8}/>
        </span>
    );
}
