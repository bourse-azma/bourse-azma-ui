type FieldLabelProps = {
    title: string;
    required?: boolean;
};

export default function FieldLabel({title, required = false}: FieldLabelProps) {
    return (
        <div className="mb-1.5">
            <span className="text-xs font-semibold text-text">
                {title}
                {required ? <span className="mr-1 text-negative">*</span> : null}
            </span>
        </div>
    );
}
