type ApiEnvelope<T> = {
    message?: string;
    result?: T;
};

type ApiErrorResult = {
    detail?: string;
    errors?: Record<string, string>;
};

const firstFieldError = (errors?: Record<string, string>): string | null => {
    if (!errors) return null;
    const firstKey = Object.keys(errors)[0];
    if (!firstKey) return null;
    const message = errors[firstKey];
    return typeof message === 'string' && message.trim() !== '' ? message : null;
};

/** Extracts a user-facing error message from a standard API error envelope. */
export const toApiErrorMessage = (data: unknown, fallback: string): string => {
    if (!data || typeof data !== 'object') return fallback;

    const response = data as ApiEnvelope<ApiErrorResult>;
    const detail = response.result?.detail;
    if (typeof detail === 'string' && detail.trim() !== '') return detail;

    const fieldError = firstFieldError(response.result?.errors);
    if (fieldError) return fieldError;

    if (typeof response.message === 'string' && response.message.trim() !== '') return response.message;

    return fallback;
};
