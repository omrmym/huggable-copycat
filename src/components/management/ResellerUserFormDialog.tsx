import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useCreateResellerUser, useUpdateResellerUser, ResellerUser } from '@/hooks/useResellerUsers';
import { useResellers } from '@/hooks/useResellers';
import { Loader2 } from 'lucide-react';

interface ResellerUserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: ResellerUser | null;
}

export function ResellerUserFormDialog({ open, onOpenChange, user }: ResellerUserFormDialogProps) {
  const { data: resellers } = useResellers();
  const createUser = useCreateResellerUser();
  const updateUser = useUpdateResellerUser();
  
  const [formData, setFormData] = useState({
    reseller_id: '',
    full_name: '',
    email: '',
    phone: '',
    login_user_id: '',
    login_password: '',
    is_active: true,
  });

  useEffect(() => {
    if (user) {
      setFormData({
        reseller_id: user.reseller_id,
        full_name: user.full_name,
        email: user.email,
        phone: user.phone || '',
        login_user_id: user.login_user_id || '',
        login_password: user.login_password || '',
        is_active: user.is_active,
      });
    } else {
      setFormData({
        reseller_id: '',
        full_name: '',
        email: '',
        phone: '',
        login_user_id: '',
        login_password: '',
        is_active: true,
      });
    }
  }, [user, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const payload = {
      reseller_id: formData.reseller_id,
      full_name: formData.full_name,
      email: formData.email,
      phone: formData.phone || null,
      login_user_id: formData.login_user_id || null,
      login_password: formData.login_password || null,
      is_active: formData.is_active,
      user_id: null,
    };

    if (user) {
      await updateUser.mutateAsync({ id: user.id, ...payload });
    } else {
      await createUser.mutateAsync(payload);
    }
    onOpenChange(false);
  };

  const isLoading = createUser.isPending || updateUser.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{user ? 'Edit Reseller User' : 'Add Reseller User'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reseller_id">Reseller *</Label>
            <Select
              value={formData.reseller_id}
              onValueChange={(value) => setFormData({ ...formData, reseller_id: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a reseller" />
              </SelectTrigger>
              <SelectContent>
                {resellers?.filter(r => r.is_active).map((reseller) => (
                  <SelectItem key={reseller.id} value={reseller.id}>
                    {reseller.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="full_name">Full Name *</Label>
            <Input
              id="full_name"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="login_user_id">Login User ID</Label>
              <Input
                id="login_user_id"
                value={formData.login_user_id}
                onChange={(e) => setFormData({ ...formData, login_user_id: e.target.value })}
                placeholder="e.g., liton"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="login_password">Login Password</Label>
              <Input
                id="login_password"
                type="password"
                value={formData.login_password}
                onChange={(e) => setFormData({ ...formData, login_password: e.target.value })}
                placeholder="Enter password"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="is_active">Active</Label>
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !formData.reseller_id}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {user ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
