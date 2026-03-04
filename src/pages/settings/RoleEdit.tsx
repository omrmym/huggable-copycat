import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Loader2, Shield, Lock } from 'lucide-react';
import {
  useRoleDefinitions,
  useCreateRoleDefinition,
  useUpdateRoleDefinition,
} from '@/hooks/useRoleDefinitions';
import { PermissionsEditor, ALL_PERMISSIONS } from '@/components/settings/PermissionsEditor';
import { RoleSettingsEditor, type RoleSettings } from '@/components/settings/RoleSettingsEditor';
import { Skeleton } from '@/components/ui/skeleton';

const DEFAULT_SETTINGS: RoleSettings = {
  max_grace_days: 5,
};

export default function RoleEdit() {
  const { roleId } = useParams();
  const navigate = useNavigate();
  const isEditing = roleId && roleId !== 'new';

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    permissions: [] as string[],
    settings: { ...DEFAULT_SETTINGS } as RoleSettings,
  });

  const { data: roles = [], isLoading } = useRoleDefinitions();
  const createRole = useCreateRoleDefinition();
  const updateRole = useUpdateRoleDefinition();

  const role = isEditing ? roles.find(r => r.id === roleId) : null;
  const isSystemRole = role?.is_system;

  useEffect(() => {
    if (role) {
      // Parse permissions - can be array of strings or object with settings
      let permissions: string[] = [];
      let settings: RoleSettings = { ...DEFAULT_SETTINGS };

      if (role.permissions) {
        const perms = role.permissions as unknown;
        
        if (Array.isArray(perms)) {
          // Legacy format: array of permission strings
          permissions = perms as string[];
        } else if (typeof perms === 'object' && perms !== null) {
          // New format: object with permissions array and settings
          const permObj = perms as { permissions?: string[]; settings?: Partial<RoleSettings> };
          permissions = permObj.permissions || [];
          settings = { ...DEFAULT_SETTINGS, ...permObj.settings };
        }
      }

      setFormData({
        code: role.code,
        name: role.name,
        description: role.description || '',
        permissions,
        settings,
      });
    }
  }, [role]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Combine permissions and settings into the new format
    const permissionsData = {
      permissions: formData.permissions,
      settings: formData.settings,
    };

    try {
      if (isEditing && role) {
        await updateRole.mutateAsync({
          id: role.id,
          name: formData.name,
          description: formData.description || undefined,
          permissions: permissionsData as unknown as string[],
        });
      } else {
        await createRole.mutateAsync({
          code: formData.code,
          name: formData.name,
          description: formData.description || undefined,
          permissions: permissionsData as unknown as string[],
        });
      }
      navigate('/settings', { state: { tab: 'roles' } });
    } catch (error) {
      // Error handled by mutation
    }
  };

  const isPending = createRole.isPending || updateRole.isPending;
  const effectivePermissions = isSystemRole ? ALL_PERMISSIONS : formData.permissions;

  if (isLoading && isEditing) {
    return (
    <DashboardLayout title={isEditing ? 'Edit Rule' : 'Create Rule'}>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <Card className="bg-card border-border">
            <CardHeader>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-72" />
            </CardHeader>
            <CardContent className="space-y-6">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-96 w-full" />
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  if (isEditing && !role && !isLoading) {
    return (
      <DashboardLayout title="Rule Not Found">
        <div className="flex flex-col items-center justify-center py-12">
          <Shield className="h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Rule Not Found</h2>
          <p className="text-muted-foreground mb-4">The rule you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/settings')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Settings
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={isEditing ? 'Edit Rule' : 'Create Rule'}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/settings')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              {isEditing ? 'Edit Rule' : 'Create New Rule'}
            </h1>
            <p className="text-muted-foreground">
              {isEditing
                ? 'Update rule details and manage permissions'
                : 'Create a new rule with custom permissions'}
            </p>
          </div>
        </div>

        {/* System Role Warning */}
        {isSystemRole && (
          <Card className="border-amber-500/50 bg-amber-500/10">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Lock className="h-5 w-5 text-amber-500" />
                <div>
                  <p className="font-medium text-amber-600 dark:text-amber-400">System Rule</p>
                  <p className="text-sm text-muted-foreground">
                    This is a system rule with full permissions. Some fields cannot be modified.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <form onSubmit={handleSubmit}>
          {/* Role Name Input */}
          <div className="mb-6">
            <div className="flex items-center gap-4 max-w-md">
              <div className="flex-1 space-y-2">
                <Label htmlFor="name">Rule Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g., Sales Manager"
                  required
                  disabled={isSystemRole}
                  className="text-lg"
                />
              </div>
              {!isEditing && (
                <div className="flex-1 space-y-2">
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
                </div>
              )}
            </div>
          </div>

          {/* Permissions */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Permissions</CardTitle>
              <CardDescription>
                Select which features this role can access
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isSystemRole ? (
                <div className="p-4 rounded-md bg-accent border border-border">
                  <div className="flex items-center gap-2 mb-2">
                    <Lock className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Full Access</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    System rules have all permissions enabled by default and cannot be modified.
                  </p>
                </div>
              ) : (
                <PermissionsEditor
                  selectedPermissions={effectivePermissions}
                  onChange={(permissions) => setFormData({ ...formData, permissions })}
                  disabled={isPending}
                />
              )}
            </CardContent>
          </Card>

          {/* Role Settings */}
          {!isSystemRole && (
            <RoleSettingsEditor
              settings={formData.settings}
              onChange={(settings) => setFormData({ ...formData, settings })}
              disabled={isPending}
            />
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-4 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/settings')}
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
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
