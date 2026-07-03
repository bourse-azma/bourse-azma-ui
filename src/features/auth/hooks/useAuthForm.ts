import {FormEvent, useEffect, useMemo, useState} from 'react';
import {validatePassword, validateUsername} from '../../../lib/authValidation';
import {isPersianName, normalizePhoneNumber, toEnglishDigits} from '../../../lib/stringUtils';
import {loginDescription, registerDescription} from '../constants';
import {generateStrongPassword} from '../utils/generateStrongPassword';
import {parseInitialBalanceInput} from '../utils/parseInitialBalanceInput';
import {submitAuthRequest} from './submitAuthRequest';
import type {AuthMode, AuthPageProps, AuthSession} from '../types';

export function useAuthForm({onAuthenticated, initialMode = 'login', onModeChange}: AuthPageProps) {
    const [mode, setMode] = useState<AuthMode>(initialMode);
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);
    const [generatedPasswordConfirmed, setGeneratedPasswordConfirmed] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [username, setUsername] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [nationalCode, setNationalCode] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [email, setEmail] = useState('');
    const [initialBalance, setInitialBalance] = useState('');
    const [selectedBalancePreset, setSelectedBalancePreset] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const description = useMemo(
        () => (mode === 'login' ? loginDescription : registerDescription),
        [mode]
    );

    useEffect(() => {
        document.body.style.backgroundColor = '#0A1428';
        return () => {
            document.body.style.backgroundColor = '';
        };
    }, []);

    useEffect(() => {
        setMode(initialMode);
        setError(null);
        setGeneratedPassword(null);
        setGeneratedPasswordConfirmed(false);
        setInitialBalance('');
        setSelectedBalancePreset(null);
    }, [initialMode]);

    const submitLabel = mode === 'login' ? 'ورود' : 'ثبت نام';

    const resetRegisterFields = () => {
        setGeneratedPassword(null);
        setGeneratedPasswordConfirmed(false);
        setInitialBalance('');
        setSelectedBalancePreset(null);
    };

    const handleModeChange = (nextMode: AuthMode) => {
        setMode(nextMode);
        setError(null);
        resetRegisterFields();
        onModeChange?.(nextMode);
    };

    const applyGeneratedPassword = () => {
        const nextPassword = generateStrongPassword();
        setPassword(nextPassword);
        setPasswordConfirmation(nextPassword);
        setGeneratedPassword(nextPassword);
        setGeneratedPasswordConfirmed(false);
        setError(null);
    };

    const copyGeneratedPassword = async () => {
        if (!generatedPassword) return;
        await navigator.clipboard?.writeText(generatedPassword);
    };

    const handlePasswordChange = (value: string) => {
        setPassword(value);
        setGeneratedPasswordConfirmed(false);
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsSubmitting(true);
        setError(null);

        try {
            const trimmedPassword = password.trim();
            if (mode === 'login') {
                const session = await submitAuthRequest('login', {
                    identifier: identifier.trim(),
                    password: trimmedPassword,
                    rememberMe,
                });
                onAuthenticated({...session, rememberMe});
                return;
            }

            if (!isPersianName(firstName) || !isPersianName(lastName)) {
                throw new Error('نام و نام خانوادگی باید فقط با حروف فارسی وارد شوند.');
            }

            const usernameError = validateUsername(username);
            if (usernameError) {
                throw new Error(usernameError);
            }

            const passwordError = validatePassword(trimmedPassword);
            if (passwordError) {
                throw new Error(passwordError);
            }

            if (trimmedPassword !== passwordConfirmation.trim()) {
                throw new Error('رمز عبور و تکرار آن یکسان نیستند.');
            }

            if (generatedPassword && trimmedPassword === generatedPassword && !generatedPasswordConfirmed) {
                throw new Error('برای استفاده از رمز پیشنهادی، ابتدا تأیید کنید که آن را در جای امن نگه داشته‌اید.');
            }

            const parsedBalance = parseInitialBalanceInput(initialBalance);
            if (parsedBalance !== null && (!Number.isFinite(parsedBalance) || parsedBalance < 0)) {
                throw new Error('موجودی اولیه باید عددی معتبر و بزرگ‌تر یا مساوی صفر باشد.');
            }

            const session = await submitAuthRequest('register', {
                username: username.trim().toLowerCase(),
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                nationalCode: toEnglishDigits(nationalCode).trim(),
                phoneNumber: normalizePhoneNumber(phoneNumber),
                email: toEnglishDigits(email).trim().toLowerCase(),
                password: trimmedPassword,
                ...(parsedBalance !== null ? {balance: parsedBalance} : {}),
            });
            onAuthenticated({...session, rememberMe: false});
        } catch (requestError) {
            const message =
                requestError instanceof Error ? requestError.message : 'خطایی در احراز هویت رخ داد.';
            setError(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return {
        mode,
        description,
        submitLabel,
        error,
        isSubmitting,
        identifier,
        setIdentifier,
        username,
        setUsername,
        firstName,
        setFirstName,
        lastName,
        setLastName,
        nationalCode,
        setNationalCode,
        phoneNumber,
        setPhoneNumber,
        email,
        setEmail,
        initialBalance,
        setInitialBalance,
        selectedBalancePreset,
        setSelectedBalancePreset,
        password,
        passwordConfirmation,
        setPasswordConfirmation,
        generatedPassword,
        generatedPasswordConfirmed,
        setGeneratedPasswordConfirmed,
        rememberMe,
        setRememberMe,
        handleModeChange,
        handleSubmit,
        applyGeneratedPassword,
        copyGeneratedPassword,
        handlePasswordChange,
        clearError: () => setError(null),
    };
}

export type {AuthSession};
