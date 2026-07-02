import {USERNAME_VALIDATION_MESSAGE} from '../../../lib/authValidation';
import {authInputClassName, INITIAL_BALANCE_PRESETS} from '../constants';
import {FieldLabel} from './FieldLabel';
import {parseInitialBalanceInput} from '../utils/parseInitialBalanceInput';

type RegisterFormFieldsProps = {
    username: string;
    onUsernameChange: (value: string) => void;
    firstName: string;
    onFirstNameChange: (value: string) => void;
    lastName: string;
    onLastNameChange: (value: string) => void;
    nationalCode: string;
    onNationalCodeChange: (value: string) => void;
    phoneNumber: string;
    onPhoneNumberChange: (value: string) => void;
    email: string;
    onEmailChange: (value: string) => void;
    initialBalance: string;
    onInitialBalanceChange: (value: string) => void;
    selectedBalancePreset: number | null;
    onSelectBalancePreset: (value: number | null) => void;
    onClearError: () => void;
};

export function RegisterFormFields({
                                       username,
                                       onUsernameChange,
                                       firstName,
                                       onFirstNameChange,
                                       lastName,
                                       onLastNameChange,
                                       nationalCode,
                                       onNationalCodeChange,
                                       phoneNumber,
                                       onPhoneNumberChange,
                                       email,
                                       onEmailChange,
                                       initialBalance,
                                       onInitialBalanceChange,
                                       selectedBalancePreset,
                                       onSelectBalancePreset,
                                       onClearError,
                                   }: RegisterFormFieldsProps) {
    return (
        <>
            <div>
                <FieldLabel title="نام کاربری" required/>
                <input
                    name="username"
                    autoComplete="username"
                    autoCapitalize="none"
                    spellCheck={false}
                    value={username}
                    onChange={(event) => onUsernameChange(event.target.value)}
                    placeholder="نام کاربری (انگلیسی)"
                    required
                    minLength={3}
                    maxLength={50}
                    pattern="[A-Za-z0-9._-]{3,50}"
                    title={USERNAME_VALIDATION_MESSAGE}
                    className={authInputClassName}
                />
            </div>
            <div>
                <FieldLabel title="نام" required/>
                <input
                    name="given-name"
                    autoComplete="given-name"
                    pattern="[آاأإئؤءبپتثجچحخدذرزژسشصضطظعغفقکكيگگلمنوهةیى\s‌]+"
                    title="نام باید فقط با حروف فارسی وارد شود."
                    value={firstName}
                    onChange={(event) => onFirstNameChange(event.target.value)}
                    placeholder="نام"
                    required
                    className={authInputClassName}
                />
            </div>
            <div>
                <FieldLabel title="نام خانوادگی" required/>
                <input
                    name="family-name"
                    autoComplete="family-name"
                    pattern="[آاأإئؤءبپتثجچحخدذرزژسشصضطظعغفقکكيگگلمنوهةیى\s‌]+"
                    title="نام خانوادگی باید فقط با حروف فارسی وارد شود."
                    value={lastName}
                    onChange={(event) => onLastNameChange(event.target.value)}
                    placeholder="نام خانوادگی"
                    required
                    className={authInputClassName}
                />
            </div>
            <div>
                <FieldLabel title="کد ملی"/>
                <input
                    name="national-code"
                    value={nationalCode}
                    onChange={(event) => onNationalCodeChange(event.target.value)}
                    placeholder="کد ملی (10 رقم)"
                    className={authInputClassName}
                />
            </div>
            <div>
                <FieldLabel title="شماره موبایل"/>
                <input
                    name="tel"
                    autoComplete="tel"
                    value={phoneNumber}
                    onChange={(event) => onPhoneNumberChange(event.target.value)}
                    placeholder="شماره موبایل (مثل 0912... یا +98912...)"
                    className={authInputClassName}
                />
            </div>
            <div>
                <FieldLabel title="ایمیل"/>
                <input
                    name="email"
                    autoComplete="email"
                    autoCapitalize="none"
                    spellCheck={false}
                    type="email"
                    value={email}
                    onChange={(event) => onEmailChange(event.target.value)}
                    placeholder="ایمیل"
                    className={authInputClassName}
                />
            </div>
            <div>
                <FieldLabel title="موجودی اولیه کیف پول (ریال)"/>
                <div className="mb-2 grid grid-cols-3 gap-1.5">
                    {INITIAL_BALANCE_PRESETS.map((preset) => {
                        const isSelected = selectedBalancePreset === preset.value;
                        return (
                            <button
                                key={preset.value}
                                type="button"
                                onClick={() => {
                                    onInitialBalanceChange(String(preset.value));
                                    onSelectBalancePreset(preset.value);
                                    onClearError();
                                }}
                                className={`rounded-lg border px-2 py-1.5 text-[11px] font-semibold transition ${
                                    isSelected
                                        ? 'border-[#00E5C9]/40 bg-[#00E5C9]/10 text-[#00E5C9]'
                                        : 'border-white/12 bg-white/6 text-white hover:border-[#00E5C9]/30'
                                }`}
                            >
                                {preset.label}
                            </button>
                        );
                    })}
                </div>
                <input
                    name="initial-balance"
                    inputMode="numeric"
                    value={initialBalance}
                    onChange={(event) => {
                        const nextValue = event.target.value;
                        onInitialBalanceChange(nextValue);
                        const parsed = parseInitialBalanceInput(nextValue);
                        onSelectBalancePreset(
                            parsed !== null && INITIAL_BALANCE_PRESETS.some((item) => item.value === parsed)
                                ? parsed
                                : null,
                        );
                    }}
                    placeholder="مبلغ به ریال"
                    className={authInputClassName}
                />
            </div>
        </>
    );
}
