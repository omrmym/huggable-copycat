import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { CreditCard, Save, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Json } from '@/integrations/supabase/types';
import { SecretField } from './SecretField';

interface PaymentGatewayConfig {
  bkash_enabled: boolean;
  bkash_sandbox: boolean;
  bkash_app_key: string;
  bkash_app_secret: string;
  bkash_username: string;
  bkash_password: string;
  nagad_enabled: boolean;
  nagad_merchant_id: string;
  nagad_api_key: string;
  ssl_enabled: boolean;
  ssl_store_id: string;
  ssl_store_password: string;
}

const defaultConfig: PaymentGatewayConfig = {
  bkash_enabled: false,
  bkash_sandbox: true,
  bkash_app_key: '',
  bkash_app_secret: '',
  bkash_username: '',
  bkash_password: '',
  nagad_enabled: false,
  nagad_merchant_id: '',
  nagad_api_key: '',
  ssl_enabled: false,
  ssl_store_id: '',
  ssl_store_password: '',
};

export function PaymentGatewaySettings() {
  const queryClient = useQueryClient();
  const [config, setConfig] = useState<PaymentGatewayConfig>(defaultConfig);

  const { data: savedConfig, isLoading } = useQuery({
    queryKey: ['app-settings', 'payment_gateway'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('app_settings')
        .select('*')
        .eq('key', 'payment_gateway')
        .maybeSingle();

      if (error) throw error;
      if (!data) return defaultConfig;
      return data.value as unknown as PaymentGatewayConfig;
    },
  });

  useEffect(() => {
    if (savedConfig) {
      setConfig(savedConfig);
    }
  }, [savedConfig]);

  const saveMutation = useMutation({
    mutationFn: async (settings: PaymentGatewayConfig) => {
      const { data: existing } = await supabase
        .from('app_settings')
        .select('id')
        .eq('key', 'payment_gateway')
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('app_settings')
          .update({ value: settings as unknown as Json })
          .eq('key', 'payment_gateway');
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('app_settings')
          .insert({
            key: 'payment_gateway',
            value: settings as unknown as Json,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app-settings', 'payment_gateway'] });
      toast.success('Payment settings saved successfully!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to save payment settings: ${error.message}`);
    },
  });

  const handleSave = () => {
    saveMutation.mutate(config);
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
          <CreditCard className="w-5 h-5 text-primary" />
          Payment Gateway Settings
        </CardTitle>
        <CardDescription>
          Configure payment gateways and billing preferences.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-secondary border-border">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-lg bg-pink-500/20 flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-pink-500" />
                </div>
                <div>
                  <h4 className="font-semibold">bKash</h4>
                  <p className="text-xs text-muted-foreground">Mobile Payment Gateway</p>
                </div>
              </div>
              <div className="space-y-3">
                <SecretField
                  label="App Key"
                  value={config.bkash_app_key}
                  onChange={(v) => setConfig({ ...config, bkash_app_key: v })}
                />
                <SecretField
                  label="App Secret"
                  value={config.bkash_app_secret}
                  onChange={(v) => setConfig({ ...config, bkash_app_secret: v })}
                />
                <div className="space-y-1">
                  <Label className="text-xs">Username</Label>
                  <Input
                    type="text"
                    placeholder="Enter bKash Username"
                    className="bg-background border-border"
                    value={config.bkash_username}
                    onChange={(e) => setConfig({ ...config, bkash_username: e.target.value })}
                  />
                </div>
                <SecretField
                  label="Password"
                  value={config.bkash_password}
                  onChange={(v) => setConfig({ ...config, bkash_password: v })}
                />
                <div className="flex items-center justify-between pt-2">
                  <Label className="text-sm">Enable bKash</Label>
                  <Switch
                    checked={config.bkash_enabled}
                    onCheckedChange={(checked) => setConfig({ ...config, bkash_enabled: checked })}
                  />
                </div>
                <div className="flex items-center justify-between pt-1">
                  <Label className="text-sm">Sandbox Mode</Label>
                  <Switch
                    checked={config.bkash_sandbox}
                    onCheckedChange={(checked) => setConfig({ ...config, bkash_sandbox: checked })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-secondary border-border">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-lg bg-orange-500/20 flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-orange-500" />
                </div>
                <div>
                  <h4 className="font-semibold">Nagad</h4>
                  <p className="text-xs text-muted-foreground">Mobile Payment Gateway</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs">Merchant ID</Label>
                  <Input
                    type="text"
                    placeholder="Enter Merchant ID"
                    className="bg-background border-border"
                    value={config.nagad_merchant_id}
                    onChange={(e) => setConfig({ ...config, nagad_merchant_id: e.target.value })}
                  />
                </div>
                <SecretField
                  label="API Key"
                  value={config.nagad_api_key}
                  onChange={(v) => setConfig({ ...config, nagad_api_key: v })}
                />
                <div className="flex items-center justify-between pt-2">
                  <Label className="text-sm">Enable Nagad</Label>
                  <Switch
                    checked={config.nagad_enabled}
                    onCheckedChange={(checked) => setConfig({ ...config, nagad_enabled: checked })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-secondary border-border">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold">SSLCommerz</h4>
                  <p className="text-xs text-muted-foreground">Payment Gateway</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs">Store ID</Label>
                  <Input
                    type="text"
                    placeholder="Enter Store ID"
                    className="bg-background border-border"
                    value={config.ssl_store_id}
                    onChange={(e) => setConfig({ ...config, ssl_store_id: e.target.value })}
                  />
                </div>
                <SecretField
                  label="Store Password"
                  value={config.ssl_store_password}
                  onChange={(v) => setConfig({ ...config, ssl_store_password: v })}
                />
                <div className="flex items-center justify-between pt-2">
                  <Label className="text-sm">Enable SSLCommerz</Label>
                  <Switch
                    checked={config.ssl_enabled}
                    onCheckedChange={(checked) => setConfig({ ...config, ssl_enabled: checked })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
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
            Save Payment Settings
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
