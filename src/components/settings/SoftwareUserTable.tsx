import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { MoreHorizontal, Trash2, UserCheck, UserX, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import {
  SoftwareUser,
  ROLE_LABELS,
  getRoleLabel,
  useDeleteSoftwareUser,
  useToggleSoftwareUserStatus,
} from '@/hooks/useSoftwareUsers';
import { useRoleDefinitions } from '@/hooks/useRoleDefinitions';
import { useAuth } from '@/contexts/AuthContext';
import { SoftwareUserProfileDialog } from './SoftwareUserProfileDialog';

interface SoftwareUserTableProps {
  users: SoftwareUser[];
  isLoading: boolean;
  currentSoftwareUser?: SoftwareUser | null;
}

const getRoleBadgeVariant = (role: string) => {
  switch (role) {
    case 'super_admin':
      return 'default';
    case 'admin':
      return 'default';
    case 'manager':
      return 'secondary';
    case 'operator':
      return 'secondary';
    case 'viewer':
      return 'outline';
    default:
      return 'outline';
  }
};

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

export function SoftwareUserTable({ users, isLoading, currentSoftwareUser }: SoftwareUserTableProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<SoftwareUser | null>(null);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<SoftwareUser | null>(null);
  const { user: authUser } = useAuth();

  const deleteUser = useDeleteSoftwareUser();
  const toggleStatus = useToggleSoftwareUserStatus();
  const { data: roleDefinitions = [] } = useRoleDefinitions();

  // Check if current user can edit a specific software user
  // Only the user themselves or a super_admin can edit
  const canEditUser = (targetUser: SoftwareUser): boolean => {
    if (!currentSoftwareUser || !authUser) return false;
    
    // User can always edit themselves
    if (targetUser.user_id === authUser.id) return true;
    
    // Super admin can edit anyone
    if (currentSoftwareUser.role === 'super_admin') return true;
    
    return false;
  };

  const handleRowClick = (user: SoftwareUser) => {
    setSelectedUser(user);
    setProfileDialogOpen(true);
  };

  const handleDelete = (user: SoftwareUser) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (userToDelete) {
      deleteUser.mutate(userToDelete.id);
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    }
  };

  const handleToggleStatus = (user: SoftwareUser) => {
    toggleStatus.mutate({ id: user.id, is_active: !user.is_active });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No software users found. Click "Add User" to create one.
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>User ID</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Rule</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Login</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-[80px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow 
                key={user.id} 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleRowClick(user)}
              >
                <TableCell className="font-medium">{user.full_name}</TableCell>
                <TableCell>
                  {user.login_user_id ? (
                    <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                      {user.login_user_id}
                    </code>
                  ) : (
                    <span className="text-muted-foreground text-xs">—</span>
                  )}
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Badge
                    variant={getRoleBadgeVariant(user.role)}
                    className={getRoleBadgeClass(user.role)}
                  >
                    {getRoleLabel(user.role, roleDefinitions)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={user.is_active ? 'default' : 'destructive'}
                    className={
                      user.is_active
                        ? 'bg-green-500/20 text-green-400 border-green-500/30'
                        : 'bg-red-500/20 text-red-400 border-red-500/30'
                    }
                  >
                    {user.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell>
                  {user.last_login_at
                    ? format(new Date(user.last_login_at), 'MMM d, yyyy HH:mm')
                    : 'Never'}
                </TableCell>
                <TableCell>
                  {format(new Date(user.created_at), 'MMM d, yyyy')}
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  {currentSoftwareUser?.role === 'super_admin' && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleToggleStatus(user)}>
                          {user.is_active ? (
                            <>
                              <UserX className="mr-2 h-4 w-4" />
                              Deactivate
                            </>
                          ) : (
                            <>
                              <UserCheck className="mr-2 h-4 w-4" />
                              Activate
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(user)}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Software User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{userToDelete?.full_name}"? This action
              cannot be undone and will remove their access to the admin panel.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Profile Dialog */}
      <SoftwareUserProfileDialog
        open={profileDialogOpen}
        onOpenChange={setProfileDialogOpen}
        user={selectedUser}
        canEdit={selectedUser ? canEditUser(selectedUser) : false}
        isSuperAdmin={currentSoftwareUser?.role === 'super_admin'}
      />
    </>
  );
}
