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
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import {
  RoleDefinition,
  useCreateRoleDefinition,
  useUpdateRoleDefinition,
} from '@/hooks/useRoleDefinitions';
import { PermissionsEditor, ALL_PERMISSIONS } from './PermissionsEditor';

interface RoleFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role?: RoleDefinition | null;
}

export function RoleFormDialog({ open, onOpenChange, role }: RoleFormDialogProps) {
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    permissions: [] as string[],
  });

  const createRole = useCreateRoleDefinition();
  const updateRole = useUpdateRoleDefinition();
  const isEditing = !!role;

  useEffect(() => {
    if (role) {
      setFormData({
        code: role.code,
        name: role.name,
        description: role.description || '',
        permissions: role.permissions || [],
      });
    } else {
      setFormData({
        code: '',
        name: '',
        description: '',
        permissions: [],
      });
    }
  }, [role, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isEditing && role) {
      await updateRole.mutateAsync({
        id: role.id,
        name: formData.name,
        description: formData.description || undefined,
        permissions: formData.permissions,
      });
    } else {
      await createRole.mutateAsync({
        code: formData.code,
        name: formData.name,
        description: formData.description || undefined,
        permissions: formData.permissions,
      });
    }

    onOpenChange(false);
  };

  const isPending = createRole.isPending || updateRole.isPending;
  const isSystemRole = role?.is_system;

  // System roles (super_admin, admin) get all permissions by default
  const effectivePermissions = isSystemRole ? ALL_PERMISSIONS : formData.permissions;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto bg-card">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Rule' : 'Add New Rule'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update rule details and manage permissions.'
              : 'Create a new rule with custom permissions.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code">Rule Code *</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) =>
                  setFormData({ ...formData, code: e.target.value })
                }
                placeholder="e.g., sales_manager"
                required
                disabled={isEditing || isSystemRole}
              />
              {isEditing && (
                <p className="text-xs text-muted-foreground">
                  Rule code cannot be changed.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Display Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="e.g., Sales Manager"
                required
                disabled={isSystemRole}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Describe what this rule can do..."
              rows={2}
            />
          </div>

          {isSystemRole ? (
            <div className="p-3 rounded-md bg-accent border border-border">
              <p className="text-xs text-muted-foreground">
                This is a system rule with full permissions. Permissions cannot be modified.
              </p>
            </div>
          ) : (
            <PermissionsEditor
              selectedPermissions={effectivePermissions}
              onChange={(permissions) => setFormData({ ...formData, permissions })}
              disabled={isPending}
            />
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEditing ? 'Updating...' : 'Creating...'}
                </>
              ) : isEditing ? (
                'Update Rule'
              ) : (
                'Create Rule'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
