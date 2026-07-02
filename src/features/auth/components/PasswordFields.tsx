import {Check, Copy, KeyRound, RefreshCw} from 'lucide-react';
import type {AuthMode} from '../types';
import {authButtonSecondaryClassName, authInputClassName} from '../constants';
import {FieldLabel} from './FieldLabel';

type PasswordFieldsProps = {
    mode: AuthMode;
    password: string;
    onPasswordChange: (value: string) => void;
    passwordConfirmation: string;
    onPasswordConfirmationChange: (value: string) => void;
    generatedPassword: string | null;
    generatedPasswordConfirmed: boolean;
    onGeneratedPasswordConfirmedChange: (value: boolean) => void;
    onApplyGeneratedPassword: () => void;
    onCopyGeneratedPassword: () => void;
    rememberMe: boolean;
    onRememberMeChange: (value: boolean) => void;
};

export function PasswordFields({
                                   mode,
                                   password,
                                   onPasswordChange,
                                   passwordConfirmation,
                                   onPasswordConfirmationChange,
                                   generatedPassword,
                                   generatedPasswordConfirmed,
                                   onGeneratedPasswordConfirmedChange,
                                   onApplyGeneratedPassword,
                                   onCopyGeneratedPassword,
                                   rememberMe,
                                   onRememberMeChange,
                               }: PasswordFieldsProps) {
    return (
        <>
            <div>
                <FieldLabel title="رمز عبور" required showRequirement={mode === 'register'}/>
                <div className="flex gap-2">
                    <input
                        name="password"
                        autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                        value={password}
                        onChange={(event) => onPasswordChange(event.target.value)}
                        type="password"
                        placeholder="رمز عبور"
                        required
                        minLength={8}
                        maxLength={24}
                        pattern={mode === 'register' ? '^(?=.*[A-Za-z])(?=.*\\d).+$' : undefined}
                        title={mode === 'register' ? 'رمز عبور باید بین ۸ تا ۲۴ کاراکتر و حداقل شامل یک حرف و یک عدد باشد.' : undefined}
                        className={`min-w-0 flex-1 ${authInputClassName}`}
                    />
                    {mode === 'register' ? (
                        <button
                            type="button"
                            onClick={onApplyGeneratedPassword}
                            className={authButtonSecondaryClassName}
                        >
                            <KeyRound className="h-4 w-4"/>
                            ساخت رمز
                        </button>
                    ) : null}
                </div>
            </div>

            {mode === 'register' ? (
                <>
                    <div>
                        <FieldLabel title="تأیید رمز عبور" required/>
                        <input
                            name="password-confirmation"
                            autoComplete="new-password"
                            value={passwordConfirmation}
                            onChange={(event) => onPasswordConfirmationChange(event.target.value)}
                            type="password"
                            placeholder="تکرار رمز عبور"
                            required
                            minLength={8}
                            maxLength={24}
                            className={authInputClassName}
                        />
                    </div>

                    {generatedPassword ? (
                        <div className="rounded-xl border border-[#00E5C9]/30 bg-[#00E5C9]/10 p-3">
                            <div className="flex items-center justify-between gap-2">
                                <code dir="ltr"
                                      className="min-w-0 flex-1 rounded-lg bg-[#071225] px-2 py-1.5 text-xs text-white">
                                    {generatedPassword}
                                </code>
                                <button
                                    type="button"
                                    onClick={() => void onCopyGeneratedPassword()}
                                    className={`h-9 w-9 shrink-0 items-center justify-center ${authButtonSecondaryClassName}`}
                                    aria-label="کپی رمز پیشنهادی"
                                >
                                    <Copy className="h-4 w-4"/>
                                </button>
                                <button
                                    type="button"
                                    onClick={onApplyGeneratedPassword}
                                    className={`h-9 w-9 shrink-0 items-center justify-center ${authButtonSecondaryClassName}`}
                                    aria-label="ساخت رمز جدید"
                                >
                                    <RefreshCw className="h-4 w-4"/>
                                </button>
                            </div>
                            <label
                                className="mt-3 flex cursor-pointer items-start gap-2 text-xs leading-6 text-white/82">
                                <input
                                    type="checkbox"
                                    checked={generatedPasswordConfirmed}
                                    onChange={(event) => onGeneratedPasswordConfirmedChange(event.target.checked)}
                                    className="mt-1"
                                />
                                <span>رمز پیشنهادی را ذخیره کرده‌ام و برای ورودهای بعدی به آن دسترسی دارم.</span>
                            </label>
                        </div>
                    ) : null}
                </>
            ) : null}

            {mode === 'login' ? (
                <label className="group flex cursor-pointer items-center justify-between px-1 py-1.5">
                    <div className="flex items-center gap-2">
                        <span className="relative inline-flex h-5 w-5 items-center justify-center">
                            <input
                                type="checkbox"
                                checked={rememberMe}
                                onChange={(event) => onRememberMeChange(event.target.checked)}
                                className="peer sr-only"
                            />
                            <span
                                className="h-5 w-5 rounded-md border border-white/16 bg-[#071225] transition peer-checked:border-[#00E5C9] peer-checked:bg-[#00E5C9]/20"/>
                            <Check
                                className="pointer-events-none absolute h-3.5 w-3.5 scale-75 text-[#00E5C9] opacity-0 transition peer-checked:scale-100 peer-checked:opacity-100"/>
                        </span>
                        <span className="text-xs font-semibold text-white/82">مرا به خاطر بسپار</span>
                    </div>
                </label>
            ) : null}
        </>
    );
}
