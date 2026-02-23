import { UserActivityLog } from '@/components/users/UserActivityLog';

interface ActivityLogTabProps {
  userId: string;
  lastLoginAt: string | null;
  username?: string;
}

export function ActivityLogTab({ userId, lastLoginAt, username }: ActivityLogTabProps) {
  return (
    <div className="space-y-6">
      <UserActivityLog userId={userId} lastLoginAt={lastLoginAt} username={username} />
    </div>
  );
}
