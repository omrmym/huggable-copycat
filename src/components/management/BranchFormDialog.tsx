import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Branch, useCreateBranch, useUpdateBranch } from '@/hooks/useBranches';
import { useResellers } from '@/hooks/useResellers';

interface BranchFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branch?: Branch | null;
}

export function BranchFormDialog({ open, onOpenChange, branch }: BranchFormDialogProps) {
  const createBranch = useCreateBranch();
  const updateBranch = useUpdateBranch();
  const { data: resellers } = useResellers();
  const isEditing = !!branch;

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    reseller_id: '',
    address: '',
    phone: '',
    manager_name: '',
    is_active: true,
  });

  useEffect(() => {
    if (branch) {
      setFormData({
        name: branch.name,
        code: branch.code || '',
        reseller_id: branch.reseller_id || '',
        address: branch.address || '',
        phone: branch.phone || '',
        manager_name: branch.manager_name || '',
        is_active: branch.is_active,
      });
    } else {
      setFormData({
        name: '',
        code: '',
        reseller_id: '',
        address: '',
        phone: '',
        manager_name: '',
        is_active: true,
      });
    }
  }, [branch, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const payload = {
      name: formData.name,
      code: formData.code || null,
      reseller_id: formData.reseller_id === 'none' ? null : formData.reseller_id || null,
      address: formData.address || null,
      phone: formData.phone || null,
      manager_name: formData.manager_name || null,
      is_active: formData.is_active,
    };

    if (isEditing) {
      await updateBranch.mutateAsync({ id: branch.id, ...payload });
    } else {
      await createBranch.mutateAsync(payload);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Branch' : 'Add Branch'}</DialogTitle>
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

          <div className="space-y-2">
            <Label htmlFor="reseller_id">Reseller</Label>
            <Select
              value={formData.reseller_id || 'none'}
              onValueChange={(value) => setFormData({ ...formData, reseller_id: value === 'none' ? '' : value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a reseller" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {resellers?.filter(r => r.is_active).map((reseller) => (
                  <SelectItem key={reseller.id} value={reseller.id}>
                    {reseller.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="manager_name">Manager Name</Label>
              <Input
                id="manager_name"
                value={formData.manager_name}
                onChange={(e) => setFormData({ ...formData, manager_name: e.target.value })}
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
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
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
            <Button type="submit" disabled={createBranch.isPending || updateBranch.isPending}>
              {isEditing ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
