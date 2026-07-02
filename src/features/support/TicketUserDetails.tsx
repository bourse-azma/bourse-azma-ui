import type {SupportRequestUserSummary} from './types';

type TicketUserDetailsProps = {
    userDetails: SupportRequestUserSummary;
};

export default function TicketUserDetails({userDetails}: TicketUserDetailsProps) {
    return (
        <div
            className="mt-2 grid grid-cols-1 gap-2 rounded-xl border border-border/60 bg-surface-2 p-3 text-xs sm:grid-cols-2">
            {userDetails.firstName || userDetails.lastName ? (
                <div>
                    <p className="text-[10px] text-muted">نام و نام خانوادگی</p>
                    <p className="mt-0.5 font-semibold text-text">
                        {[userDetails.firstName, userDetails.lastName].filter(Boolean).join(' ')}
                    </p>
                </div>
            ) : null}
            <div>
                <p className="text-[10px] text-muted">نام کاربری</p>
                <p className="mt-0.5 font-semibold text-text" dir="ltr">@{userDetails.username}</p>
            </div>
            {userDetails.nationalCode ? (
                <div>
                    <p className="text-[10px] text-muted">کد ملی</p>
                    <p className="mt-0.5 font-semibold text-text" dir="ltr">{userDetails.nationalCode}</p>
                </div>
            ) : null}
            {userDetails.phoneNumber ? (
                <div>
                    <p className="text-[10px] text-muted">شماره تماس</p>
                    <p className="mt-0.5 font-semibold text-text" dir="ltr">{userDetails.phoneNumber}</p>
                </div>
            ) : null}
            {userDetails.email ? (
                <div className="sm:col-span-2">
                    <p className="text-[10px] text-muted">ایمیل</p>
                    <p className="mt-0.5 font-semibold text-text" dir="ltr">{userDetails.email}</p>
                </div>
            ) : null}
        </div>
    );
}
