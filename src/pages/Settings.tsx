import { useState, useEffect, useRef } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Server,
  Wifi,
  Network,
  Shield,
  Bell,
  Database,
  Check,
  X,
  Loader2,
  RefreshCw,
  AlertCircle,
  Save,
  Users,
  CreditCard,
  MessageSquare,
  Package,
  Download,
  Upload,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { SoftwareUserManagement } from '@/components/settings/SoftwareUserManagement';
import { SessionTimeoutSettings } from '@/components/settings/SessionTimeoutSettings';
import { TimezoneSettings } from '@/components/settings/TimezoneSettings';
import { MikrotikDiagnostics } from '@/components/settings/MikrotikDiagnostics';
import { MikrotikSetupGuide } from '@/components/settings/MikrotikSetupGuide';
import { ConnectivityTypeManagement } from '@/components/settings/ConnectivityTypeManagement';
import { PaymentMethodManagement } from '@/components/settings/PaymentMethodManagement';
import { DisconnectRouterButton } from '@/components/settings/DisconnectRouterButton';
import { RoleManagement } from '@/components/settings/RoleManagement';

import { MikrotikRouterManagement } from '@/components/settings/MikrotikRouterManagement';
import { IncomeCategoryManagement } from '@/components/settings/IncomeCategoryManagement';
import { ExpenseCategoryManagement } from '@/components/settings/ExpenseCategoryManagement';
import { DepartmentManagement } from '@/components/settings/DepartmentManagement';
import { PositionManagement } from '@/components/settings/PositionManagement';
import { PaymentGatewaySettings } from '@/components/settings/PaymentGatewaySettings';
import { SuperAdminAccountSettings } from '@/components/settings/SuperAdminAccountSettings';
import { RequestNoteSettings } from '@/components/settings/RequestNoteSettings';
import { BrandingSettings } from '@/components/settings/BrandingSettings';
import { ThemeSettings } from '@/components/settings/ThemeSettings';
import { SmsGatewaySettings } from '@/components/settings/SmsGatewaySettings';
import { ShareholderManagement } from '@/components/settings/ShareholderManagement';
import { CustomerPortalSettings } from '@/components/settings/CustomerPortalSettings';
import { useHasPermission } from '@/hooks/useHasPermission';

interface ConnectionStatus {
  connected: boolean;
  systemInfo?: {
    version?: string;
    boardName?: string;
    cpuLoad?: string;
    freeMemory?: string;
    uptime?: string;
  };
  error?: string;
}

function extractEdgeFunctionErrorMessage(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err);
  // supabase-js formats errors like:
  // "Edge function returned 400: Error, {\"success\":false,\"error\":\"...\"}"
  const jsonStart = message.indexOf('{');
  if (jsonStart !== -1) {
    const maybeJson = message.slice(jsonStart);
    try {
      const parsed = JSON.parse(maybeJson) as { error?: string };
      if (parsed?.error) return parsed.error;
    } catch {
      // ignore
    }
  }
  return message;
}

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [isExporting, setIsExporting] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const restoreFileRef = useRef<HTMLInputElement>(null);
  const [mikrotikConfig, setMikrotikConfig] = useState({
    id: '',
    name: 'Default Router',
    host: '',
    port: '8728',
    username: '',
    password: '',
    connectionMode: 'api' as 'api' | 'rest',
    useSsl: false,
  });

  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus | null>(null);


  // Fetch default router from database
  const { data: routers, isLoading: routersLoading } = useQuery({
    queryKey: ['mikrotik-routers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mikrotik_routers')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: true })
        .limit(1);
      
      if (error) throw error;
      return data;
    },
  });

  // Load router config when data is fetched
  useEffect(() => {
    if (routers && routers.length > 0) {
      const router = routers[0] as { id: string; name: string; host: string; port: number | null; username: string; password: string; connection_mode?: string; use_ssl?: boolean };
      setMikrotikConfig({
        id: router.id,
        name: router.name,
        host: router.host,
        port: router.port?.toString() || '8728',
        username: router.username,
        password: router.password,
        connectionMode: (router.connection_mode as 'api' | 'rest') || 'api',
        useSsl: router.use_ssl ?? false,
      });
    }
  }, [routers]);

  // Save router config mutation
  const saveRouter = useMutation({
    mutationFn: async () => {
      if (mikrotikConfig.id) {
        // Update existing router
        const { error } = await supabase
          .from('mikrotik_routers')
          .update({
            name: mikrotikConfig.name,
            host: mikrotikConfig.host,
            port: parseInt(mikrotikConfig.port) || 8728,
            username: mikrotikConfig.username,
            password: mikrotikConfig.password,
            connection_mode: mikrotikConfig.connectionMode,
            use_ssl: mikrotikConfig.useSsl,
          })
          .eq('id', mikrotikConfig.id);
        
        if (error) throw error;
      } else {
        // Create new router
        const { data, error } = await supabase
          .from('mikrotik_routers')
          .insert({
            name: mikrotikConfig.name || 'Default Router',
            host: mikrotikConfig.host,
            port: parseInt(mikrotikConfig.port) || 8728,
            username: mikrotikConfig.username,
            password: mikrotikConfig.password,
            connection_mode: mikrotikConfig.connectionMode,
            use_ssl: mikrotikConfig.useSsl,
          })
          .select()
          .single();
        
        if (error) throw error;
        setMikrotikConfig(prev => ({ ...prev, id: data.id }));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mikrotik-routers'] });
      toast.success('Router configuration saved!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to save: ${error.message}`);
    },
  });

  const testConnection = useMutation({
    mutationFn: async () => {
      // Pass router config directly to the edge function
      const { data, error } = await supabase.functions.invoke('mikrotik-sync', {
        body: { 
          action: 'test-connection',
          router: {
            host: mikrotikConfig.host,
            port: mikrotikConfig.port,
            username: mikrotikConfig.username,
            password: mikrotikConfig.password,
            connectionMode: mikrotikConfig.connectionMode,
            useSsl: mikrotikConfig.useSsl,
          }
        },
      });

      if (error) {
        return { success: false, error: extractEdgeFunctionErrorMessage(error) };
      }
      return data;
    },
    onSuccess: (data) => {
      if (data.success) {
        const resourceData = Array.isArray(data.data) ? data.data[0] : data.data;
        setConnectionStatus({
          connected: true,
          systemInfo: {
            version: resourceData?.version,
            boardName: resourceData?.['board-name'],
            cpuLoad: resourceData?.['cpu-load'],
            freeMemory: resourceData?.['free-memory'],
            uptime: resourceData?.uptime,
          },
        });
        toast.success('Successfully connected to MikroTik router!');
      } else {
        const rawMessage = data.error || 'Connection failed';
        const friendlyHint = rawMessage.includes('MikroTik API error: 404')
          ? `${rawMessage}\n\nHint: This usually means the MikroTik REST endpoint (/rest/...) is not available on this port. For RouterOS REST, use the WebFig (www/www-ssl) port (commonly 80 or 443) and ensure RouterOS v7+.`
          : rawMessage;
        setConnectionStatus({
          connected: false,
          error: friendlyHint,
        });
        toast.error(rawMessage);
      }
    },
    onError: (error: Error) => {
      setConnectionStatus({
        connected: false,
        error: extractEdgeFunctionErrorMessage(error),
      });
      toast.error(`Connection failed: ${extractEdgeFunctionErrorMessage(error)}`);
    },
  });

  const syncAllUsers = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('mikrotik-sync', {
        body: { action: 'sync-all-users' },
      });

      if (error) {
        return { success: false, error: extractEdgeFunctionErrorMessage(error) };
      }
      return data;
    },
    onSuccess: (data) => {
      if (data.success) {
        const results = data.data as Array<{ username: string; success: boolean; error?: string }>;
        const successCount = results.filter(r => r.success).length;
        const failCount = results.filter(r => !r.success).length;
        
        if (failCount === 0) {
          toast.success(`Synced ${successCount} users successfully!`);
        } else {
          toast.warning(`Synced ${successCount} users, ${failCount} failed`);
        }
      } else {
        toast.error(data.error || 'Sync failed');
      }
    },
    onError: (error: Error) => {
      toast.error(`Sync failed: ${extractEdgeFunctionErrorMessage(error)}`);
    },
  });


  const syncHotspotUsers = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('mikrotik-sync', {
        body: { action: 'sync-users', service_type: 'hotspot' },
      });

      if (error) {
        return { success: false, error: extractEdgeFunctionErrorMessage(error) };
      }
      return data;
    },
    onSuccess: (data) => {
      if (data.success) {
        const results = data.data as { synced?: number; failed?: number; total?: number; message?: string };
        if (results.message) {
          toast.info(results.message);
        } else if ((results.failed || 0) === 0) {
          toast.success(`Synced ${results.synced || 0} Hotspot users successfully!`);
        } else {
          toast.warning(`Synced ${results.synced || 0} Hotspot users, ${results.failed || 0} failed`);
        }
      } else {
        toast.error(data.error || 'Hotspot users sync failed');
      }
    },
    onError: (error: Error) => {
      toast.error(`Hotspot users sync failed: ${extractEdgeFunctionErrorMessage(error)}`);
    },
  });


  const syncHotspotPlans = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('mikrotik-sync', {
        body: { action: 'sync-plans', service_type: 'hotspot' },
      });

      if (error) {
        return { success: false, error: extractEdgeFunctionErrorMessage(error) };
      }
      return data;
    },
    onSuccess: (data) => {
      if (data.success) {
        toast.success('Hotspot plans synced successfully!');
      } else {
        toast.error(data.error || 'Hotspot plan sync failed');
      }
    },
    onError: (error: Error) => {
      toast.error(`Hotspot plan sync failed: ${extractEdgeFunctionErrorMessage(error)}`);
    },
  });


  const importHotspotUsers = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('mikrotik-sync', {
        body: { action: 'import-users', service_type: 'hotspot' },
      });

      if (error) {
        return { success: false, error: extractEdgeFunctionErrorMessage(error) };
      }
      return data;
    },
    onSuccess: (data) => {
      if (data.success) {
        const results = data.data as { imported?: number; skipped?: number; total?: number; message?: string };
        if (results.message) {
          toast.info(results.message);
        } else if ((results.imported || 0) > 0) {
          toast.success(`Imported ${results.imported} Hotspot users! (${results.skipped || 0} skipped)`);
        } else {
          toast.info(`No new Hotspot users to import. ${results.skipped || 0} already exist.`);
        }
        queryClient.invalidateQueries({ queryKey: ['radius-users'] });
      } else {
        toast.error(data.error || 'Hotspot users import failed');
      }
    },
    onError: (error: Error) => {
      toast.error(`Hotspot users import failed: ${extractEdgeFunctionErrorMessage(error)}`);
    },
  });


  const importHotspotPlans = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('mikrotik-sync', {
        body: { action: 'import-plans', service_type: 'hotspot' },
      });

      if (error) {
        return { success: false, error: extractEdgeFunctionErrorMessage(error) };
      }
      return data;
    },
    onSuccess: (data) => {
      if (data.success) {
        const results = data.data as { imported?: number; skipped?: number; total?: number; message?: string };
        if (results.message) {
          toast.info(results.message);
        } else if ((results.imported || 0) > 0) {
          toast.success(`Imported ${results.imported} Hotspot plans! (${results.skipped || 0} skipped)`);
        } else {
          toast.info(`No new Hotspot plans to import. ${results.skipped || 0} already exist.`);
        }
        queryClient.invalidateQueries({ queryKey: ['billing-plans'] });
      } else {
        toast.error(data.error || 'Hotspot plans import failed');
      }
    },
    onError: (error: Error) => {
      toast.error(`Hotspot plans import failed: ${extractEdgeFunctionErrorMessage(error)}`);
    },
  });

  const { hasPermission, hasAnyPermission } = useHasPermission();

  // Define which tabs map to which permissions
  const settingsTabs = [
    { value: 'admin-user', label: 'Software User', icon: Users, permission: 'settings.users' },
    { value: 'roles', label: 'Rule Manage', icon: Shield, permission: 'settings.roles' },
    { value: 'mikrotik', label: 'MikroTik Manage', icon: Server, permission: 'settings.mikrotik' },
    { value: 'payment', label: 'Payment Manage', icon: CreditCard, permissions: ['settings.payment', 'settings.payment_gateway', 'settings.categories', 'settings.shareholders'] },
    { value: 'sms', label: 'SMS Manage', icon: MessageSquare, permission: 'settings.sms_gateway' },
    { value: 'notifications', label: 'Notifications', icon: Bell, permission: 'settings.branding' },
    { value: 'data', label: 'Data', icon: Database, permission: 'settings.activity' },
    { value: 'system', label: 'System', icon: Server, permissions: ['settings.branding', 'settings.session', 'settings.timezone', 'settings.super_admin', 'settings.customer_portal'] },
  ];

  const visibleTabs = settingsTabs.filter(tab => {
    if ('permissions' in tab && tab.permissions) return hasAnyPermission(tab.permissions);
    if ('permission' in tab && tab.permission) return hasPermission(tab.permission);
    return true;
  });

  const defaultTab = visibleTabs.length > 0 ? visibleTabs[0].value : 'admin-user';

  return (
    <DashboardLayout title="Settings" subtitle="Configure system preferences">
      <Tabs defaultValue={defaultTab} className="space-y-6">
        <TabsList className="bg-card border border-border flex-wrap h-auto gap-1 p-1">
          {visibleTabs.map(tab => (
            <TabsTrigger key={tab.value} value={tab.value} className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <tab.icon className="w-4 h-4 mr-2" />
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Software User Management */}
        <TabsContent value="admin-user" className="space-y-6">
          <SoftwareUserManagement />
        </TabsContent>

        {/* Role Management */}
        <TabsContent value="roles" className="space-y-6">
          <RoleManagement />
        </TabsContent>

        {/* MikroTik Settings */}
        <TabsContent value="mikrotik" className="space-y-6">
          {/* Multi-Router Management */}
          <MikrotikRouterManagement />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Connection Configuration */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="w-5 h-5 text-primary" />
                  Router Connection
                </CardTitle>
                <CardDescription>
                  Configure connection to your MikroTik router.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Connection Info */}
                <div className="bg-muted/30 rounded-lg p-3 border border-border">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Network className="w-4 h-4 text-primary" />
                    <span>MikroTik API Protocol (RouterOS v6+)</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Use port 8728 (plaintext) or 8729 (SSL/TLS).
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Router Name</Label>
                  <Input
                    placeholder="Main Router"
                    className="bg-secondary border-border"
                    value={mikrotikConfig.name}
                    onChange={(e) => setMikrotikConfig({ ...mikrotikConfig, name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Router IP / Hostname</Label>
                  <Input
                    placeholder="192.168.88.1"
                    className="bg-secondary border-border"
                    value={mikrotikConfig.host}
                    onChange={(e) => setMikrotikConfig({ ...mikrotikConfig, host: e.target.value })}
                  />
                </div>

                {/* SSL Toggle */}
                <div className="flex items-center justify-between rounded-lg border border-border p-3 bg-muted/30">
                  <div className="space-y-0.5">
                    <Label>Use SSL/TLS</Label>
                    <p className="text-xs text-muted-foreground">
                      Enable for encrypted connection (api-ssl service)
                    </p>
                  </div>
                  <Switch
                    checked={mikrotikConfig.useSsl}
                    onCheckedChange={(checked) => {
                      // Auto-suggest port based on SSL toggle
                      const currentPort = mikrotikConfig.port;
                      let newPort = currentPort;
                      if (checked && (currentPort === '8728' || currentPort === '')) {
                        newPort = '8729';
                      } else if (!checked && currentPort === '8729') {
                        newPort = '8728';
                      }
                      setMikrotikConfig({ ...mikrotikConfig, useSsl: checked, port: newPort });
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label>API Port</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder={mikrotikConfig.useSsl ? "8729" : "8728"}
                      className="bg-secondary border-border flex-1"
                      value={mikrotikConfig.port}
                      onChange={(e) => setMikrotikConfig({ ...mikrotikConfig, port: e.target.value })}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-xs whitespace-nowrap"
                      onClick={() => setMikrotikConfig({ 
                        ...mikrotikConfig, 
                        port: mikrotikConfig.useSsl ? '8729' : '8728' 
                      })}
                    >
                      Reset Default
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {mikrotikConfig.useSsl 
                      ? "Default: 8729 for API-SSL. Custom port forwarding supported." 
                      : "Default: 8728 for API (plaintext). Custom port forwarding supported."}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Username</Label>
                    <Input
                      placeholder="admin"
                      className="bg-secondary border-border"
                      value={mikrotikConfig.username}
                      onChange={(e) => setMikrotikConfig({ ...mikrotikConfig, username: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Password</Label>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      className="bg-secondary border-border"
                      value={mikrotikConfig.password}
                      onChange={(e) => setMikrotikConfig({ ...mikrotikConfig, password: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1 border-border"
                    onClick={() => saveRouter.mutate()}
                    disabled={saveRouter.isPending || !mikrotikConfig.host}
                  >
                    {saveRouter.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Configuration
                      </>
                    )}
                  </Button>
                  <Button
                    className="flex-1 bg-gradient-primary text-primary-foreground"
                    onClick={() => testConnection.mutate()}
                    disabled={testConnection.isPending || !mikrotikConfig.host}
                  >
                    {testConnection.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Testing...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Test Connection
                      </>
                    )}
                  </Button>
                </div>

                {/* Disconnect Router Button */}
                {mikrotikConfig.id && (
                  <DisconnectRouterButton routerId={mikrotikConfig.id} />
                )}
              </CardContent>
            </Card>

            {/* Connection Status */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {connectionStatus?.connected ? (
                    <Check className="w-5 h-5 text-success" />
                  ) : connectionStatus ? (
                    <X className="w-5 h-5 text-destructive" />
                  ) : (
                    <Server className="w-5 h-5 text-muted-foreground" />
                  )}
                  Connection Status
                </CardTitle>
                <CardDescription>
                  Current connection status to MikroTik router.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {connectionStatus === null ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Server className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Click "Test Connection" to check connectivity</p>
                  </div>
                ) : connectionStatus.connected ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-success">
                      <Check className="w-5 h-5" />
                      <span className="font-medium">Connected Successfully</span>
                    </div>
                    
                    {connectionStatus.systemInfo && (
                      <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                        <h4 className="font-medium text-sm text-foreground">Router Information</h4>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          {connectionStatus.systemInfo.boardName && (
                            <div>
                              <span className="text-muted-foreground">Board:</span>
                              <span className="ml-2 text-foreground">{connectionStatus.systemInfo.boardName}</span>
                            </div>
                          )}
                          {connectionStatus.systemInfo.version && (
                            <div>
                              <span className="text-muted-foreground">Version:</span>
                              <span className="ml-2 text-foreground">{connectionStatus.systemInfo.version}</span>
                            </div>
                          )}
                          {connectionStatus.systemInfo.cpuLoad && (
                            <div>
                              <span className="text-muted-foreground">CPU Load:</span>
                              <span className="ml-2 text-foreground">{connectionStatus.systemInfo.cpuLoad}%</span>
                            </div>
                          )}
                          {connectionStatus.systemInfo.freeMemory && (
                            <div>
                              <span className="text-muted-foreground">Free Memory:</span>
                              <span className="ml-2 text-foreground">{connectionStatus.systemInfo.freeMemory}</span>
                            </div>
                          )}
                          {connectionStatus.systemInfo.uptime && (
                            <div className="col-span-2">
                              <span className="text-muted-foreground">Uptime:</span>
                              <span className="ml-2 text-foreground">{connectionStatus.systemInfo.uptime}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-destructive">
                      <X className="w-5 h-5" />
                      <span className="font-medium">Connection Failed</span>
                    </div>
                    <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4">
                      <p className="text-sm text-destructive">{connectionStatus.error}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Port Diagnostics */}
          <MikrotikDiagnostics
            host={mikrotikConfig.host}
            username={mikrotikConfig.username}
            password={mikrotikConfig.password}
            onApplyConfig={(config) => {
              setMikrotikConfig(prev => ({
                ...prev,
                port: config.port,
                useSsl: config.useSsl,
                connectionMode: config.connectionMode,
              }));
            }}
          />

          {/* Setup Guide */}
          <MikrotikSetupGuide />

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-primary" />
                Sync Actions
              </CardTitle>
              <CardDescription>
                Synchronize users and settings with your MikroTik router.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* User Sync Section */}
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-3">User Sync</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="bg-secondary border-border">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                          <Network className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-medium">Sync All Users</h4>
                          <p className="text-xs text-muted-foreground">Push all users to router</p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        className="w-full border-border"
                        onClick={() => syncAllUsers.mutate()}
                        disabled={syncAllUsers.isPending}
                      >
                        {syncAllUsers.isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Syncing...
                          </>
                        ) : (
                          'Sync Now'
                        )}
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="bg-secondary border-border">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-lg bg-warning/20 flex items-center justify-center">
                          <Wifi className="w-5 h-5 text-warning" />
                        </div>
                        <div>
                          <h4 className="font-medium">Hotspot Users</h4>
                          <p className="text-xs text-muted-foreground">Sync hotspot users only</p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        className="w-full border-border"
                        onClick={() => syncHotspotUsers.mutate()}
                        disabled={syncHotspotUsers.isPending}
                      >
                        {syncHotspotUsers.isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Syncing...
                          </>
                        ) : (
                          'Sync Hotspot'
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Import Users Section */}
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-3">Import Users from MikroTik</h4>
                <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                  <Card className="bg-secondary border-border">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-lg bg-warning/20 flex items-center justify-center">
                          <Download className="w-5 h-5 text-warning" />
                        </div>
                        <div>
                          <h4 className="font-medium">Import Hotspot Users</h4>
                          <p className="text-xs text-muted-foreground">Pull Hotspot users from router</p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        className="w-full border-border"
                        onClick={() => importHotspotUsers.mutate()}
                        disabled={importHotspotUsers.isPending}
                      >
                        {importHotspotUsers.isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Importing...
                          </>
                        ) : (
                          <>
                            <Download className="w-4 h-4 mr-2" />
                            Import Hotspot
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Import will pull users from MikroTik and add them to the database. Existing users will be skipped.
                </p>
              </div>

              {/* Plan Sync Section */}
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-3">Plan Sync</h4>
                <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                  <Card className="bg-secondary border-border">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-lg bg-warning/20 flex items-center justify-center">
                          <Package className="w-5 h-5 text-warning" />
                        </div>
                        <div>
                          <h4 className="font-medium">Hotspot Plans</h4>
                          <p className="text-xs text-muted-foreground">Sync hotspot profiles to router</p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        className="w-full border-border"
                        onClick={() => syncHotspotPlans.mutate()}
                        disabled={syncHotspotPlans.isPending}
                      >
                        {syncHotspotPlans.isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Syncing...
                          </>
                        ) : (
                          'Sync Hotspot Plans'
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Sync pushes your billing plans to MikroTik as profiles with matching rate-limits.
                </p>
              </div>

              {/* Import Plans Section */}
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-3">Import Plans from MikroTik</h4>
                <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                  <Card className="bg-secondary border-border">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-lg bg-warning/20 flex items-center justify-center">
                          <Download className="w-5 h-5 text-warning" />
                        </div>
                        <div>
                          <h4 className="font-medium">Import Hotspot Profiles</h4>
                          <p className="text-xs text-muted-foreground">Pull Hotspot user profiles from router</p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        className="w-full border-border"
                        onClick={() => importHotspotPlans.mutate()}
                        disabled={importHotspotPlans.isPending}
                      >
                        {importHotspotPlans.isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Importing...
                          </>
                        ) : (
                          <>
                            <Download className="w-4 h-4 mr-2" />
                            Import Hotspot Plans
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Import will pull profiles from MikroTik and create billing plans. Rate-limits are converted to speeds. Existing plans will be skipped. Prices need to be set manually after import.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment Management Settings */}
        <TabsContent value="payment" className="space-y-6">
          {hasPermission('settings.categories') && <IncomeCategoryManagement />}
          {hasPermission('settings.categories') && <ExpenseCategoryManagement />}
          {hasPermission('settings.payment') && <PaymentMethodManagement />}
          {hasPermission('settings.payment_gateway') && <PaymentGatewaySettings />}
          {hasPermission('settings.shareholders') && <ShareholderManagement />}
        </TabsContent>

        {/* SMS Management Settings */}
        <TabsContent value="sms" className="space-y-6">
          <SmsGatewaySettings />
        </TabsContent>

        {/* Notifications Settings */}
        <TabsContent value="notifications" className="space-y-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-primary" />
                Notification Preferences
              </CardTitle>
              <CardDescription>
                Configure email and SMS notifications.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-medium">User Notifications</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Expiry Warning</Label>
                      <p className="text-sm text-muted-foreground">Notify users before account expires</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Data Usage Warning</Label>
                      <p className="text-sm text-muted-foreground">Notify at 80% data usage</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Payment Reminders</Label>
                      <p className="text-sm text-muted-foreground">Send payment due reminders</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Admin Notifications</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>New User Registration</Label>
                      <p className="text-sm text-muted-foreground">Notify on new signups</p>
                    </div>
                    <Switch />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>System Alerts</Label>
                      <p className="text-sm text-muted-foreground">Router connectivity issues</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button className="bg-gradient-primary text-primary-foreground">
                  Save Notification Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Data Settings */}
        <TabsContent value="data" className="space-y-6">
          {/* Department Management */}
          <DepartmentManagement />

          {/* Position Management */}
          <PositionManagement />

          {/* Income Category Management */}
          {hasPermission('settings.categories') && <IncomeCategoryManagement />}

          {/* Expense Category Management */}
          {hasPermission('settings.categories') && <ExpenseCategoryManagement />}

          {/* Connectivity Type Management */}
          {hasPermission('settings.connectivity_types') && <ConnectivityTypeManagement />}

          {/* Payment Method Management */}
          {hasPermission('settings.payment') && <PaymentMethodManagement />}

          {/* Request Success Note Settings */}
          <RequestNoteSettings />
        </TabsContent>

        {/* System Settings */}
        <TabsContent value="system" className="space-y-6">
          {/* Branding Settings */}
          <BrandingSettings />

          {/* Theme Settings */}
          <ThemeSettings />

          {/* Super Admin Account Settings */}
          <SuperAdminAccountSettings />

          {/* Session Timeout Settings */}
          <SessionTimeoutSettings />

          {/* Timezone Settings */}
          <TimezoneSettings />

          {/* System Information Card */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5 text-primary" />
                System Information
              </CardTitle>
              <CardDescription>
                View system status and perform maintenance tasks.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground mb-1">Database Status</p>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                    <span className="font-medium text-success">Connected</span>
                  </div>
                </div>
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground mb-1">API Status</p>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                    <span className="font-medium text-success">Operational</span>
                  </div>
                </div>
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground mb-1">Version</p>
                  <span className="font-medium">MikroBill v1.0.0</span>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Maintenance</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button 
                    variant="outline" 
                    className="border-border justify-start"
                    disabled={isExporting}
                    onClick={async () => {
                      setIsExporting(true);
                      try {
                        const tables = [
                          'radius_users', 'billing_plans', 'transactions', 'areas', 
                          'districts', 'police_stations', 'employees', 'salary_payments',
                          'leave_requests', 'expenses', 'income', 'mikrotik_routers',
                          'resellers', 'branches', 'vouchers', 'departments', 'positions',
                          'connectivity_types', 'payment_methods', 'expense_categories', 
                          'income_categories', 'app_settings', 'role_definitions', 'software_users'
                        ];
                        const backup: Record<string, unknown[]> = {};
                        for (const table of tables) {
                          const { data } = await supabase.from(table as any).select('*');
                          backup[table] = data || [];
                        }
                        const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `mikrobill-backup-${new Date().toISOString().split('T')[0]}.json`;
                        a.click();
                        URL.revokeObjectURL(url);
                        toast.success('Database backup exported successfully!');
                      } catch (err: any) {
                        toast.error(`Export failed: ${err.message}`);
                      } finally {
                        setIsExporting(false);
                      }
                    }}
                  >
                    {isExporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Database className="w-4 h-4 mr-2" />}
                    {isExporting ? 'Exporting...' : 'Export Database Backup'}
                  </Button>
                  <Button 
                    variant="outline" 
                    className="border-border justify-start"
                    onClick={() => {
                      queryClient.clear();
                      toast.success('Session cache cleared successfully!');
                    }}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Clear Session Cache
                  </Button>
                </div>

                {/* Restore Section */}
                <div className="mt-4 p-4 bg-destructive/5 border border-destructive/20 rounded-lg space-y-3">
                  <div>
                    <h4 className="font-medium text-destructive">Restore Database</h4>
                    <p className="text-sm text-muted-foreground">
                      Upload a previously exported backup JSON file. This will overwrite existing data in matching tables.
                    </p>
                  </div>
                  <input
                    ref={restoreFileRef}
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      
                      const confirmed = window.confirm(
                        'WARNING: This will delete existing data and replace it with the backup. This action cannot be undone. Are you sure you want to continue?'
                      );
                      if (!confirmed) {
                        if (restoreFileRef.current) restoreFileRef.current.value = '';
                        return;
                      }

                      setIsRestoring(true);
                      try {
                        const text = await file.text();
                        const backup = JSON.parse(text) as Record<string, unknown[]>;
                        
                        const tableOrder = [
                          'app_settings', 'connectivity_types', 'payment_methods', 
                          'expense_categories', 'income_categories', 'departments', 'positions',
                          'role_definitions', 'districts', 'police_stations', 'areas',
                          'billing_plans', 'mikrotik_routers', 'resellers', 'branches',
                          'employees', 'software_users',
                          'radius_users', 'transactions', 'vouchers',
                          'salary_payments', 'leave_requests', 'expenses', 'income',
                          'reseller_credits', 'reseller_plan_commissions', 'reseller_user_recharges',
                          'reseller_users'
                        ];

                        let restored = 0;
                        let skipped = 0;

                        for (const table of tableOrder) {
                          const rows = backup[table];
                          if (!rows || !Array.isArray(rows) || rows.length === 0) {
                            skipped++;
                            continue;
                          }

                          // Delete existing data
                          await supabase.from(table as any).delete().neq('id', '00000000-0000-0000-0000-000000000000');
                          
                          // Insert in batches of 100
                          for (let i = 0; i < rows.length; i += 100) {
                            const batch = rows.slice(i, i + 100);
                            const { error } = await supabase.from(table as any).insert(batch as any);
                            if (error) {
                              console.error(`Error restoring ${table}:`, error.message);
                            }
                          }
                          restored++;
                        }

                        queryClient.invalidateQueries();
                        toast.success(`Database restored! ${restored} tables restored, ${skipped} skipped.`);
                      } catch (err: any) {
                        toast.error(`Restore failed: ${err.message}`);
                      } finally {
                        setIsRestoring(false);
                        if (restoreFileRef.current) restoreFileRef.current.value = '';
                      }
                    }}
                  />
                  <Button
                    variant="outline"
                    className="border-destructive/30 text-destructive hover:bg-destructive/10"
                    disabled={isRestoring}
                    onClick={() => restoreFileRef.current?.click()}
                  >
                    {isRestoring ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4 mr-2" />
                    )}
                    {isRestoring ? 'Restoring...' : 'Restore from Backup'}
                  </Button>
                </div>

                {/* Factory Reset Section */}
                <div className="mt-4 p-4 bg-destructive/10 border border-destructive/30 rounded-lg space-y-3">
                  <div>
                    <h4 className="font-medium text-destructive">⚠️ Factory Reset</h4>
                    <p className="text-sm text-muted-foreground">
                      Delete ALL data from the system and reset to a clean state. This will remove all users, transactions, plans, employees, and settings. This action is <strong>irreversible</strong>.
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    disabled={isResetting}
                    onClick={async () => {
                      const step1 = window.prompt(
                        'WARNING: This will permanently delete ALL data.\n\nType "RESET" to confirm:'
                      );
                      if (step1 !== 'RESET') {
                        toast.error('Reset cancelled. You must type RESET exactly.');
                        return;
                      }

                      const step2 = window.confirm(
                        'FINAL WARNING: All users, transactions, plans, employees, finances, and settings will be permanently deleted. There is NO undo. Continue?'
                      );
                      if (!step2) return;

                      setIsResetting(true);
                      try {
                        // Delete in reverse dependency order
                        const deleteOrder = [
                          'bandwidth_history', 'mikrotik_sync_log', 'device_change_requests',
                          'reseller_user_recharges', 'reseller_plan_commissions', 'reseller_credits',
                          'reseller_users',
                          'transactions', 'vouchers',
                          'salary_payments', 'leave_requests',
                          'login_activity', 'system_activity',
                          'expenses', 'income',
                          'radius_users',
                          'branches', 'resellers',
                          'employees',
                          'billing_plans', 'mikrotik_routers',
                          'areas', 'police_stations', 'districts',
                          'positions', 'departments',
                          'connectivity_types', 'payment_methods',
                          'expense_categories', 'income_categories',
                          'user_requests',
                        ];

                        let deleted = 0;
                        for (const table of deleteOrder) {
                          const { error } = await supabase
                            .from(table as any)
                            .delete()
                            .neq('id', '00000000-0000-0000-0000-000000000000');
                          if (!error) deleted++;
                          else console.error(`Reset ${table}:`, error.message);
                        }

                        queryClient.invalidateQueries();
                        toast.success(`Factory reset complete! ${deleted} tables cleared.`);
                      } catch (err: any) {
                        toast.error(`Reset failed: ${err.message}`);
                      } finally {
                        setIsResetting(false);
                      }
                    }}
                  >
                    {isResetting ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <AlertCircle className="w-4 h-4 mr-2" />
                    )}
                    {isResetting ? 'Resetting...' : 'Factory Reset'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}