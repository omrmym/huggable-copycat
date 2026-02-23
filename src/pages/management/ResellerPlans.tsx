import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Loader2 } from 'lucide-react';
import { useResellerPlanCommissions, useDeleteResellerPlanCommission, ResellerPlanCommission } from '@/hooks/useResellerPlanCommissions';
import { ResellerPlanCommissionFormDialog } from '@/components/management/ResellerPlanCommissionFormDialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

export default function ResellerPlans() {
  const { data: commissions, isLoading } = useResellerPlanCommissions();
  const deleteCommission = useDeleteResellerPlanCommission();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCommission, setEditingCommission] = useState<ResellerPlanCommission | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleEdit = (commission: ResellerPlanCommission) => {
    setEditingCommission(commission);
    setDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingCommission(null);
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteCommission.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  return (
    <DashboardLayout title="Reseller Plans" subtitle="Manage commission rates per plan for each reseller">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div></div>
          <Button onClick={handleAdd}>
            <Plus className="w-4 h-4 mr-2" />
            Add Commission Rate
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
                  <TableHead>Reseller</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Plan Price</TableHead>
                  <TableHead>Commission Rate</TableHead>
                  <TableHead>Commission Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {commissions?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No commission rates found
                    </TableCell>
                  </TableRow>
                ) : (
                  commissions?.map((commission) => {
                    const planPrice = commission.billing_plans?.price || 0;
                    const commissionAmount = (planPrice * commission.commission_rate) / 100;
                    return (
                      <TableRow key={commission.id}>
                        <TableCell className="font-medium">{commission.resellers?.name || '-'}</TableCell>
                        <TableCell>{commission.billing_plans?.name || '-'}</TableCell>
                        <TableCell>৳{planPrice.toLocaleString()}</TableCell>
                        <TableCell>{commission.commission_rate}%</TableCell>
                        <TableCell>৳{commissionAmount.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant={commission.is_active ? 'default' : 'secondary'}>
                            {commission.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(commission)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => setDeleteId(commission.id)}>
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      <ResellerPlanCommissionFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        commission={editingCommission}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Commission Rate</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this commission rate? This action cannot be undone.
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
