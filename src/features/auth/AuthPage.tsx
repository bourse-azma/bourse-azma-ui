import {ArrowRight} from 'lucide-react';
import BourseAzmaLogo from '../../components/BourseAzmaLogo';
import {LoginIdentifierField} from './components/LoginIdentifierField';
import {PasswordFields} from './components/PasswordFields';
import {RegisterFormFields} from './components/RegisterFormFields';
import {useAuthForm} from './hooks/useAuthForm';
import type {AuthPageProps} from './types';

export type {AuthMode, AuthSession} from './types';

export default function AuthPage({
                                     onAuthenticated,
                                     initialMode = 'login',
                                     onBackToLanding,
                                     onModeChange
                                 }: AuthPageProps) {
    const form = useAuthForm({onAuthenticated, initialMode, onBackToLanding, onModeChange});

    return (
        <div className="landing-shell auth-shell min-h-screen bg-[#0A1428] text-white" dir="rtl">
            <div className="landing-data-grid pointer-events-none fixed inset-0 opacity-20" aria-hidden="true"/>
            <main className="relative z-10 flex min-h-screen items-center justify-center p-4 sm:p-6">
                <div className="w-full max-w-md">
                    {onBackToLanding ? (
                        <button
                            type="button"
                            onClick={onBackToLanding}
                            className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/8 px-4 py-2 text-xs font-black text-white/78 shadow-[0_16px_45px_-30px_rgba(0,229,201,0.8)] backdrop-blur transition hover:border-[#00E5C9]/40 hover:bg-[#00E5C9]/10 hover:text-white"
                        >
                            <ArrowRight className="h-4 w-4"/>
                            بازگشت به صفحه اصلی
                        </button>
                    ) : null}

                    <section className="auth-card w-full p-6 sm:p-8">
                        <div className="flex flex-col items-center text-center">
                            <BourseAzmaLogo compact/>
                            <p className="mt-3 text-sm font-medium text-[#AFC1D8]">{form.description}</p>
                        </div>

                        <div className="mt-6 grid grid-cols-2 rounded-xl bg-white/6 p-1 text-sm">
                            <button
                                type="button"
                                onClick={() => form.handleModeChange('login')}
                                className={`rounded-lg px-3 py-2 font-black transition ${
                                    form.mode === 'login' ? 'bg-[#00E5C9] text-[#061221] shadow-sm' : 'text-white/65'
                                }`}
                            >
                                ورود
                            </button>
                            <button
                                type="button"
                                onClick={() => form.handleModeChange('register')}
                                className={`rounded-lg px-3 py-2 font-black transition ${
                                    form.mode === 'register' ? 'bg-[#00E5C9] text-[#061221] shadow-sm' : 'text-white/65'
                                }`}
                            >
                                ثبت نام
                            </button>
                        </div>

                        <form className="mt-5 space-y-3" onSubmit={form.handleSubmit} autoComplete="on">
                            {form.mode === 'register' ? (
                                <RegisterFormFields
                                    username={form.username}
                                    onUsernameChange={form.setUsername}
                                    firstName={form.firstName}
                                    onFirstNameChange={form.setFirstName}
                                    lastName={form.lastName}
                                    onLastNameChange={form.setLastName}
                                    phoneNumber={form.phoneNumber}
                                    onPhoneNumberChange={form.setPhoneNumber}
                                    email={form.email}
                                    onEmailChange={form.setEmail}
                                    initialBalance={form.initialBalance}
                                    onInitialBalanceChange={form.setInitialBalance}
                                    selectedBalancePreset={form.selectedBalancePreset}
                                    onSelectBalancePreset={form.setSelectedBalancePreset}
                                    onClearError={form.clearError}
                                />
                            ) : (
                                <LoginIdentifierField
                                    identifier={form.identifier}
                                    onIdentifierChange={form.setIdentifier}
                                />
                            )}

                            <PasswordFields
                                mode={form.mode}
                                password={form.password}
                                onPasswordChange={form.handlePasswordChange}
                                passwordConfirmation={form.passwordConfirmation}
                                onPasswordConfirmationChange={form.setPasswordConfirmation}
                                generatedPassword={form.generatedPassword}
                                generatedPasswordConfirmed={form.generatedPasswordConfirmed}
                                onGeneratedPasswordConfirmedChange={form.setGeneratedPasswordConfirmed}
                                onApplyGeneratedPassword={form.applyGeneratedPassword}
                                onCopyGeneratedPassword={form.copyGeneratedPassword}
                                rememberMe={form.rememberMe}
                                onRememberMeChange={form.setRememberMe}
                            />

                            {form.error ? (
                                <p className="rounded-xl border border-[#FF6B7A]/40 bg-[#FF6B7A]/10 px-3 py-2 text-sm text-[#FFB4BC]">
                                    {form.error}
                                </p>
                            ) : null}

                            <button
                                type="submit"
                                disabled={form.isSubmitting}
                                className="landing-glow-button w-full rounded-xl bg-[#00E5C9] px-4 py-2.5 text-sm font-black text-[#061221] transition hover:bg-[#2DFFE8] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {form.isSubmitting ? 'در حال پردازش...' : form.submitLabel}
                            </button>
                        </form>
                    </section>
                </div>
            </main>
        </div>
    );
}
