import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, Save, Loader2, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export function SuperAdminAccountSettings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [newEmail, setNewEmail] = useState('');
  const [newLoginUserId, setNewLoginUserId] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Fetch current software_user record for the logged-in user
  const { data: softwareUser } = useQuery({
    queryKey: ['software-user-self', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('software_users')
        .select('*')
        .eq('user_id', user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Check if user is super_admin
  const isSuperAdmin = softwareUser?.role === 'super_admin';

  // Update email mutation
  const updateEmailMutation = useMutation({
    mutationFn: async () => {
      if (!newEmail.trim()) throw new Error('Email is required');

      // Update auth email
      const { error: authError } = await supabase.auth.updateUser({ email: newEmail });
      if (authError) throw authError;

      // Update software_users table
      const { error: dbError } = await supabase
        .from('software_users')
        .update({ email: newEmail })
        .eq('user_id', user!.id);
      if (dbError) throw dbError;
    },
    onSuccess: () => {
      toast.success('Email updated! Check your new email for confirmation.');
      setNewEmail('');
      queryClient.invalidateQueries({ queryKey: ['software-user-self'] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to update email: ${error.message}`);
    },
  });

  // Update login User ID mutation
  const updateLoginIdMutation = useMutation({
    mutationFn: async () => {
      if (!newLoginUserId.trim()) throw new Error('User ID is required');

      // Check uniqueness
      const { data: existing } = await supabase
        .from('software_users')
        .select('id')
        .eq('login_user_id', newLoginUserId)
        .neq('user_id', user!.id)
        .maybeSingle();

      if (existing) throw new Error('This User ID is already taken');

      const { error } = await supabase
        .from('software_users')
        .update({ login_user_id: newLoginUserId })
        .eq('user_id', user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Login User ID updated successfully!');
      setNewLoginUserId('');
      queryClient.invalidateQueries({ queryKey: ['software-user-self'] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to update User ID: ${error.message}`);
    },
  });

  // Update password mutation
  const updatePasswordMutation = useMutation({
    mutationFn: async () => {
      if (!newPassword.trim()) throw new Error('New password is required');
      if (newPassword.length < 6) throw new Error('Password must be at least 6 characters');
      if (newPassword !== confirmPassword) throw new Error('Passwords do not match');

      // Verify current password by re-authenticating
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user!.email!,
        password: currentPassword,
      });
      if (signInError) throw new Error('Current password is incorrect');

      // Update password
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update password: ${error.message}`);
    },
  });

  if (!isSuperAdmin) {
    return null;
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          Super Admin Account Settings
        </CardTitle>
        <CardDescription>
          Change your admin email, login User ID, and password. Only super admins can access this section.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Email Change */}
          <Card className="bg-secondary border-border">
            <CardContent className="pt-6 space-y-4">
              <h4 className="font-semibold text-sm">Change Email</h4>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Current Email</Label>
                <Input
                  value={user?.email || ''}
                  disabled
                  className="bg-muted border-border text-muted-foreground"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">New Email</Label>
                <Input
                  type="email"
                  placeholder="Enter new email"
                  className="bg-background border-border"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                />
              </div>
              <Button
                size="sm"
                className="w-full bg-gradient-primary text-primary-foreground"
                onClick={() => updateEmailMutation.mutate()}
                disabled={updateEmailMutation.isPending || !newEmail.trim()}
              >
                {updateEmailMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Update Email
              </Button>
            </CardContent>
          </Card>

          {/* Login User ID Change */}
          <Card className="bg-secondary border-border">
            <CardContent className="pt-6 space-y-4">
              <h4 className="font-semibold text-sm">Change Login User ID</h4>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Current User ID</Label>
                <Input
                  value={softwareUser?.login_user_id || 'Not set'}
                  disabled
                  className="bg-muted border-border text-muted-foreground"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">New User ID</Label>
                <Input
                  type="text"
                  placeholder="Enter new User ID"
                  className="bg-background border-border"
                  value={newLoginUserId}
                  onChange={(e) => setNewLoginUserId(e.target.value)}
                />
              </div>
              <Button
                size="sm"
                className="w-full bg-gradient-primary text-primary-foreground"
                onClick={() => updateLoginIdMutation.mutate()}
                disabled={updateLoginIdMutation.isPending || !newLoginUserId.trim()}
              >
                {updateLoginIdMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Update User ID
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Password Change */}
        <Card className="bg-secondary border-border">
          <CardContent className="pt-6 space-y-4">
            <h4 className="font-semibold text-sm">Change Password</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label className="text-xs">Current Password</Label>
                <div className="relative">
                  <Input
                    type={showCurrentPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="bg-background border-border pr-10"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">New Password</Label>
                <div className="relative">
                  <Input
                    type={showNewPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="bg-background border-border pr-10"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Confirm Password</Label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  className="bg-background border-border"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>
            <Button
              size="sm"
              className="bg-gradient-primary text-primary-foreground"
              onClick={() => updatePasswordMutation.mutate()}
              disabled={updatePasswordMutation.isPending || !currentPassword || !newPassword || !confirmPassword}
            >
              {updatePasswordMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Update Password
            </Button>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
}
