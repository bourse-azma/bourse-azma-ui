import {lazy, Suspense, useEffect} from 'react';
import {useTheme} from '../../hooks/useTheme';
import {ProfileModal} from './components/ProfileModal';
import {useAppAuth} from './hooks/useAppAuth';
import {useProfileEditor} from './hooks/useProfileEditor';
import {useAppNavigation} from '../navigation/useAppNavigation';

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
    const {pathname, navigate} = useAppNavigation();
    const profileEditor = useProfileEditor(auth.session, auth.profile, auth.setProfile);

    useEffect(() => {
        if (auth.authState === 'checking') return;
        if (pathname === null) {
            navigate('/', {replace: true});
        } else if (auth.authState === 'unauthenticated' && pathname === '/dashboard') {
            navigate('/login', {replace: true});
        } else if (auth.authState === 'authenticated' && (pathname === '/login' || pathname === '/register')) {
            navigate('/dashboard', {replace: true});
        }
    }, [auth.authState, navigate, pathname]);

    const handleAuthenticated = (session: Parameters<typeof auth.handleAuthenticated>[0]) => {
        auth.handleAuthenticated(session);
        navigate('/dashboard', {replace: true});
    };

    const handleLogout = () => {
        auth.handleLogout();
        navigate('/', {replace: true});
    };

    const isDashboard = pathname === '/dashboard';
    const isAuthPage = pathname === '/login' || pathname === '/register';

    return (
        <div dir="rtl" className="min-h-screen bg-bg text-text font-sans transition-colors duration-300">
            {auth.authState === 'checking' ? (
                <div className="flex min-h-screen items-center justify-center">
                    <p className="text-sm text-muted">در حال بررسی ورود...</p>
                </div>
            ) : pathname === null || (auth.authState === 'unauthenticated' && isDashboard) ||
            (auth.authState === 'authenticated' && isAuthPage) ? (
                <RouteFallback/>
            ) : auth.authState === 'authenticated' && auth.session && auth.loginEpoch && isDashboard ? (
                <Suspense fallback={<RouteFallback/>}>
                    <TradingDashboard
                        key={auth.loginEpoch}
                        loginEpoch={auth.loginEpoch}
                        theme={theme}
                        accessToken={auth.session.accessToken}
                        onToggleTheme={toggleTheme}
                        profileDisplayName={auth.displayName}
                        onOpenProfile={profileEditor.openProfileModal}
                        onLogout={handleLogout}
                        userProfile={auth.profile || undefined}
                        onProfileUpdated={auth.setProfile}
                    />
                </Suspense>
            ) : isAuthPage ? (
                <Suspense fallback={<RouteFallback/>}>
                    <AuthPage
                        onAuthenticated={handleAuthenticated}
                        initialMode={pathname === '/register' ? 'register' : 'login'}
                        onModeChange={(mode) => navigate(mode === 'login' ? '/login' : '/register')}
                        onBackToLanding={() => navigate('/')}
                    />
                </Suspense>
            ) : (
                <Suspense fallback={<RouteFallback/>}>
                    <LandingPage
                        isAuthenticated={auth.authState === 'authenticated'}
                        onDashboard={() => navigate('/dashboard')}
                        onLogin={() => navigate('/login')}
                        onRegister={() => navigate('/register')}
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
