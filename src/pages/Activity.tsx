import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SystemActivityLog } from '@/components/settings/SystemActivityLog';
import { LoginActivityLog } from '@/components/settings/LoginActivityLog';
import { UserActivityLogGlobal } from '@/components/settings/UserActivityLogGlobal';
import { Activity as ActivityIcon, LogIn, Users } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useHasPermission } from '@/hooks/useHasPermission';

export default function Activity() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { hasPermission } = useHasPermission();

  const canViewSystem = hasPermission('activity.system');
  const canViewLogin = hasPermission('activity.login');
  const canViewUser = hasPermission('activity.user');

  // Determine default tab based on permissions
  const defaultTab = canViewSystem ? 'system' : canViewLogin ? 'login' : canViewUser ? 'user' : 'system';
  const activeTab = searchParams.get('tab') || defaultTab;

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  const tabCount = [canViewSystem, canViewLogin, canViewUser].filter(Boolean).length;

  return (
    <DashboardLayout title="Activity" subtitle="Track system and login activities">
      <div className="space-y-6">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className={`grid w-full max-w-lg grid-cols-${tabCount || 1}`}>
            {canViewSystem && (
              <TabsTrigger value="system" className="gap-2">
                <ActivityIcon className="w-4 h-4" />
                System Activity
              </TabsTrigger>
            )}
            {canViewLogin && (
              <TabsTrigger value="login" className="gap-2">
                <LogIn className="w-4 h-4" />
                Login Activity
              </TabsTrigger>
            )}
            {canViewUser && (
              <TabsTrigger value="user" className="gap-2">
                <Users className="w-4 h-4" />
                User Activity
              </TabsTrigger>
            )}
          </TabsList>
          
          {canViewSystem && (
            <TabsContent value="system" className="mt-6">
              <SystemActivityLog />
            </TabsContent>
          )}
          
          {canViewLogin && (
            <TabsContent value="login" className="mt-6">
              <LoginActivityLog />
            </TabsContent>
          )}

          {canViewUser && (
            <TabsContent value="user" className="mt-6">
              <UserActivityLogGlobal />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
