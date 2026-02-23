import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, CreditCard, Loader2 } from 'lucide-react';
import { useAllPaymentMethods, useCreatePaymentMethod, useUpdatePaymentMethod, useDeletePaymentMethod, type PaymentMethod } from '@/hooks/usePaymentMethods';

export function PaymentMethodManagement() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
  const [formData, setFormData] = useState({ name: '', code: '', description: '' });

  const { data: paymentMethods = [], isLoading } = useAllPaymentMethods();
  const createPaymentMethod = useCreatePaymentMethod();
  const updatePaymentMethod = useUpdatePaymentMethod();
  const deletePaymentMethod = useDeletePaymentMethod();

  const handleAdd = async () => {
    if (!formData.name.trim()) return;
    await createPaymentMethod.mutateAsync({
      name: formData.name.trim(),
      code: formData.code.trim() || undefined,
      description: formData.description.trim() || undefined,
    });
    setFormData({ name: '', code: '', description: '' });
    setIsAddDialogOpen(false);
  };

  const handleEdit = async () => {
    if (!editingMethod || !formData.name.trim()) return;
    await updatePaymentMethod.mutateAsync({
      id: editingMethod.id,
      name: formData.name.trim(),
      code: formData.code.trim() || undefined,
      description: formData.description.trim() || undefined,
    });
    setEditingMethod(null);
    setFormData({ name: '', code: '', description: '' });
  };

  const handleToggleActive = async (method: PaymentMethod) => {
    await updatePaymentMethod.mutateAsync({
      id: method.id,
      is_active: !method.is_active,
    });
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this payment method?')) {
      await deletePaymentMethod.mutateAsync(id);
    }
  };

  const openEditDialog = (method: PaymentMethod) => {
    setEditingMethod(method);
    setFormData({
      name: method.name,
      code: method.code || '',
      description: method.description || '',
    });
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <CreditCard className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle>Payment Methods</CardTitle>
              <CardDescription>Manage payment method options for recharge</CardDescription>
            </div>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-gradient-primary">
                <Plus className="w-4 h-4 mr-2" />
                Add Method
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader>
                <DialogTitle>Add Payment Method</DialogTitle>
                <DialogDescription>Add a new payment method option</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Name *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Cash, bKash"
                    className="bg-secondary border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Code</Label>
                  <Input
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="e.g., CASH, BKASH"
                    className="bg-secondary border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Optional description"
                    className="bg-secondary border-border"
                  />
                </div>
                <Button
                  onClick={handleAdd}
                  disabled={!formData.name.trim() || createPaymentMethod.isPending}
                  className="w-full bg-gradient-primary"
                >
                  {createPaymentMethod.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Add Payment Method
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : paymentMethods.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No payment methods configured</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-border">
                <TableHead>Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Active</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paymentMethods.map((method) => (
                <TableRow key={method.id} className="border-border">
                  <TableCell className="font-medium">{method.name}</TableCell>
                  <TableCell className="text-muted-foreground">{method.code || '-'}</TableCell>
                  <TableCell className="text-muted-foreground">{method.description || '-'}</TableCell>
                  <TableCell>
                    <Switch
                      checked={method.is_active}
                      onCheckedChange={() => handleToggleActive(method)}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Dialog open={editingMethod?.id === method.id} onOpenChange={(open) => !open && setEditingMethod(null)}>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={() => openEditDialog(method)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-card border-border">
                          <DialogHeader>
                            <DialogTitle>Edit Payment Method</DialogTitle>
                            <DialogDescription>Update payment method details</DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label>Name *</Label>
                              <Input
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="bg-secondary border-border"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Code</Label>
                              <Input
                                value={formData.code}
                                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                className="bg-secondary border-border"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Description</Label>
                              <Input
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="bg-secondary border-border"
                              />
                            </div>
                            <Button
                              onClick={handleEdit}
                              disabled={!formData.name.trim() || updatePaymentMethod.isPending}
                              className="w-full bg-gradient-primary"
                            >
                              {updatePaymentMethod.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                              Update Payment Method
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(method.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
