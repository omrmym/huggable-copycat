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
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Loader2, Eye, EyeOff, User, Mail, Shield, Calendar, Clock, KeyRound } from 'lucide-react';
import { format } from 'date-fns';
import {
  SoftwareUser,
  AppRole,
  ROLE_LABELS,
  ROLE_DESCRIPTIONS,
  getRoleLabel,
  useUpdateSoftwareUser,
} from '@/hooks/useSoftwareUsers';
import { useRoleDefinitions } from '@/hooks/useRoleDefinitions';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useMutation } from '@tanstack/react-query';

interface SoftwareUserProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: SoftwareUser | null;
  canEdit: boolean;
  isSuperAdmin: boolean;
}

const BUILT_IN_ROLES: AppRole[] = ['super_admin', 'admin', 'manager', 'operator', 'viewer'];

const getRoleBadgeClass = (role: string) => {
  switch (role) {
    case 'super_admin':
      return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
    case 'admin':
      return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    case 'manager':
      return 'bg-green-500/20 text-green-400 border-green-500/30';
    case 'operator':
      return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    case 'viewer':
      return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    default:
      return '';
  }
};

export function SoftwareUserProfileDialog({
  open,
  onOpenChange,
  user,
  canEdit,
  isSuperAdmin,
}: SoftwareUserProfileDialogProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    full_name: '',
    login_user_id: '',
    role: 'viewer' as AppRole,
  });

  const [passwordForm, setPasswordForm] = useState({
    newPassword: '',
    confirmPassword: '',
  });

  const updateUser = useUpdateSoftwareUser();
  const { data: roleDefinitions = [] } = useRoleDefinitions();

  // Combine built-in roles with custom roles
  const allRoles = [
    ...BUILT_IN_ROLES.map(code => ({ code, name: ROLE_LABELS[code] || code, description: ROLE_DESCRIPTIONS[code] || '' })),
    ...roleDefinitions
      .filter(rd => rd.is_active && !BUILT_IN_ROLES.includes(rd.code))
      .map(rd => ({ code: rd.code, name: rd.name, description: rd.description || '' })),
  ];

  // Change password mutation
  const changePassword = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('No user selected');
      if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        throw new Error('Passwords do not match');
      }
      if (passwordForm.newPassword.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }

      // Only super_admin can change other users' passwords
      // For now, we'll use the admin API through an edge function if needed
      // For the current user, we can use supabase.auth.updateUser
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Password changed successfully!');
      setPasswordForm({ newPassword: '', confirmPassword: '' });
      setShowPasswordChange(false);
    },
    onError: (error: Error) => {
      toast.error(`Failed to change password: ${error.message}`);
    },
  });

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name,
        login_user_id: user.login_user_id || '',
        role: user.role,
      });
      setIsEditing(false);
      setShowPasswordChange(false);
      setPasswordForm({ newPassword: '', confirmPassword: '' });
    }
  }, [user, open]);

  const handleSave = async () => {
    if (!user) return;

    await updateUser.mutateAsync({
      id: user.id,
      full_name: formData.full_name,
      login_user_id: formData.login_user_id || null,
      role: formData.role,
    });

    setIsEditing(false);
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            Software User Profile
          </DialogTitle>
          <DialogDescription>
            {canEdit ? 'View and edit user details.' : 'View user details.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* User Info Header */}
          <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-8 h-8 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold">{user.full_name}</h3>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={getRoleBadgeClass(user.role)}>
                  {getRoleLabel(user.role, roleDefinitions)}
                </Badge>
                <Badge variant={user.is_active ? 'default' : 'destructive'} className={
                  user.is_active
                    ? 'bg-green-500/20 text-green-400 border-green-500/30'
                    : 'bg-red-500/20 text-red-400 border-red-500/30'
                }>
                  {user.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </div>
          </div>

          <Separator />

          {/* Editable Fields */}
          {isEditing ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit_full_name">Full Name *</Label>
                <Input
                  id="edit_full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="Enter full name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_login_user_id">User ID (for login)</Label>
                <Input
                  id="edit_login_user_id"
                  value={formData.login_user_id}
                  onChange={(e) => setFormData({ ...formData, login_user_id: e.target.value })}
                  placeholder="e.g., admin001"
                />
                <p className="text-xs text-muted-foreground">
                  Users can login with this ID instead of email.
                </p>
              </div>

              {isSuperAdmin && (
                <div className="space-y-2">
                  <Label htmlFor="edit_role">Role *</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value: AppRole) => setFormData({ ...formData, role: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      {allRoles.map((role) => (
                        <SelectItem key={role.code} value={role.code}>
                          <span className="font-medium">{role.name}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {allRoles.find(r => r.code === formData.role)?.description || ''}
                  </p>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                  disabled={updateUser.isPending}
                >
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={updateUser.isPending}>
                  {updateUser.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Read-only Details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="w-4 h-4" />
                    Full Name
                  </div>
                  <p className="font-medium">{user.full_name}</p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <KeyRound className="w-4 h-4" />
                    User ID
                  </div>
                  <p className="font-medium">
                    {user.login_user_id ? (
                      <code className="text-sm bg-muted px-2 py-0.5 rounded">{user.login_user_id}</code>
                    ) : (
                      <span className="text-muted-foreground">Not set</span>
                    )}
                  </p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="w-4 h-4" />
                    Email
                  </div>
                  <p className="font-medium">{user.email}</p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Shield className="w-4 h-4" />
                    Role
                  </div>
                  <Badge className={getRoleBadgeClass(user.role)}>
                    {getRoleLabel(user.role, roleDefinitions)}
                  </Badge>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    Created
                  </div>
                  <p className="font-medium">{format(new Date(user.created_at), 'MMM d, yyyy')}</p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    Last Login
                  </div>
                  <p className="font-medium">
                    {user.last_login_at
                      ? format(new Date(user.last_login_at), 'MMM d, yyyy HH:mm')
                      : 'Never'}
                  </p>
                </div>
              </div>

              {canEdit && (
                <Button onClick={() => setIsEditing(true)} variant="outline" className="w-full">
                  Edit Profile
                </Button>
              )}
            </div>
          )}

          {/* Password Change Section - Only for self */}
          {canEdit && !isEditing && (
            <>
              <Separator />
              
              {showPasswordChange ? (
                <div className="space-y-4">
                  <h4 className="font-medium flex items-center gap-2">
                    <KeyRound className="w-4 h-4" />
                    Change Password
                  </h4>
                  
                  <div className="space-y-2">
                    <Label htmlFor="new_password">New Password</Label>
                    <div className="relative">
                      <Input
                        id="new_password"
                        type={showPassword ? 'text' : 'password'}
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                        placeholder="••••••••"
                        minLength={6}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm_password">Confirm Password</Label>
                    <Input
                      id="confirm_password"
                      type={showPassword ? 'text' : 'password'}
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      placeholder="••••••••"
                      minLength={6}
                    />
                    <p className="text-xs text-muted-foreground">
                      Minimum 6 characters required.
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowPasswordChange(false);
                        setPasswordForm({ newPassword: '', confirmPassword: '' });
                      }}
                      disabled={changePassword.isPending}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={() => changePassword.mutate()}
                      disabled={changePassword.isPending || !passwordForm.newPassword || !passwordForm.confirmPassword}
                    >
                      {changePassword.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Changing...
                        </>
                      ) : (
                        'Change Password'
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => setShowPasswordChange(true)}
                  className="w-full"
                >
                  <KeyRound className="w-4 h-4 mr-2" />
                  Change Password
                </Button>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
