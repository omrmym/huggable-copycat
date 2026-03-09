import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { MessageSquare, Save, Loader2, Send, Wallet, RefreshCw, Code, Copy, Check } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { useSmsBalance } from '@/hooks/useSmsBalance';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
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
  bill_reminder_days: number;
  bill_reminder_template: string;
  payment_confirmation: boolean;
  payment_confirmation_template: string;
  expiry_warning: boolean;
  expiry_warning_days: number;
  expiry_warning_template: string;
  service_activation: boolean;
  service_activation_template: string;
}

const defaultTemplates = [
  { id: 'bill_reminder', label: 'Bill Reminder', message: 'Dear {name}, your bill of ৳{amount} is due on {date}. Please pay to avoid service interruption. - {company}' },
  { id: 'payment_confirmation', label: 'Payment Confirmation', message: 'Dear {name}, payment of ৳{amount} received. New balance: ৳{balance}. Expires: {date}. Thank you! - {company}' },
  { id: 'expiry_warning', label: 'Expiry Warning', message: 'Dear {name}, your internet connection expires on {date}. Please recharge to continue service. - {company}' },
  { id: 'service_activation', label: 'Service Activation', message: 'Dear {name}, your internet service has been activated. Username: {username}, Plan: {plan}. Enjoy! - {company}' },
  { id: 'monthly_invoice', label: 'Monthly Invoice', message: 'Dear {name}, your invoice for {month} is ৳{amount}. Due date: {date}. Pay via bKash/Nagad to {pay_number}. - {company}' },
  { id: 'service_suspended', label: 'Service Suspended', message: 'Dear {name}, your internet service has been suspended due to non-payment. Please contact us to restore. - {company}' },
];

const defaultConfig: SmsGatewayConfig = {
  provider: '',
  api_url: '',
  api_key: '',
  sender_id: '',
  bill_reminder: true,
  bill_reminder_days: 3,
  bill_reminder_template: defaultTemplates[0].message,
  payment_confirmation: true,
  payment_confirmation_template: defaultTemplates[1].message,
  expiry_warning: true,
  expiry_warning_days: 1,
  expiry_warning_template: defaultTemplates[2].message,
  service_activation: false,
  service_activation_template: defaultTemplates[3].message,
};

const phpBalanceCode = `<?php
function get_balance() {
    $url = "http://bulksmsbd.net/api/getBalanceApi";
    $api_key = "YOUR_API_KEY_HERE";

    $data = [
        "api_key" => $api_key
    ];

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    $response = curl_exec($ch);
    curl_close($ch);

    return $response;
}

// Usage
echo get_balance();
?>`;

export function SmsGatewaySettings() {
  const queryClient = useQueryClient();
  const [config, setConfig] = useState<SmsGatewayConfig>(defaultConfig);
  const [testPhone, setTestPhone] = useState('');
  const [copied, setCopied] = useState(false);
  const { data: smsBalanceData, isLoading: balanceLoading, refetch: refetchBalance } = useSmsBalance();

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
            <div className="space-y-5">
              {/* Bill Reminder */}
              <div className="space-y-2 p-3 rounded-lg border border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Bill Reminder</Label>
                    <p className="text-sm text-muted-foreground">Send bill reminder SMS before expiry</p>
                  </div>
                  <Switch
                    checked={config.bill_reminder}
                    onCheckedChange={(checked) => setConfig({ ...config, bill_reminder: checked })}
                  />
                </div>
                {config.bill_reminder && (
                  <div className="space-y-3 pt-2 border-t border-border">
                    <div className="space-y-1">
                      <Label className="text-xs">Days Before Expiry</Label>
                      <Input
                        type="number"
                        min="1"
                        max="30"
                        className="bg-secondary border-border w-24"
                        value={config.bill_reminder_days || 3}
                        onChange={(e) => setConfig({ ...config, bill_reminder_days: parseInt(e.target.value) || 3 })}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Template</Label>
                      <Select
                        value={defaultTemplates.find(t => t.message === config.bill_reminder_template)?.id || 'custom'}
                        onValueChange={(val) => {
                          const tpl = defaultTemplates.find(t => t.id === val);
                          if (tpl) setConfig({ ...config, bill_reminder_template: tpl.message });
                        }}
                      >
                        <SelectTrigger className="bg-secondary border-border">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {defaultTemplates.map(t => (
                            <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Textarea
                        className="bg-secondary border-border text-xs mt-1"
                        rows={2}
                        value={config.bill_reminder_template || ''}
                        onChange={(e) => setConfig({ ...config, bill_reminder_template: e.target.value })}
                        placeholder="Use {name}, {amount}, {date}, {company}"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Payment Confirmation */}
              <div className="space-y-2 p-3 rounded-lg border border-border">
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
                {config.payment_confirmation && (
                  <div className="space-y-2 pt-2 border-t border-border">
                    <Label className="text-xs">Template</Label>
                    <Select
                      value={defaultTemplates.find(t => t.message === config.payment_confirmation_template)?.id || 'custom'}
                      onValueChange={(val) => {
                        const tpl = defaultTemplates.find(t => t.id === val);
                        if (tpl) setConfig({ ...config, payment_confirmation_template: tpl.message });
                      }}
                    >
                      <SelectTrigger className="bg-secondary border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {defaultTemplates.map(t => (
                          <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Textarea
                      className="bg-secondary border-border text-xs"
                      rows={2}
                      value={config.payment_confirmation_template || ''}
                      onChange={(e) => setConfig({ ...config, payment_confirmation_template: e.target.value })}
                      placeholder="Use {name}, {amount}, {balance}, {date}, {company}"
                    />
                  </div>
                )}
              </div>

              {/* Expiry Warning */}
              <div className="space-y-2 p-3 rounded-lg border border-border">
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
                {config.expiry_warning && (
                  <div className="space-y-3 pt-2 border-t border-border">
                    <div className="space-y-1">
                      <Label className="text-xs">Days Before Expiry</Label>
                      <Input
                        type="number"
                        min="1"
                        max="30"
                        className="bg-secondary border-border w-24"
                        value={config.expiry_warning_days || 1}
                        onChange={(e) => setConfig({ ...config, expiry_warning_days: parseInt(e.target.value) || 1 })}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Template</Label>
                      <Select
                        value={defaultTemplates.find(t => t.message === config.expiry_warning_template)?.id || 'custom'}
                        onValueChange={(val) => {
                          const tpl = defaultTemplates.find(t => t.id === val);
                          if (tpl) setConfig({ ...config, expiry_warning_template: tpl.message });
                        }}
                      >
                        <SelectTrigger className="bg-secondary border-border">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {defaultTemplates.map(t => (
                            <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Textarea
                        className="bg-secondary border-border text-xs mt-1"
                        rows={2}
                        value={config.expiry_warning_template || ''}
                        onChange={(e) => setConfig({ ...config, expiry_warning_template: e.target.value })}
                        placeholder="Use {name}, {date}, {company}"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Service Activation */}
              <div className="space-y-2 p-3 rounded-lg border border-border">
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
                {config.service_activation && (
                  <div className="space-y-2 pt-2 border-t border-border">
                    <Label className="text-xs">Template</Label>
                    <Select
                      value={defaultTemplates.find(t => t.message === config.service_activation_template)?.id || 'custom'}
                      onValueChange={(val) => {
                        const tpl = defaultTemplates.find(t => t.id === val);
                        if (tpl) setConfig({ ...config, service_activation_template: tpl.message });
                      }}
                    >
                      <SelectTrigger className="bg-secondary border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {defaultTemplates.map(t => (
                          <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Textarea
                      className="bg-secondary border-border text-xs"
                      rows={2}
                      value={config.service_activation_template || ''}
                      onChange={(e) => setConfig({ ...config, service_activation_template: e.target.value })}
                      placeholder="Use {name}, {username}, {plan}, {company}"
                    />
                  </div>
                )}
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
