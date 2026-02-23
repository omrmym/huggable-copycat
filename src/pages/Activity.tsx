import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SystemActivityLog } from '@/components/settings/SystemActivityLog';
import { LoginActivityLog } from '@/components/settings/LoginActivityLog';
import { Activity as ActivityIcon, LogIn } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

export default function Activity() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'system';

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  return (
    <DashboardLayout title="Activity" subtitle="Track system and login activities">
      <div className="space-y-6">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="system" className="gap-2">
              <ActivityIcon className="w-4 h-4" />
              System Activity
            </TabsTrigger>
            <TabsTrigger value="login" className="gap-2">
              <LogIn className="w-4 h-4" />
              Login Activity
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="system" className="mt-6">
            <SystemActivityLog />
          </TabsContent>
          
          <TabsContent value="login" className="mt-6">
            <LoginActivityLog />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
