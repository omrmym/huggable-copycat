import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { 
  Server, 
  Plus, 
  MoreHorizontal, 
  Pencil, 
  Trash2, 
  Power, 
  PowerOff,
  Loader2,
  Check,
  X,
  Wifi,
  Shield,
} from 'lucide-react';
import { toast } from 'sonner';
import { MikrotikRouterFormDialog, type RouterFormData } from './MikrotikRouterFormDialog';

interface MikrotikRouter {
  id: string;
  name: string;
  host: string;
  port: number | null;
  username: string;
  password: string;
  description: string | null;
  is_active: boolean;
  connection_mode: string;
  use_ssl: boolean;
  created_at: string;
  updated_at: string;
}

export function MikrotikRouterManagement() {
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [editingRouter, setEditingRouter] = useState<MikrotikRouter | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [routerToDelete, setRouterToDelete] = useState<MikrotikRouter | null>(null);

  // Fetch all routers (including inactive)
  const { data: routers = [], isLoading } = useQuery({
    queryKey: ['all-mikrotik-routers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mikrotik_routers')
        .select('*')
        .order('name');

      if (error) throw error;
      return data as MikrotikRouter[];
    },
  });

  // Create router mutation
  const createRouter = useMutation({
    mutationFn: async (data: RouterFormData) => {
      const { error } = await supabase.from('mikrotik_routers').insert({
        name: data.name,
        host: data.host,
        port: data.port,
        username: data.username,
        password: data.password,
        description: data.description || null,
        connection_mode: data.connectionMode,
        use_ssl: data.useSsl,
        is_active: true,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-mikrotik-routers'] });
      queryClient.invalidateQueries({ queryKey: ['mikrotik-routers'] });
      toast.success('Router added successfully');
      setFormOpen(false);
    },
    onError: (error: Error) => {
      toast.error(`Failed to add router: ${error.message}`);
    },
  });

  // Update router mutation
  const updateRouter = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: RouterFormData }) => {
      const { error } = await supabase
        .from('mikrotik_routers')
        .update({
          name: data.name,
          host: data.host,
          port: data.port,
          username: data.username,
          password: data.password,
          description: data.description || null,
          connection_mode: data.connectionMode,
          use_ssl: data.useSsl,
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-mikrotik-routers'] });
      queryClient.invalidateQueries({ queryKey: ['mikrotik-routers'] });
      toast.success('Router updated successfully');
      setFormOpen(false);
      setEditingRouter(null);
    },
    onError: (error: Error) => {
      toast.error(`Failed to update router: ${error.message}`);
    },
  });

  // Toggle router active status
  const toggleActive = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('mikrotik_routers')
        .update({ is_active: isActive })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, { isActive }) => {
      queryClient.invalidateQueries({ queryKey: ['all-mikrotik-routers'] });
      queryClient.invalidateQueries({ queryKey: ['mikrotik-routers'] });
      toast.success(isActive ? 'Router activated' : 'Router deactivated');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update status: ${error.message}`);
    },
  });

  // Delete router mutation
  const deleteRouter = useMutation({
    mutationFn: async (id: string) => {
      // Check if any users are using this router
      const { data: usersCount } = await supabase
        .from('radius_users')
        .select('id', { count: 'exact', head: true })
        .eq('mikrotik_router_id', id);

      if (usersCount && (usersCount as unknown as { count: number }).count > 0) {
        throw new Error('Cannot delete router: Users are still assigned to this router');
      }

      const { error } = await supabase
        .from('mikrotik_routers')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-mikrotik-routers'] });
      queryClient.invalidateQueries({ queryKey: ['mikrotik-routers'] });
      toast.success('Router deleted successfully');
      setDeleteDialogOpen(false);
      setRouterToDelete(null);
    },
    onError: (error: Error) => {
      toast.error(error.message);
      setDeleteDialogOpen(false);
      setRouterToDelete(null);
    },
  });

  const handleEdit = (router: MikrotikRouter) => {
    setEditingRouter(router);
    setFormOpen(true);
  };

  const handleDelete = (router: MikrotikRouter) => {
    setRouterToDelete(router);
    setDeleteDialogOpen(true);
  };

  const handleFormSubmit = (data: RouterFormData) => {
    if (editingRouter) {
      updateRouter.mutate({ id: editingRouter.id, data });
    } else {
      createRouter.mutate(data);
    }
  };

  const handleFormClose = () => {
    setFormOpen(false);
    setEditingRouter(null);
  };

  const activeCount = routers.filter(r => r.is_active).length;
  const inactiveCount = routers.filter(r => !r.is_active).length;

  return (
    <>
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Server className="w-5 h-5 text-primary" />
                Router Management
              </CardTitle>
              <CardDescription>
                Manage multiple MikroTik routers. Active: {activeCount} | Inactive: {inactiveCount}
              </CardDescription>
            </div>
            <Button onClick={() => setFormOpen(true)} className="bg-gradient-primary">
              <Plus className="w-4 h-4 mr-2" />
              Add Router
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : routers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Server className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No routers configured</p>
              <p className="text-sm">Add your first MikroTik router to get started</p>
            </div>
          ) : (
            <div className="rounded-md border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Name</TableHead>
                    <TableHead>Host</TableHead>
                    <TableHead>Port</TableHead>
                    <TableHead>Connection</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {routers.map((router) => (
                    <TableRow key={router.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            router.is_active ? 'bg-primary/20' : 'bg-muted'
                          }`}>
                            <Server className={`w-4 h-4 ${
                              router.is_active ? 'text-primary' : 'text-muted-foreground'
                            }`} />
                          </div>
                          <div>
                            <p className="font-medium">{router.name}</p>
                            {router.description && (
                              <p className="text-xs text-muted-foreground">{router.description}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{router.host}</TableCell>
                      <TableCell>
                        <span className="font-mono text-sm">{router.port || 8728}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {router.use_ssl ? (
                            <Badge variant="outline" className="border-green-500/50 text-green-500 bg-green-500/10">
                              <Shield className="w-3 h-3 mr-1" />
                              SSL
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="border-muted-foreground/50">
                              <Wifi className="w-3 h-3 mr-1" />
                              Plain
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground uppercase">
                            {router.connection_mode}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {router.is_active ? (
                          <Badge className="bg-green-500/20 text-green-500 border-green-500/30">
                            <Check className="w-3 h-3 mr-1" />
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-muted-foreground">
                            <X className="w-3 h-3 mr-1" />
                            Inactive
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(router)}>
                              <Pencil className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => toggleActive.mutate({ 
                                id: router.id, 
                                isActive: !router.is_active 
                              })}
                            >
                              {router.is_active ? (
                                <>
                                  <PowerOff className="w-4 h-4 mr-2" />
                                  Deactivate
                                </>
                              ) : (
                                <>
                                  <Power className="w-4 h-4 mr-2" />
                                  Activate
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(router)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Router Form Dialog */}
      <MikrotikRouterFormDialog
        open={formOpen}
        onOpenChange={handleFormClose}
        router={editingRouter}
        onSubmit={handleFormSubmit}
        isLoading={createRouter.isPending || updateRouter.isPending}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Router?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{routerToDelete?.name}</strong>? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteRouter.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => routerToDelete && deleteRouter.mutate(routerToDelete.id)}
              disabled={deleteRouter.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteRouter.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
