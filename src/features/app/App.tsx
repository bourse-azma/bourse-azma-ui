import {lazy, Suspense} from 'react';
import {useTheme} from '../../hooks/useTheme';
import {ProfileModal} from './components/ProfileModal';
import {useAppAuth} from './hooks/useAppAuth';
import {useProfileEditor} from './hooks/useProfileEditor';

const AuthPage = lazy(() => import('../auth/AuthPage'));
const LandingPage = lazy(() => import('../landing/LandingPage'));
const TradingDashboard = lazy(() => import('../../TradingDashboard'));

function RouteFallback() {
    return (
        <div className="flex min-h-screen items-center justify-center">
            <p className="text-sm text-muted">در حال بارگذاری...</p>
        </div>
    );
}

export default function App() {
    const {theme, toggleTheme} = useTheme();
    const auth = useAppAuth();
    const profileEditor = useProfileEditor(auth.session, auth.profile, auth.setProfile);

    return (
        <div dir="rtl" className="min-h-screen bg-bg text-text font-sans transition-colors duration-300">
            {auth.authState === 'checking' ? (
                <div className="flex min-h-screen items-center justify-center">
                    <p className="text-sm text-muted">در حال بررسی ورود...</p>
                </div>
            ) : auth.authState === 'authenticated' && auth.session && auth.loginEpoch ? (
                <Suspense fallback={<RouteFallback/>}>
                    <TradingDashboard
                        key={auth.loginEpoch}
                        loginEpoch={auth.loginEpoch}
                        theme={theme}
                        accessToken={auth.session.accessToken}
                        onToggleTheme={toggleTheme}
                        profileDisplayName={auth.displayName}
                        onOpenProfile={profileEditor.openProfileModal}
                        onLogout={auth.handleLogout}
                        userProfile={auth.profile || undefined}
                        onProfileUpdated={auth.setProfile}
                    />
                </Suspense>
            ) : auth.publicView === 'auth' ? (
                <Suspense fallback={<RouteFallback/>}>
                    <AuthPage
                        onAuthenticated={auth.handleAuthenticated}
                        initialMode={auth.authInitialMode}
                        onBackToLanding={auth.openLanding}
                    />
                </Suspense>
            ) : (
                <Suspense fallback={<RouteFallback/>}>
                    <LandingPage
                        onLogin={() => auth.openAuth('login')}
                        onRegister={() => auth.openAuth('register')}
                    />
                </Suspense>
            )}

            <ProfileModal
                open={profileEditor.profileModalOpen}
                profile={auth.profile}
                profileLoading={auth.profileLoading}
                profileError={auth.profileError}
                profileEditMode={profileEditor.profileEditMode}
                saveLoading={profileEditor.saveLoading}
                saveError={profileEditor.saveError}
                saveSuccess={profileEditor.saveSuccess}
                editUsername={profileEditor.editUsername}
                editFirstName={profileEditor.editFirstName}
                editLastName={profileEditor.editLastName}
                editNationalCode={profileEditor.editNationalCode}
                editPhoneNumber={profileEditor.editPhoneNumber}
                editEmail={profileEditor.editEmail}
                editPassword={profileEditor.editPassword}
                editCurrentPassword={profileEditor.editCurrentPassword}
                usernameValidationMessage={profileEditor.usernameValidationMessage}
                passwordValidationMessage={profileEditor.passwordValidationMessage}
                onClose={profileEditor.closeProfileModal}
                onStartEdit={profileEditor.startEdit}
                onCancelEdit={profileEditor.cancelEdit}
                onSubmit={profileEditor.submitProfileUpdate}
                onEditUsernameChange={profileEditor.setEditUsername}
                onEditFirstNameChange={profileEditor.setEditFirstName}
                onEditLastNameChange={profileEditor.setEditLastName}
                onEditNationalCodeChange={profileEditor.setEditNationalCode}
                onEditPhoneNumberChange={profileEditor.setEditPhoneNumber}
                onEditEmailChange={profileEditor.setEditEmail}
                onEditPasswordChange={profileEditor.setEditPassword}
                onEditCurrentPasswordChange={profileEditor.setEditCurrentPassword}
            />
        </div>
    );
}
