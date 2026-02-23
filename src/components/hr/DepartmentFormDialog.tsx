import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Department, DepartmentInsert } from '@/hooks/useDepartments';
import { Employee } from '@/hooks/useEmployees';

interface DepartmentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  department?: Department | null;
  employees: Employee[];
  onSubmit: (data: DepartmentInsert) => void;
  isLoading?: boolean;
}

export function DepartmentFormDialog({
  open,
  onOpenChange,
  department,
  employees,
  onSubmit,
  isLoading,
}: DepartmentFormDialogProps) {
  const [formData, setFormData] = useState<DepartmentInsert>({
    name: '',
    code: '',
    description: '',
    manager_id: null,
    is_active: true,
  });

  useEffect(() => {
    if (department) {
      setFormData({
        name: department.name,
        code: department.code || '',
        description: department.description || '',
        manager_id: department.manager_id,
        is_active: department.is_active,
      });
    } else {
      setFormData({
        name: '',
        code: '',
        description: '',
        manager_id: null,
        is_active: true,
      });
    }
  }, [department, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{department ? 'Edit Department' : 'Add New Department'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Department Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="Engineering"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="code">Department Code</Label>
            <Input
              id="code"
              value={formData.code || ''}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              placeholder="ENG"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Department description"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="manager">Department Manager</Label>
            <Select
              value={formData.manager_id || 'none'}
              onValueChange={(value) => setFormData({ ...formData, manager_id: value === 'none' ? null : value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select manager" />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                <SelectItem value="none">No Manager</SelectItem>
                {employees.filter(e => e.status === 'active').map((emp) => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.full_name} ({emp.employee_id})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : department ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
