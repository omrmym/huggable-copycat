import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { MessageSquare, Save, Loader2, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Json } from '@/integrations/supabase/types';

interface SmsGatewayConfig {
  provider: string;
  api_url: string;
  api_key: string;
  sender_id: string;
  bill_reminder: boolean;
  payment_confirmation: boolean;
  expiry_warning: boolean;
  service_activation: boolean;
}

const defaultConfig: SmsGatewayConfig = {
  provider: '',
  api_url: '',
  api_key: '',
  sender_id: '',
  bill_reminder: true,
  payment_confirmation: true,
  expiry_warning: true,
  service_activation: false,
};

export function SmsGatewaySettings() {
  const queryClient = useQueryClient();
  const [config, setConfig] = useState<SmsGatewayConfig>(defaultConfig);
  const [testPhone, setTestPhone] = useState('');

  const { data: savedConfig, isLoading } = useQuery({
    queryKey: ['app-settings', 'sms_gateway'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('app_settings')
        .select('*')
        .eq('key', 'sms_gateway')
        .maybeSingle();

      if (error) throw error;
      if (!data) return defaultConfig;
      return data.value as unknown as SmsGatewayConfig;
    },
  });

  useEffect(() => {
    if (savedConfig) {
      setConfig(savedConfig);
    }
  }, [savedConfig]);

  const saveMutation = useMutation({
    mutationFn: async (settings: SmsGatewayConfig) => {
      const { data: existing } = await supabase
        .from('app_settings')
        .select('id')
        .eq('key', 'sms_gateway')
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('app_settings')
          .update({ value: settings as unknown as Json })
          .eq('key', 'sms_gateway');
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('app_settings')
          .insert({
            key: 'sms_gateway',
            value: settings as unknown as Json,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app-settings', 'sms_gateway'] });
      toast.success('SMS gateway settings saved successfully!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to save SMS settings: ${error.message}`);
    },
  });

  const handleSave = () => {
    saveMutation.mutate(config);
  };

  const [isSending, setIsSending] = useState(false);

  const handleTestSms = async () => {
    if (!config.api_url || !config.api_key) {
      toast.error('Please configure API URL and API Key first.');
      return;
    }
    if (!testPhone) {
      toast.error('Please enter a phone number to test.');
      return;
    }

    setIsSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-sms', {
        body: {
          api_url: config.api_url,
          api_key: config.api_key,
          sender_id: config.sender_id,
          number: testPhone,
          message: 'This is a test SMS from FlyNet-ISP RADIUS Manager.',
        },
      });

      if (error) {
        toast.error(`SMS failed: ${error.message}`);
        return;
      }

      const apiResponse = data?.api_response;
      const responseCode = apiResponse?.response_code || apiResponse?.status_code;
      const isRealSuccess = responseCode === 202;
      
      if (isRealSuccess) {
        toast.success(`Test SMS sent successfully to ${testPhone}!`);
      } else {
        const errorMsg = apiResponse?.error_message || apiResponse?.raw_response || data?.message || 'Unknown error';
        toast.error(`SMS failed: ${errorMsg} (Code: ${responseCode || 'N/A'})`);
      }
    } catch (err: any) {
      toast.error(`SMS error: ${err.message}`);
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-primary" />
          SMS Gateway Configuration
        </CardTitle>
        <CardDescription>
          Configure SMS gateway for notifications and alerts.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="font-medium">Gateway Settings</h4>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label>SMS Provider</Label>
                <Input
                  placeholder="e.g., BulkSMS, Twilio"
                  className="bg-secondary border-border"
                  value={config.provider}
                  onChange={(e) => setConfig({ ...config, provider: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label>API URL</Label>
                <Input
                  placeholder="https://api.smsprovider.com/send"
                  className="bg-secondary border-border"
                  value={config.api_url}
                  onChange={(e) => setConfig({ ...config, api_url: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label>API Key</Label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  className="bg-secondary border-border"
                  value={config.api_key}
                  onChange={(e) => setConfig({ ...config, api_key: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label>Sender ID</Label>
                <Input
                  placeholder="MYISP"
                  className="bg-secondary border-border"
                  value={config.sender_id}
                  onChange={(e) => setConfig({ ...config, sender_id: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium">Notification Settings</h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Bill Reminder</Label>
                  <p className="text-sm text-muted-foreground">Send bill reminder SMS</p>
                </div>
                <Switch
                  checked={config.bill_reminder}
                  onCheckedChange={(checked) => setConfig({ ...config, bill_reminder: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Payment Confirmation</Label>
                  <p className="text-sm text-muted-foreground">Send payment received SMS</p>
                </div>
                <Switch
                  checked={config.payment_confirmation}
                  onCheckedChange={(checked) => setConfig({ ...config, payment_confirmation: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Expiry Warning</Label>
                  <p className="text-sm text-muted-foreground">Send expiry warning SMS</p>
                </div>
                <Switch
                  checked={config.expiry_warning}
                  onCheckedChange={(checked) => setConfig({ ...config, expiry_warning: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Service Activation</Label>
                  <p className="text-sm text-muted-foreground">Send activation SMS</p>
                </div>
                <Switch
                  checked={config.service_activation}
                  onCheckedChange={(checked) => setConfig({ ...config, service_activation: checked })}
                />
              </div>
            </div>

            <div className="pt-4 border-t border-border space-y-2">
              <Label>Test SMS</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Phone number"
                  className="bg-secondary border-border"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                />
                <Button variant="outline" className="border-border shrink-0" onClick={handleTestSms} disabled={isSending}>
                  {isSending ? (
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 mr-1" />
                  )}
                  {isSending ? 'Sending...' : 'Test'}
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            className="bg-gradient-primary text-primary-foreground"
            onClick={handleSave}
            disabled={saveMutation.isPending}
          >
            {saveMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save SMS Settings
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
