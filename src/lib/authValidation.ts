export const USERNAME_PATTERN = /^[A-Za-z0-9._-]{3,50}$/;
export const PASSWORD_PATTERN = /^(?=.*[A-Za-z])(?=.*\d).+$/;

export const USERNAME_VALIDATION_MESSAGE =
    'نام کاربری باید ۳ تا ۵۰ کاراکتر و شامل حروف انگلیسی، عدد یا . _ - باشد.';
export const PASSWORD_VALIDATION_MESSAGE = 'رمز عبور باید بین ۸ تا ۲۴ کاراکتر و حداقل شامل یک حرف و یک عدد باشد.';

export const validateUsername = (username: string): string | null => {
    const normalized = username.trim();
    if (normalized === '') {
        return 'نام کاربری نباید خالی باشد.';
    }
    if (!USERNAME_PATTERN.test(normalized)) {
        return USERNAME_VALIDATION_MESSAGE;
    }
    return null;
};

export const validatePassword = (password: string): string | null => {
    const normalized = password.trim();
    if (normalized.length < 8 || normalized.length > 24) {
        return 'رمز عبور باید بین ۸ تا ۲۴ کاراکتر باشد.';
    }
    if (!PASSWORD_PATTERN.test(normalized)) {
        return PASSWORD_VALIDATION_MESSAGE;
    }
    return null;
};
