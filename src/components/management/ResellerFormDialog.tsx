import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Reseller, useCreateReseller, useUpdateReseller } from '@/hooks/useResellers';
import { useRoleDefinitions } from '@/hooks/useRoleDefinitions';

interface ResellerFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reseller?: Reseller | null;
}

export function ResellerFormDialog({ open, onOpenChange, reseller }: ResellerFormDialogProps) {
  const createReseller = useCreateReseller();
  const updateReseller = useUpdateReseller();
  const { data: roles } = useRoleDefinitions();
  const isEditing = !!reseller;

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    contact_person: '',
    phone: '',
    email: '',
    address: '',
    commission_rate: 0,
    login_user_id: '',
    login_password: '',
    role_id: '',
    is_active: true,
  });

  useEffect(() => {
    if (reseller) {
      setFormData({
        name: reseller.name,
        code: reseller.code || '',
        contact_person: reseller.contact_person || '',
        phone: reseller.phone || '',
        email: reseller.email || '',
        address: reseller.address || '',
        commission_rate: reseller.commission_rate || 0,
        login_user_id: reseller.login_user_id || '',
        login_password: reseller.login_password || '',
        role_id: reseller.role_id || '',
        is_active: reseller.is_active,
      });
    } else {
      setFormData({
        name: '',
        code: '',
        contact_person: '',
        phone: '',
        email: '',
        address: '',
        commission_rate: 0,
        login_user_id: '',
        login_password: '',
        role_id: '',
        is_active: true,
      });
    }
  }, [reseller, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const payload = {
      name: formData.name,
      code: formData.code || null,
      contact_person: formData.contact_person || null,
      phone: formData.phone || null,
      email: formData.email || null,
      address: formData.address || null,
      commission_rate: formData.commission_rate,
      login_user_id: formData.login_user_id || null,
      login_password: formData.login_password || null,
      role_id: formData.role_id || null,
      is_active: formData.is_active,
      balance: reseller?.balance ?? 0,
    };

    if (isEditing) {
      await updateReseller.mutateAsync({ id: reseller.id, ...payload });
    } else {
      await createReseller.mutateAsync(payload);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Reseller' : 'Add Reseller'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="code">Code</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contact_person">Contact Person</Label>
              <Input
                id="contact_person"
                value={formData.contact_person}
                onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="commission_rate">Commission Rate (%)</Label>
              <Input
                id="commission_rate"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={formData.commission_rate}
                onChange={(e) => setFormData({ ...formData, commission_rate: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role_id">Role</Label>
              <Select
                value={formData.role_id}
                onValueChange={(value) => setFormData({ ...formData, role_id: value })}
              >
                <SelectTrigger id="role_id">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {roles?.filter(role => role.is_active).map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="login_user_id">Login User ID</Label>
              <Input
                id="login_user_id"
                value={formData.login_user_id}
                onChange={(e) => setFormData({ ...formData, login_user_id: e.target.value })}
                placeholder="e.g., reseller01"
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

          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
            <Label htmlFor="is_active">Active</Label>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createReseller.isPending || updateReseller.isPending}>
              {isEditing ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
