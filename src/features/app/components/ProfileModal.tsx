import FieldLabel from '../../../components/ui/FieldLabel';
import type {UserProfile} from '../types';

type ProfileModalProps = {
    open: boolean;
    profile: UserProfile | null;
    profileLoading: boolean;
    profileError: string | null;
    profileEditMode: boolean;
    saveLoading: boolean;
    saveError: string | null;
    saveSuccess: string | null;
    editUsername: string;
    editFirstName: string;
    editLastName: string;
    editNationalCode: string;
    editPhoneNumber: string;
    editEmail: string;
    editPassword: string;
    editCurrentPassword: string;
    usernameValidationMessage: string;
    passwordValidationMessage: string;
    onClose: () => void;
    onStartEdit: () => void;
    onCancelEdit: () => void;
    onSubmit: () => void;
    onEditUsernameChange: (value: string) => void;
    onEditFirstNameChange: (value: string) => void;
    onEditLastNameChange: (value: string) => void;
    onEditNationalCodeChange: (value: string) => void;
    onEditPhoneNumberChange: (value: string) => void;
    onEditEmailChange: (value: string) => void;
    onEditPasswordChange: (value: string) => void;
    onEditCurrentPasswordChange: (value: string) => void;
};

export function ProfileModal({
                                 open,
                                 profile,
                                 profileLoading,
                                 profileError,
                                 profileEditMode,
                                 saveLoading,
                                 saveError,
                                 saveSuccess,
                                 editUsername,
                                 editFirstName,
                                 editLastName,
                                 editNationalCode,
                                 editPhoneNumber,
                                 editEmail,
                                 editPassword,
                                 editCurrentPassword,
                                 usernameValidationMessage,
                                 passwordValidationMessage,
                                 onClose,
                                 onStartEdit,
                                 onCancelEdit,
                                 onSubmit,
                                 onEditUsernameChange,
                                 onEditFirstNameChange,
                                 onEditLastNameChange,
                                 onEditNationalCodeChange,
                                 onEditPhoneNumberChange,
                                 onEditEmailChange,
                                 onEditPasswordChange,
                                 onEditCurrentPasswordChange,
                             }: ProfileModalProps) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/35 p-4">
            <section className="w-full max-w-2xl rounded-3xl border border-border/80 bg-surface p-6 shadow-card sm:p-7">
                <div className="mb-4 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-black text-text">پروفایل کاربری</h2>
                        <p className="mt-1 text-xs text-muted">فیلدهای ستاره‌دار باید مقدار داشته باشند.</p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg border border-border bg-surface-2 px-2 py-1 text-xs text-muted transition hover:text-text"
                    >
                        بستن
                    </button>
                </div>

                {profileLoading ? <p className="text-sm text-muted">در حال دریافت اطلاعات...</p> : null}
                {profileError ? <p className="text-sm text-negative">{profileError}</p> : null}

                {profile ? (
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div>
                                <FieldLabel title="نام کاربری" required/>
                                <input
                                    name="username"
                                    autoComplete="username"
                                    value={editUsername}
                                    onChange={(event) => onEditUsernameChange(event.target.value)}
                                    disabled={!profileEditMode}
                                    minLength={3}
                                    maxLength={50}
                                    pattern="[A-Za-z0-9._-]{3,50}"
                                    title={usernameValidationMessage}
                                    className="w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-sm text-text disabled:opacity-70"
                                    placeholder="نام کاربری"
                                />
                            </div>
                            <div>
                                <FieldLabel title="نام" required/>
                                <input
                                    name="given-name"
                                    autoComplete="given-name"
                                    pattern="[آاأإئؤءبپتثجچحخدذرزژسشصضطظعغفقکكيگگلمنوهةیى\s‌]+"
                                    title="نام باید فقط با حروف فارسی وارد شود."
                                    value={editFirstName}
                                    onChange={(event) => onEditFirstNameChange(event.target.value)}
                                    disabled={!profileEditMode}
                                    className="w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-sm text-text disabled:opacity-70"
                                    placeholder="نام"
                                />
                            </div>
                            <div>
                                <FieldLabel title="نام خانوادگی" required/>
                                <input
                                    name="family-name"
                                    autoComplete="family-name"
                                    pattern="[آاأإئؤءبپتثجچحخدذرزژسشصضطظعغفقکكيگگلمنوهةیى\s‌]+"
                                    title="نام خانوادگی باید فقط با حروف فارسی وارد شود."
                                    value={editLastName}
                                    onChange={(event) => onEditLastNameChange(event.target.value)}
                                    disabled={!profileEditMode}
                                    className="w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-sm text-text disabled:opacity-70"
                                    placeholder="نام خانوادگی"
                                />
                            </div>
                            <div>
                                <FieldLabel title="کد ملی"/>
                                <input
                                    name="national-code"
                                    value={editNationalCode}
                                    onChange={(event) => onEditNationalCodeChange(event.target.value)}
                                    disabled={!profileEditMode}
                                    className="w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-sm text-text disabled:opacity-70"
                                    placeholder="کد ملی"
                                />
                            </div>
                        </div>

                        <div>
                            <FieldLabel title="شماره موبایل"/>
                            <input
                                name="tel"
                                autoComplete="tel"
                                value={editPhoneNumber}
                                onChange={(event) => onEditPhoneNumberChange(event.target.value)}
                                disabled={!profileEditMode}
                                className="w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-sm text-text disabled:opacity-70"
                                placeholder="شماره موبایل"
                            />
                        </div>
                        <div>
                            <FieldLabel title="ایمیل"/>
                            <input
                                name="email"
                                autoComplete="email"
                                type="email"
                                value={editEmail}
                                onChange={(event) => onEditEmailChange(event.target.value)}
                                disabled={!profileEditMode}
                                className="w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-sm text-text disabled:opacity-70"
                                placeholder="ایمیل"
                            />
                        </div>
                        {profileEditMode ? (
                            <div className="space-y-3 rounded-xl border border-border/70 bg-surface-2/60 p-3">
                                <div>
                                    <FieldLabel title="رمز عبور فعلی"/>
                                    <input
                                        name="current-password"
                                        autoComplete="current-password"
                                        value={editCurrentPassword}
                                        onChange={(event) => onEditCurrentPasswordChange(event.target.value)}
                                        type="password"
                                        className="w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-sm text-text"
                                        placeholder="فقط هنگام تغییر رمز عبور"
                                    />
                                </div>
                                <div>
                                    <FieldLabel title="رمز عبور جدید"/>
                                    <input
                                        name="new-password"
                                        autoComplete="new-password"
                                        value={editPassword}
                                        onChange={(event) => onEditPasswordChange(event.target.value)}
                                        type="password"
                                        minLength={8}
                                        maxLength={24}
                                        pattern="^(?=.*[A-Za-z])(?=.*\d).+$"
                                        title={passwordValidationMessage}
                                        className="w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-sm text-text"
                                        placeholder="رمز جدید (در صورت نیاز وارد کنید)"
                                    />
                                    <p className="mt-1 text-[11px] text-muted">اگر این فیلد خالی بماند، رمز عبور تغییر
                                        نمی‌کند.</p>
                                </div>
                            </div>
                        ) : null}

                        {saveError ? (
                            <p className="rounded-lg border border-negative/40 bg-negative/10 px-3 py-2 text-xs text-negative">
                                {saveError}
                            </p>
                        ) : null}
                        {saveSuccess ? (
                            <p className="rounded-lg border border-positive/40 bg-positive/10 px-3 py-2 text-xs text-positive">
                                {saveSuccess}
                            </p>
                        ) : null}

                        <div className="flex items-center justify-end gap-2 pt-1">
                            {profileEditMode ? (
                                <>
                                    <button
                                        type="button"
                                        onClick={onCancelEdit}
                                        className="rounded-xl border border-border bg-surface-2 px-3 py-2 text-xs text-muted transition hover:text-text"
                                    >
                                        انصراف
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => void onSubmit()}
                                        disabled={saveLoading}
                                        className="rounded-xl bg-primary px-3 py-2 text-xs font-bold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
                                    >
                                        {saveLoading ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
                                    </button>
                                </>
                            ) : (
                                <button
                                    type="button"
                                    onClick={onStartEdit}
                                    className="rounded-xl bg-primary px-3 py-2 text-xs font-bold text-white transition hover:brightness-110"
                                >
                                    ویرایش اطلاعات
                                </button>
                            )}
                        </div>
                    </div>
                ) : null}
            </section>
        </div>
    );
}
