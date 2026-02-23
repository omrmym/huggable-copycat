import { cn } from '@/lib/utils';

type UserStatus = 'online' | 'offline' | 'expired' | 'suspended' | 'active' | 'disabled';

interface UserStatusBadgeProps {
  status: UserStatus;
}

const statusConfig: Record<UserStatus, { label: string; className: string }> = {
  online: {
    label: 'Online',
    className: 'bg-online/20 text-online border-online/30',
  },
  active: {
    label: 'Active',
    className: 'bg-success/20 text-success border-success/30',
  },
  offline: {
    label: 'Offline',
    className: 'bg-muted text-muted-foreground border-muted',
  },
  disabled: {
    label: 'Disabled',
    className: 'bg-muted text-muted-foreground border-muted',
  },
  expired: {
    label: 'Expired',
    className: 'bg-expired/20 text-expired border-expired/30',
  },
  suspended: {
    label: 'Suspended',
    className: 'bg-suspended/20 text-suspended border-suspended/30',
  },
};

export function UserStatusBadge({ status }: UserStatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border',
        config.className
      )}
    >
      {status === 'online' && (
        <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
      )}
      {config.label}
    </span>
  );
}
