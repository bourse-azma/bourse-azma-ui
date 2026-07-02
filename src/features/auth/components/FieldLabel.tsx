type FieldLabelProps = {
    title: string;
    required?: boolean;
    showRequirement?: boolean;
};

export function FieldLabel({title, required = false, showRequirement = true}: FieldLabelProps) {
    return (
        <div className="mb-1.5 flex items-baseline justify-between">
            <span className="text-xs font-semibold text-white/78">
                {title}
                {showRequirement && required ? <span className="mr-1 text-[#FF6B7A]">*</span> : null}
            </span>
        </div>
    );
}
