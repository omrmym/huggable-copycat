import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Loader2 } from 'lucide-react';
import { useResellers, useDeleteReseller, Reseller } from '@/hooks/useResellers';
import { useRoleDefinitions } from '@/hooks/useRoleDefinitions';
import { ResellerFormDialog } from '@/components/management/ResellerFormDialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

export default function Resellers() {
  const { data: resellers, isLoading } = useResellers();
  const { data: roles } = useRoleDefinitions();
  const deleteReseller = useDeleteReseller();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingReseller, setEditingReseller] = useState<Reseller | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleEdit = (reseller: Reseller) => {
    setEditingReseller(reseller);
    setDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingReseller(null);
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteReseller.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  return (
    <DashboardLayout title="Reseller Management" subtitle="Manage your resellers and their commission rates">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div></div>
          <Button onClick={handleAdd}>
            <Plus className="w-4 h-4 mr-2" />
            Add Reseller
          </Button>
        </div>

        <div className="bg-card border border-border rounded-xl overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Contact Person</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Commission</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {resellers?.length === 0 ? (
                <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                      No resellers found
                    </TableCell>
                  </TableRow>
                ) : (
                  resellers?.map((reseller) => {
                    const role = roles?.find(r => r.id === reseller.role_id);
                    return (
                    <TableRow key={reseller.id}>
                      <TableCell className="font-medium">{reseller.name}</TableCell>
                      <TableCell>{reseller.code || '-'}</TableCell>
                      <TableCell>{reseller.contact_person || '-'}</TableCell>
                      <TableCell>{reseller.phone || '-'}</TableCell>
                      <TableCell>
                        {role ? (
                          <Badge variant="outline">{role.name}</Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>{reseller.commission_rate}%</TableCell>
                      <TableCell className="font-medium text-primary">৳{reseller.balance?.toLocaleString() || 0}</TableCell>
                      <TableCell>
                        <Badge variant={reseller.is_active ? 'default' : 'secondary'}>
                          {reseller.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(reseller)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setDeleteId(reseller.id)}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )})
                )}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      <ResellerFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        reseller={editingReseller}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Reseller</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this reseller? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
