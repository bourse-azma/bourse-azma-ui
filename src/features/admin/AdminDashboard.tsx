import {useCallback, useEffect, useState} from 'react';
import {
    Activity,
    ArrowRight,
    Ban,
    BarChart3,
    Edit3,
    Headphones,
    LogOut,
    Moon,
    Search,
    ShieldCheck,
    Sun,
    Trash2,
    UserPlus,
    UserRound,
    Users
} from 'lucide-react';
import type {Theme} from '../../hooks/useTheme';
import AdminSupportPanel from '../support/AdminSupportPanel';
import {
    createAdminUser,
    deleteAdminUser,
    getAdminStats,
    getAdminUserDetail,
    getAdminUsers,
    setAdminUserBlocked,
    updateAdminUser,
    updateAdminUserBalance
} from './api';
import type {AdminStats, AdminUser, AdminUserDetail, AdminUserFormValues} from './types';
import {adminConfig} from './config';
import {useAdminAutoRefresh} from './useAdminAutoRefresh';
import {AdminUserFormModal} from './AdminUserFormModal';
import {type AdminUserAction, AdminUserActionModal} from './AdminUserActionModal';

type Section = 'users' | 'tickets';
type DetailTab = 'orders' | 'portfolio' | 'wallet' | 'activities';
const number = new Intl.NumberFormat('fa-IR');
const money = (value: number) => `${number.format(value ?? 0)} ریال`;
const dateTime = (value?: string | null) => value ? new Intl.DateTimeFormat('fa-IR', {
    dateStyle: 'medium',
    timeStyle: 'short'
}).format(new Date(value)) : 'ثبت نشده';

export default function AdminDashboard({
                                           accessToken,
                                           theme,
                                           onToggleTheme,
                                           profileDisplayName,
                                           onOpenProfile,
                                           onLogout
                                       }: {
    accessToken: string; theme: Theme; onToggleTheme: () => void; profileDisplayName: string;
    onOpenProfile: () => void; onLogout: () => void;
}) {
    const [section, setSection] = useState<Section>('users');
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [search, setSearch] = useState('');
    const [onlineOnly, setOnlineOnly] = useState(false);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalUsers, setTotalUsers] = useState(0);
    const [selected, setSelected] = useState<AdminUserDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [detailLoading, setDetailLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formOpen, setFormOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
    const [actionBusyId, setActionBusyId] = useState<number | null>(null);
    const [pendingAction, setPendingAction] = useState<AdminUserAction | null>(null);

    const loadStats = useCallback(async (silent = false) => {
        try {
            setStats(await getAdminStats(accessToken));
        } catch (e) {
            if (!silent) setError(e instanceof Error ? e.message : 'خطا در دریافت آمار');
        }
    }, [accessToken]);

    const loadUsers = useCallback(async (silent = false) => {
        if (!silent) {
            setLoading(true);
            setError(null);
        }
        try {
            const result = await getAdminUsers(accessToken, search, onlineOnly, page);
            setUsers(result.items);
            setTotalPages(result.totalPages);
            setTotalUsers(result.totalElements);
        } catch (e) {
            if (!silent) setError(e instanceof Error ? e.message : 'خطا در دریافت کاربران');
        } finally {
            if (!silent) setLoading(false);
        }
    }, [accessToken, onlineOnly, page, search]);

    useEffect(() => {
        void Promise.all([loadStats(), loadUsers()]);
    }, [loadStats, loadUsers]);
    useEffect(() => {
        setPage(0);
    }, [search, onlineOnly]);

    const loadUserDetail = useCallback(async (id: number, silent = false) => {
        if (!silent) {
            setDetailLoading(true);
            setError(null);
        }
        try {
            const result = await getAdminUserDetail(accessToken, id);
            setSelected(current => !silent || current?.user.id === id ? result : current);
        } catch (e) {
            if (!silent) setError(e instanceof Error ? e.message : 'خطا در دریافت جزئیات کاربر');
        } finally {
            if (!silent) setDetailLoading(false);
        }
    }, [accessToken]);

    const selectedUserId = selected?.user.id ?? null;
    const refreshStats = useCallback(() => loadStats(true), [loadStats]);
    const refreshUsers = useCallback(() => loadUsers(true), [loadUsers]);
    const refreshSelectedUser = useCallback(async () => {
        if (selectedUserId !== null) await loadUserDetail(selectedUserId, true);
    }, [loadUserDetail, selectedUserId]);

    useAdminAutoRefresh(refreshStats, section === 'users', adminConfig.statsRefreshMs);
    useAdminAutoRefresh(
        refreshUsers,
        section === 'users' && selectedUserId === null,
        adminConfig.usersRefreshMs,
    );
    useAdminAutoRefresh(
        refreshSelectedUser,
        section === 'users' && selectedUserId !== null,
        adminConfig.userDetailRefreshMs,
    );

    const openUser = (id: number) => void loadUserDetail(id);
    const openCreateForm = () => {
        setEditingUser(null);
        setFormOpen(true);
    };
    const openEditForm = (user: AdminUser) => {
        setEditingUser(user);
        setFormOpen(true);
    };

    const refreshAdminData = useCallback(async (selectedId?: number) => {
        await Promise.all([loadStats(true), loadUsers(true)]);
        if (selectedId !== undefined) await loadUserDetail(selectedId, true);
    }, [loadStats, loadUserDetail, loadUsers]);

    const submitUserForm = async (values: AdminUserFormValues) => {
        if (editingUser) {
            await updateAdminUser(accessToken, editingUser.id, values);
            if (values.balance !== editingUser.balance) {
                await updateAdminUserBalance(accessToken, editingUser.id, values.balance, 'اصلاح موجودی از فرم ویرایش کاربر');
            }
        } else await createAdminUser(accessToken, values);
        const selectedId = selected?.user.id;
        setFormOpen(false);
        setEditingUser(null);
        await refreshAdminData(selectedId);
    };

    const toggleBlocked = (user: AdminUser) => setPendingAction({type: user.blocked ? 'unblock' : 'block', user});
    const removeUser = (user: AdminUser) => setPendingAction({type: 'delete', user});

    const confirmUserAction = async (reason?: string) => {
        if (!pendingAction) return;
        const {type, user} = pendingAction;
        setActionBusyId(user.id);
        setError(null);
        try {
            if (type === 'delete') {
                await deleteAdminUser(accessToken, user.id);
                setSelected(null);
                await refreshAdminData();
            } else {
                await setAdminUserBlocked(accessToken, user.id, type === 'block', reason);
                await refreshAdminData(selected?.user.id);
            }
            setPendingAction(null);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'انجام عملیات ناموفق بود.');
            setPendingAction(null);
        } finally {
            setActionBusyId(null);
        }
    };

    const nav = [
        {id: 'users' as const, label: 'مدیریت کاربران', icon: Users},
        {id: 'tickets' as const, label: 'تیکت‌های پشتیبانی', icon: Headphones},
    ];

    return (
        <div dir="rtl" className="min-h-screen bg-bg text-right text-text">
            <header className="sticky top-0 z-40 border-b border-border/70 bg-surface/90 backdrop-blur-xl">
                <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-3 px-4 py-3">
                    <div className="flex items-center gap-3">
                        <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-white"><BarChart3
                            className="h-5 w-5"/></div>
                        <div><h1 className="text-sm font-black sm:text-base">پنل مدیریت بورس‌آزما</h1><p
                            className="text-[11px] text-muted">کنترل کاربران و فعالیت سامانه</p></div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={onToggleTheme}
                                className="grid h-9 w-9 place-items-center rounded-xl border border-border bg-surface-2"
                                aria-label="تغییر پوسته">{theme === 'dark' ? <Sun className="h-4 w-4"/> :
                            <Moon className="h-4 w-4"/>}</button>
                        <button onClick={onOpenProfile}
                                className="hidden items-center gap-2 rounded-xl border border-border bg-surface-2 px-3 py-2 text-xs sm:flex">
                            <UserRound className="h-4 w-4"/>{profileDisplayName}</button>
                        <button onClick={onLogout}
                                className="grid h-9 w-9 place-items-center rounded-xl border border-negative/30 bg-negative/10 text-negative"
                                aria-label="خروج"><LogOut className="h-4 w-4"/></button>
                    </div>
                </div>
            </header>

            <div
                className="mx-auto grid max-w-[1600px] grid-cols-1 gap-4 px-3 py-4 lg:grid-cols-[230px_minmax(0,1fr)] lg:px-4">
                <aside className="h-fit rounded-2xl border border-border/70 bg-surface p-2 lg:sticky lg:top-20">
                    <nav className="flex gap-2 overflow-x-auto lg:flex-col">
                        {nav.map(({id, label, icon: Icon}) => <button key={id} onClick={() => {
                            setSection(id);
                            setSelected(null);
                        }}
                                                                      className={`flex shrink-0 items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-bold transition ${section === id ? 'bg-primary text-white' : 'text-muted hover:bg-surface-2 hover:text-text'}`}>
                            <Icon className="h-4 w-4"/>{label}</button>)}
                    </nav>
                </aside>

                <main className="min-w-0">
                    {error ? <div
                        className="mb-4 rounded-xl border border-negative/30 bg-negative/10 p-3 text-sm text-negative">{error}</div> : null}
                    {section === 'tickets' ? <AdminSupportPanel accessToken={accessToken} enabled/> : selected ? (
                        <UserDetail detail={selected} onBack={() => setSelected(null)} onEdit={openEditForm}
                                    onToggleBlocked={toggleBlocked} onDelete={removeUser}
                                    busy={actionBusyId === selected.user.id}/>
                    ) : (
                        <>
                            <StatsGrid stats={stats}/>
                            <UsersPanel users={users} loading={loading || detailLoading} search={search}
                                        setSearch={setSearch} onlineOnly={onlineOnly} setOnlineOnly={setOnlineOnly}
                                        totalUsers={totalUsers} page={page} totalPages={totalPages} setPage={setPage}
                                        onOpenUser={openUser} onCreate={openCreateForm} onEdit={openEditForm}
                                        onToggleBlocked={toggleBlocked} onDelete={removeUser}
                                        actionBusyId={actionBusyId}/>
                        </>
                    )}
                </main>
            </div>
            <AdminUserFormModal open={formOpen} user={editingUser} onClose={() => {
                setFormOpen(false);
                setEditingUser(null);
            }} onSubmit={submitUserForm}/>
            <AdminUserActionModal action={pendingAction} busy={actionBusyId !== null} onCancel={() => {
                if (actionBusyId === null) setPendingAction(null);
            }} onConfirm={confirmUserAction}/>
        </div>
    );
}

function StatsGrid({stats}: { stats: AdminStats | null }) {
    const cards = [
        ['کل کاربران', stats?.totalUsers, Users, 'text-primary bg-primary/10'],
        ['کاربران آنلاین', stats?.onlineUsers, Activity, 'text-positive bg-positive/10'],
        ['عضویت‌های امروز', stats?.newUsersToday, UserRound, 'text-warning bg-warning/10'],
        ['کل سفارش‌ها', stats?.totalOrders, BarChart3, 'text-primary bg-primary/10'],
        ['تیکت‌های باز', stats?.openTickets, Headphones, 'text-negative bg-negative/10'],
    ] as const;
    return <section className="mb-3 grid grid-cols-2 gap-3 xl:grid-cols-6">{cards.map(([label, value, Icon, color]) =>
        <div key={label} className="rounded-2xl border border-border/70 bg-surface p-4 text-right">
            <div className={`mb-3 grid h-9 w-9 place-items-center rounded-xl ${color}`}><Icon className="h-4 w-4"/>
            </div>
            <p className="text-[11px] text-muted">{label}</p><strong
            className="mt-1 block text-xl font-black">{value == null ? '—' : number.format(value)}</strong>
        </div>)}</section>;
}

function UsersPanel({
                        users,
                        loading,
                        search,
                        setSearch,
                        onlineOnly,
                        setOnlineOnly,
                        totalUsers,
                        page,
                        totalPages,
                        setPage,
                        onOpenUser,
                        onCreate,
                        onEdit,
                        onToggleBlocked,
                        onDelete,
                        actionBusyId
                    }: {
    users: AdminUser[];
    loading: boolean;
    search: string;
    setSearch: (v: string) => void;
    onlineOnly: boolean;
    setOnlineOnly: (v: boolean) => void;
    totalUsers: number;
    page: number;
    totalPages: number;
    setPage: (v: number) => void;
    onOpenUser: (id: number) => void;
    onCreate: () => void;
    onEdit: (user: AdminUser) => void;
    onToggleBlocked: (user: AdminUser) => void;
    onDelete: (user: AdminUser) => void;
    actionBusyId: number | null
}) {
    return <section className="rounded-2xl border border-border/70 bg-surface p-4">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div><h2 className="font-black">کاربران <span
                className="text-sm text-muted">({number.format(totalUsers)})</span></h2><p
                className="text-xs text-muted">ثبت، ویرایش و مدیریت دسترسی کاربران</p></div>
            <button onClick={onCreate}
                    className="flex items-center justify-center gap-2 rounded-xl bg-primary px-3 py-2 text-xs font-bold text-white">
                <UserPlus className="h-3.5 w-3.5"/>ثبت کاربر
            </button>
        </div>
        <div className="mb-4 flex flex-col gap-2 sm:flex-row"><label className="relative flex-1"><Search
            className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"/><input value={search}
                                                                                             onChange={e => setSearch(e.target.value)}
                                                                                             placeholder="نام، نام کاربری، موبایل یا ایمیل..."
                                                                                             className="w-full rounded-xl border border-border bg-surface-2 py-2.5 pr-10 pl-3 text-xs outline-none focus:border-primary"/></label><label
            className="flex cursor-pointer items-center gap-2 rounded-xl border border-border px-3 py-2 text-xs"><input
            type="checkbox" checked={onlineOnly} onChange={e => setOnlineOnly(e.target.checked)}
            className="accent-primary"/>فقط آنلاین‌ها</label></div>
        <UserTable users={users} loading={loading} onOpenUser={onOpenUser} onEdit={onEdit}
                   onToggleBlocked={onToggleBlocked} onDelete={onDelete} actionBusyId={actionBusyId}/>
        {totalPages > 1 ? <div className="mt-4 flex items-center justify-center gap-3">
            <button disabled={page === 0} onClick={() => setPage(page - 1)}
                    className="rounded-lg border border-border px-3 py-1.5 text-xs disabled:opacity-40">قبلی
            </button>
            <span className="text-xs text-muted">صفحه {number.format(page + 1)} از {number.format(totalPages)}</span>
            <button disabled={page + 1 >= totalPages} onClick={() => setPage(page + 1)}
                    className="rounded-lg border border-border px-3 py-1.5 text-xs disabled:opacity-40">بعدی
            </button>
        </div> : null}
    </section>;
}

function UserTable({users, loading, onOpenUser, onEdit, onToggleBlocked, onDelete, actionBusyId}: {
    users: AdminUser[];
    loading: boolean;
    onOpenUser: (id: number) => void;
    onEdit: (user: AdminUser) => void;
    onToggleBlocked: (user: AdminUser) => void;
    onDelete: (user: AdminUser) => void;
    actionBusyId: number | null
}) {
    if (loading) return <div className="py-16 text-center text-sm text-muted">در حال بارگذاری...</div>;
    if (!users.length) return <div className="py-16 text-center text-sm text-muted">کاربری پیدا نشد.</div>;
    return <div className="overflow-x-auto">
        <table dir="rtl" className="w-full min-w-[940px] text-right text-xs">
            <thead className="border-b border-border text-muted">
            <tr>
                <th className="p-3 text-right">کاربر</th>
                <th className="p-3 text-right">وضعیت</th>
                <th className="p-3 text-right">آخرین ورود</th>
                <th className="p-3 text-right">موجودی</th>
                <th className="p-3 text-right">سفارش / معامله</th>
                <th className="p-3 text-right">عملیات</th>
            </tr>
            </thead>
            <tbody>{users.map(user => {
                const busy = actionBusyId === user.id;
                const statusClass = user.blocked ? 'bg-negative/10 text-negative' : user.online ? 'bg-positive/10 text-positive' : 'bg-surface-2 text-muted';
                return <tr key={user.id} className="border-b border-border/50 hover:bg-surface-2/60">
                    <td className="p-3 text-right"><strong
                        className="block text-text">{user.firstName} {user.lastName}</strong><span
                        className="block text-right text-muted" dir="ltr">@{user.username}</span></td>
                    <td className="p-3 text-right"><span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-1 ${statusClass}`}><i
                        className={`h-1.5 w-1.5 rounded-full ${user.blocked ? 'bg-negative' : user.online ? 'bg-positive' : 'bg-muted'}`}/>{user.blocked ? 'مسدود' : user.online ? 'آنلاین' : 'آفلاین'}</span>
                    </td>
                    <td dir="rtl" className="p-3 text-right text-muted">{dateTime(user.lastLoginAt)}</td>
                    <td className="p-3 text-right font-bold">{money(user.balance)}</td>
                    <td className="p-3 text-right"><span>{number.format(user.orderCount)}</span><span
                        className="mx-2 text-border">/</span><span>{number.format(user.tradeCount)}</span></td>
                    <td className="p-3">
                        <div className="flex items-center gap-1">
                            <button disabled={busy} onClick={() => onOpenUser(user.id)} title="جزئیات"
                                    className="rounded-lg bg-primary/10 px-2.5 py-1.5 font-bold text-primary">جزئیات
                            </button>
                            <button disabled={busy} onClick={() => onEdit(user)} title="ویرایش"
                                    className="grid h-8 w-8 place-items-center rounded-lg bg-surface-2 text-text"><Edit3
                                className="h-3.5 w-3.5"/></button>
                            <button disabled={busy} onClick={() => onToggleBlocked(user)}
                                    title={user.blocked ? 'رفع مسدودی' : 'مسدود کردن'}
                                    className={`grid h-8 w-8 place-items-center rounded-lg ${user.blocked ? 'bg-positive/10 text-positive' : 'bg-warning/10 text-warning'}`}>{user.blocked ?
                                <ShieldCheck className="h-3.5 w-3.5"/> : <Ban className="h-3.5 w-3.5"/>}</button>
                            <button disabled={busy} onClick={() => onDelete(user)} title="حذف"
                                    className="grid h-8 w-8 place-items-center rounded-lg bg-negative/10 text-negative">
                                <Trash2 className="h-3.5 w-3.5"/></button>
                        </div>
                    </td>
                </tr>;
            })}</tbody>
        </table>
    </div>;
}

function UserDetail({detail, onBack, onEdit, onToggleBlocked, onDelete, busy}: {
    detail: AdminUserDetail;
    onBack: () => void;
    onEdit: (user: AdminUser) => void;
    onToggleBlocked: (user: AdminUser) => void;
    onDelete: (user: AdminUser) => void;
    busy: boolean
}) {
    const [tab, setTab] = useState<DetailTab>('orders');
    const u = detail.user;
    const tabs: { id: DetailTab; label: string; count: number }[] = [{
        id: 'orders',
        label: 'سفارش‌ها',
        count: detail.orders.length
    }, {
        id: 'portfolio',
        label: 'پرتفوی',
        count: detail.portfolio.length
    }, {id: 'wallet', label: 'کیف پول', count: detail.walletTransactions.length}, {
        id: 'activities',
        label: 'لاگ فعالیت',
        count: detail.activities.length
    }];
    const infoItems: Array<[string, string | null | undefined, 'rtl' | 'ltr']> = [
        ['موبایل', u.phoneNumber, 'ltr'], ['ایمیل', u.email, 'ltr'],
        ['IP آخرین ورود', u.lastLoginIp, 'ltr'], ['تاریخ عضویت', dateTime(u.createdAt), 'rtl'],
        ['آخرین ورود', dateTime(u.lastLoginAt), 'rtl'], ['آخرین فعالیت', dateTime(u.lastSeenAt), 'rtl'],
        ['تیکت‌ها', number.format(u.ticketCount), 'rtl'],
    ];
    return <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
            <button onClick={onBack} className="flex items-center gap-2 text-xs font-bold text-primary"><ArrowRight
                className="h-4 w-4"/>بازگشت به کاربران
            </button>
            <div className="flex gap-2">
                <button disabled={busy} onClick={() => onEdit(u)}
                        className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs"><Edit3
                    className="h-3.5 w-3.5"/>ویرایش
                </button>
                <button disabled={busy} onClick={() => onToggleBlocked(u)}
                        className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs ${u.blocked ? 'bg-positive/10 text-positive' : 'bg-warning/10 text-warning'}`}>{u.blocked ?
                    <ShieldCheck className="h-3.5 w-3.5"/> :
                    <Ban className="h-3.5 w-3.5"/>}{u.blocked ? 'رفع مسدودی' : 'مسدود کردن'}</button>
                <button disabled={busy} onClick={() => onDelete(u)}
                        className="flex items-center gap-1.5 rounded-lg bg-negative/10 px-3 py-2 text-xs text-negative">
                    <Trash2 className="h-3.5 w-3.5"/>حذف
                </button>
            </div>
        </div>
        <section className="rounded-2xl border border-border/70 bg-surface p-5">
            <div className="flex flex-col gap-5 xl:flex-row xl:justify-between">
                <div>
                    <div className="flex items-center gap-2"><h2
                        className="text-lg font-black">{u.firstName} {u.lastName}</h2><span
                        className={`rounded-full px-2 py-1 text-[10px] ${u.blocked ? 'bg-negative/10 text-negative' : u.online ? 'bg-positive/10 text-positive' : 'bg-surface-2 text-muted'}`}>{u.blocked ? 'مسدود' : u.online ? 'آنلاین' : 'آفلاین'}</span>
                    </div>
                    <p className="mt-1 text-right text-xs text-muted" dir="ltr">@{u.username} ·
                        ID: {u.id}</p>{u.blockedReason ?
                    <p className="mt-2 text-xs text-negative">دلیل مسدودی: {u.blockedReason}</p> : null}</div>
                <div className="text-right"><p className="text-xs text-muted">موجودی فعلی</p><strong
                    className="text-xl">{money(u.balance)}</strong></div>
            </div>
            <div
                className="mt-5 grid grid-cols-1 gap-3 text-xs sm:grid-cols-2 xl:grid-cols-4">{infoItems.map(([key, value, direction]) =>
                <div key={key} className="rounded-xl bg-surface-2 p-3 text-right"><span
                    className="block text-right text-muted">{key}</span><strong
                    className="mt-1 block break-all text-right" dir={direction}>{value || 'ثبت نشده'}</strong>
                </div>)}</div>
        </section>
        <section className="rounded-2xl border border-border/70 bg-surface p-4">
            <div className="mb-4 flex gap-2 overflow-x-auto border-b border-border pb-3">{tabs.map(t => <button
                key={t.id} onClick={() => setTab(t.id)}
                className={`shrink-0 rounded-lg px-3 py-2 text-xs font-bold ${tab === t.id ? 'bg-primary text-white' : 'bg-surface-2 text-muted'}`}>{t.label} ({number.format(t.count)})</button>)}</div>
            <DetailTable detail={detail} tab={tab}/><p className="mt-3 text-[10px] text-muted">حداکثر ۵۰ رکورد آخر نمایش
            داده می‌شود.</p>
        </section>
    </div>;
}

function DetailTable({detail, tab}: { detail: AdminUserDetail; tab: DetailTab }) {
    let headers: string[] = [];
    let rows: (string | number)[][] = [];
    if (tab === 'orders') {
        headers = ['نماد', 'نوع', 'تعداد', 'قیمت', 'وضعیت', 'زمان'];
        rows = detail.orders.map(x => [x.symbol, x.sideLabel, number.format(x.quantity), money(x.orderPrice), x.statusLabel, dateTime(x.orderTime)]);
    }
    if (tab === 'portfolio') {
        headers = ['نماد', 'تعداد', 'قیمت خرید', 'قیمت روز', 'ارزش روز', 'زمان خرید'];
        rows = detail.portfolio.map(x => [x.symbol, number.format(x.quantity), money(x.buyPrice), money(x.livePrice), money(x.netValue), dateTime(x.acquiredAt)]);
    }
    if (tab === 'wallet') {
        headers = ['شرح', 'مبلغ', 'مانده', 'انجام‌دهنده / یادداشت', 'زمان'];
        rows = detail.walletTransactions.map(x => [x.description, money(x.amount), money(x.balanceAfter),
            x.source === 'ADMIN' ? `ادمین: ${x.performedByAdminName || 'مدیر'}${x.adminNote ? ` — ${x.adminNote}` : ''}` : 'سیستم / کاربر',
            dateTime(x.createdAt)]);
    }
    if (tab === 'activities') {
        headers = ['نوع فعالیت', 'IP', 'زمان'];
        rows = detail.activities.map(x => [x.activityType === 'LOGIN' ? 'ورود' : 'خروج', x.ipAddress || 'ثبت نشده', dateTime(x.occurredAt)]);
    }
    if (!rows.length) return <div className="py-12 text-center text-sm text-muted">رکوردی وجود ندارد.</div>;
    return <div className="overflow-x-auto">
        <table dir="rtl" className="w-full min-w-[700px] text-right text-xs">
            <thead>
            <tr className="border-b border-border text-muted">{headers.map(h => <th key={h}
                                                                                    className="p-3 text-right">{h}</th>)}</tr>
            </thead>
            <tbody>{rows.map((row, i) => <tr key={i} className="border-b border-border/50">{row.map((cell, j) => <td
                dir={tab === 'activities' && j === 1 ? 'ltr' : 'rtl'} key={j}
                className="p-3 text-right">{cell}</td>)}</tr>)}</tbody>
        </table>
    </div>;
}
