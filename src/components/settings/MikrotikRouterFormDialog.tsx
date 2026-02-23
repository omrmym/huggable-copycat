import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Server, Shield, Network } from 'lucide-react';

export interface RouterFormData {
  name: string;
  host: string;
  port: number;
  username: string;
  password: string;
  description: string;
  connectionMode: 'api' | 'rest';
  useSsl: boolean;
}

interface MikrotikRouter {
  id: string;
  name: string;
  host: string;
  port: number | null;
  username: string;
  password: string;
  description: string | null;
  connection_mode: string;
  use_ssl: boolean;
}

interface MikrotikRouterFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  router: MikrotikRouter | null;
  onSubmit: (data: RouterFormData) => void;
  isLoading: boolean;
}

export function MikrotikRouterFormDialog({
  open,
  onOpenChange,
  router,
  onSubmit,
  isLoading,
}: MikrotikRouterFormDialogProps) {
  const [formData, setFormData] = useState<RouterFormData>({
    name: '',
    host: '',
    port: 8728,
    username: '',
    password: '',
    description: '',
    connectionMode: 'api',
    useSsl: false,
  });

  // Reset form when dialog opens/closes or router changes
  useEffect(() => {
    if (open && router) {
      setFormData({
        name: router.name,
        host: router.host,
        port: router.port || 8728,
        username: router.username,
        password: router.password,
        description: router.description || '',
        connectionMode: (router.connection_mode as 'api' | 'rest') || 'api',
        useSsl: router.use_ssl,
      });
    } else if (open) {
      setFormData({
        name: '',
        host: '',
        port: 8728,
        username: '',
        password: '',
        description: '',
        connectionMode: 'api',
        useSsl: false,
      });
    }
  }, [open, router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.host || !formData.username) {
      return;
    }
    onSubmit(formData);
  };

  const handleSslChange = (checked: boolean) => {
    // Auto-suggest port based on SSL toggle
    let newPort = formData.port;
    if (checked && (formData.port === 8728 || formData.port === 0)) {
      newPort = 8729;
    } else if (!checked && formData.port === 8729) {
      newPort = 8728;
    }
    setFormData({ ...formData, useSsl: checked, port: newPort });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Server className="w-5 h-5 text-primary" />
            {router ? 'Edit Router' : 'Add New Router'}
          </DialogTitle>
          <DialogDescription>
            {router
              ? 'Update the MikroTik router configuration.'
              : 'Add a new MikroTik router to manage.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
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
            <Label htmlFor="name">Router Name *</Label>
            <Input
              id="name"
              placeholder="Main Router"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="host">Router IP / Hostname *</Label>
            <Input
              id="host"
              placeholder="192.168.88.1"
              value={formData.host}
              onChange={(e) => setFormData({ ...formData, host: e.target.value })}
              required
            />
          </div>

          {/* SSL Toggle */}
          <div className="flex items-center justify-between rounded-lg border border-border p-3 bg-muted/30">
            <div className="space-y-0.5">
              <Label className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" />
                Use SSL/TLS
              </Label>
              <p className="text-xs text-muted-foreground">
                Enable for encrypted connection (api-ssl service)
              </p>
            </div>
            <Switch
              checked={formData.useSsl}
              onCheckedChange={handleSslChange}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="port">API Port</Label>
            <div className="flex gap-2">
              <Input
                id="port"
                type="number"
                placeholder={formData.useSsl ? '8729' : '8728'}
                value={formData.port}
                onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) || 8728 })}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs whitespace-nowrap"
                onClick={() => setFormData({ 
                  ...formData, 
                  port: formData.useSsl ? 8729 : 8728 
                })}
              >
                Reset Default
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {formData.useSsl 
                ? 'Default: 8729 for API-SSL' 
                : 'Default: 8728 for API (plaintext)'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username *</Label>
              <Input
                id="username"
                placeholder="admin"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Main office router, handles all PPPoE connections..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !formData.host || !formData.username || !formData.name}
              className="bg-gradient-primary"
            >
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {router ? 'Update Router' : 'Add Router'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
