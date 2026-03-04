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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import {
  SoftwareUser,
  AppRole,
  ROLE_LABELS,
  ROLE_DESCRIPTIONS,
  useCreateSoftwareUser,
  useUpdateSoftwareUser,
} from '@/hooks/useSoftwareUsers';

interface SoftwareUserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: SoftwareUser | null;
}

const ROLES: AppRole[] = ['super_admin', 'admin', 'manager', 'operator', 'viewer'];

export function SoftwareUserFormDialog({
  open,
  onOpenChange,
  user,
}: SoftwareUserFormDialogProps) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    login_user_id: '',
    role: 'viewer' as AppRole,
  });
  const [showPassword, setShowPassword] = useState(false);

  const createUser = useCreateSoftwareUser();
  const updateUser = useUpdateSoftwareUser();
  const isEditing = !!user;

  useEffect(() => {
    if (user) {
      setFormData({
        email: user.email,
        password: '',
        full_name: user.full_name,
        login_user_id: user.login_user_id || '',
        role: user.role,
      });
    } else {
      setFormData({
        email: '',
        password: '',
        full_name: '',
        login_user_id: '',
        role: 'viewer',
      });
    }
  }, [user, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isEditing && user) {
      await updateUser.mutateAsync({
        id: user.id,
        full_name: formData.full_name,
        login_user_id: formData.login_user_id || null,
        role: formData.role,
      });
    } else {
      await createUser.mutateAsync({
        email: formData.email,
        password: formData.password,
        full_name: formData.full_name,
        login_user_id: formData.login_user_id || undefined,
        role: formData.role,
      });
    }

    onOpenChange(false);
  };

  const isPending = createUser.isPending || updateUser.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Software User' : 'Add Software User'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update user details and permissions.'
              : 'Create a new user with access to the admin panel.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">Full Name *</Label>
            <Input
              id="full_name"
              value={formData.full_name}
              onChange={(e) =>
                setFormData({ ...formData, full_name: e.target.value })
              }
              placeholder="Enter full name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              placeholder="user@example.com"
              required
              disabled={isEditing}
            />
            {isEditing && (
              <p className="text-xs text-muted-foreground">
                Email cannot be changed after creation.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="login_user_id">User ID (for login)</Label>
            <Input
              id="login_user_id"
              type="text"
              value={formData.login_user_id}
              onChange={(e) =>
                setFormData({ ...formData, login_user_id: e.target.value })
              }
              placeholder="e.g., admin001"
            />
            <p className="text-xs text-muted-foreground">
              Optional. Users can login with this ID instead of email.
            </p>
          </div>

          {!isEditing && (
            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Minimum 6 characters required.
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="role">Role *</Label>
            <Select
              value={formData.role}
              onValueChange={(value: AppRole) =>
                setFormData({ ...formData, role: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((role) => (
                  <SelectItem key={role} value={role}>
                    <div className="flex flex-col">
                      <span className="font-medium">{ROLE_LABELS[role]}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {ROLE_DESCRIPTIONS[formData.role]}
            </p>
          </div>

          <DialogFooter>
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
                'Update User'
              ) : (
                'Create User'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
