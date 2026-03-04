import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Users, Plus, Search, Shield } from 'lucide-react';
import { useSoftwareUsers, SoftwareUser, getRoleLabel } from '@/hooks/useSoftwareUsers';
import { useRoleDefinitions } from '@/hooks/useRoleDefinitions';
import { SoftwareUserTable } from './SoftwareUserTable';
import { SoftwareUserFormDialog } from './SoftwareUserFormDialog';
import { useAuth } from '@/contexts/AuthContext';

export function SoftwareUserManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<SoftwareUser | null>(null);

  const { user: authUser } = useAuth();
  const { data: users = [], isLoading } = useSoftwareUsers();
  const { data: roleDefinitions = [] } = useRoleDefinitions();

  // Find current logged-in user's software_user record
  const currentSoftwareUser = users.find((u) => u.user_id === authUser?.id) || null;

  const filteredUsers = users.filter(
    (user) =>
      user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getRoleLabel(user.role, roleDefinitions).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddUser = () => {
    setSelectedUser(null);
    setDialogOpen(true);
  };
  // Stats
  const activeUsers = users.filter((u) => u.is_active).length;
  const adminCount = users.filter((u) => u.role === 'super_admin' || u.role === 'admin').length;

  // Only super_admin can add new users
  const canAddUsers = currentSoftwareUser?.role === 'super_admin';

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold">{users.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-accent/50">
                <Users className="h-6 w-6 text-accent-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Users</p>
                <p className="text-2xl font-bold">{activeUsers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-secondary">
                <Shield className="h-6 w-6 text-secondary-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Admins</p>
                <p className="text-2xl font-bold">{adminCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Management Card */}
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Software User Management
              </CardTitle>
              <CardDescription>
                Manage admin panel users and their role-based permissions.
              </CardDescription>
            </div>
            {canAddUsers && (
              <Button onClick={handleAddUser} className="w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                Add User
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Table */}
          <SoftwareUserTable
            users={filteredUsers}
            isLoading={isLoading}
            currentSoftwareUser={currentSoftwareUser}
          />
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <SoftwareUserFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        user={selectedUser}
      />
    </div>
  );
}
