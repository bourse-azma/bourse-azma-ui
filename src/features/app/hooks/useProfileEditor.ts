import {useCallback, useState} from 'react';
import {
    PASSWORD_VALIDATION_MESSAGE,
    USERNAME_VALIDATION_MESSAGE,
    validatePassword,
    validateUsername,
} from '../../../lib/authValidation';
import {toApiErrorMessage} from '../../../lib/apiError';
import {withAuthRequest} from '../../../lib/authRequest';
import {isPersianName, normalizePhoneNumber, toEnglishDigits} from '../../../lib/stringUtils';
import type {ApiResponse, SessionState, UserProfile} from '../types';

export function useProfileEditor(session: SessionState | null, profile: UserProfile | null, onProfileUpdated: (profile: UserProfile) => void) {
    const [profileModalOpen, setProfileModalOpen] = useState(false);
    const [profileEditMode, setProfileEditMode] = useState(false);
    const [saveLoading, setSaveLoading] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
    const [editFirstName, setEditFirstName] = useState('');
    const [editLastName, setEditLastName] = useState('');
    const [editUsername, setEditUsername] = useState('');
    const [editNationalCode, setEditNationalCode] = useState('');
    const [editPhoneNumber, setEditPhoneNumber] = useState('');
    const [editEmail, setEditEmail] = useState('');
    const [editPassword, setEditPassword] = useState('');
    const [editCurrentPassword, setEditCurrentPassword] = useState('');

    const resetEditFields = useCallback((targetProfile: UserProfile) => {
        setEditFirstName(targetProfile.firstName);
        setEditLastName(targetProfile.lastName);
        setEditUsername(targetProfile.username);
        setEditNationalCode(targetProfile.nationalCode);
        setEditPhoneNumber(targetProfile.phoneNumber);
        setEditEmail(targetProfile.email);
        setEditPassword('');
        setEditCurrentPassword('');
    }, []);

    const openProfileModal = useCallback(() => {
        if (profile) {
            resetEditFields(profile);
        }
        setSaveError(null);
        setSaveSuccess(null);
        setProfileModalOpen(true);
        setProfileEditMode(false);
    }, [profile, resetEditFields]);

    const closeProfileModal = useCallback(() => {
        setProfileModalOpen(false);
    }, []);

    const cancelEdit = useCallback(() => {
        setProfileEditMode(false);
        setSaveError(null);
        setSaveSuccess(null);
        setEditPassword('');
        setEditCurrentPassword('');
    }, []);

    const submitProfileUpdate = async () => {
        if (!session || !profile) return;
        setSaveLoading(true);
        setSaveError(null);
        setSaveSuccess(null);

        const newPassword = editPassword.trim();
        const payload = {
            username: editUsername.trim().toLowerCase(),
            firstName: editFirstName.trim(),
            lastName: editLastName.trim(),
            nationalCode: toEnglishDigits(editNationalCode).trim(),
            phoneNumber: normalizePhoneNumber(editPhoneNumber),
            email: toEnglishDigits(editEmail).trim().toLowerCase(),
            password: newPassword === '' ? null : newPassword,
            currentPassword: newPassword === '' ? null : editCurrentPassword.trim(),
        };

        try {
            if (!isPersianName(payload.firstName) || !isPersianName(payload.lastName)) {
                throw new Error('نام و نام خانوادگی باید فقط با حروف فارسی وارد شوند.');
            }
            const usernameError = validateUsername(payload.username);
            if (usernameError) {
                throw new Error(usernameError);
            }
            if (newPassword !== '') {
                const passwordError = validatePassword(newPassword);
                if (passwordError) {
                    throw new Error(passwordError);
                }
            }
            if (newPassword !== '' && payload.currentPassword === '') {
                throw new Error('برای تغییر رمز عبور، رمز فعلی را وارد کنید.');
            }

            const response = await fetch('/api/v1/users/me', withAuthRequest(session.accessToken, {
                method: 'PUT',
                body: JSON.stringify(payload),
            }));
            const text = await response.text();
            const data = text ? (JSON.parse(text) as unknown) : null;
            if (!response.ok) {
                throw new Error(toApiErrorMessage(data, 'ویرایش پروفایل انجام نشد.'));
            }
            const api = data as ApiResponse<UserProfile>;
            if (!api.result) {
                throw new Error('پاسخ ویرایش پروفایل معتبر نیست.');
            }
            onProfileUpdated(api.result);
            setSaveSuccess('اطلاعات پروفایل با موفقیت ذخیره شد.');
            setProfileEditMode(false);
            setEditPassword('');
            setEditCurrentPassword('');
        } catch (error) {
            const message = error instanceof Error ? error.message : 'خطا در ویرایش پروفایل.';
            setSaveError(message);
        } finally {
            setSaveLoading(false);
        }
    };

    return {
        profileModalOpen,
        profileEditMode,
        saveLoading,
        saveError,
        saveSuccess,
        editFirstName,
        setEditFirstName,
        editLastName,
        setEditLastName,
        editUsername,
        setEditUsername,
        editNationalCode,
        setEditNationalCode,
        editPhoneNumber,
        setEditPhoneNumber,
        editEmail,
        setEditEmail,
        editPassword,
        setEditPassword,
        editCurrentPassword,
        setEditCurrentPassword,
        openProfileModal,
        closeProfileModal,
        cancelEdit,
        startEdit: () => setProfileEditMode(true),
        submitProfileUpdate,
        usernameValidationMessage: USERNAME_VALIDATION_MESSAGE,
        passwordValidationMessage: PASSWORD_VALIDATION_MESSAGE,
    };
}
