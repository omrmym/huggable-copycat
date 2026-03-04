import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit2, Trash2, Users } from 'lucide-react';
import { useShareholders, useCreateShareholder, useUpdateShareholder, useDeleteShareholder, Shareholder } from '@/hooks/useShareholders';
import { Skeleton } from '@/components/ui/skeleton';

export function ShareholderManagement() {
  const { data: shareholders = [], isLoading } = useShareholders();
  const createMutation = useCreateShareholder();
  const updateMutation = useUpdateShareholder();
  const deleteMutation = useDeleteShareholder();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Shareholder | null>(null);
  const [form, setForm] = useState({ name: '', phone: '', email: '', business_percent: '' });

  const totalPercent = shareholders.filter(s => s.is_active).reduce((sum, s) => sum + Number(s.business_percent), 0);

  const openAdd = () => {
    setEditing(null);
    setForm({ name: '', phone: '', email: '', business_percent: '' });
    setDialogOpen(true);
  };

  const openEdit = (s: Shareholder) => {
    setEditing(s);
    setForm({ name: s.name, phone: s.phone || '', email: s.email || '', business_percent: String(s.business_percent) });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    const percent = parseFloat(form.business_percent);
    if (!form.name || isNaN(percent) || percent < 0 || percent > 100) return;

    if (editing) {
      updateMutation.mutate({ id: editing.id, name: form.name, phone: form.phone, email: form.email, business_percent: percent }, {
        onSuccess: () => setDialogOpen(false),
      });
    } else {
      createMutation.mutate({ name: form.name, phone: form.phone, email: form.email, business_percent: percent }, {
        onSuccess: () => setDialogOpen(false),
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Shareholder Management
            </CardTitle>
            <CardDescription>Manage business shareholders and their ownership percentages</CardDescription>
          </div>
          <Button onClick={openAdd} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Shareholder
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {totalPercent > 0 && (
          <div className={`mb-4 p-3 rounded-lg border ${totalPercent > 100 ? 'bg-destructive/10 border-destructive/30' : 'bg-muted/50 border-border'}`}>
            <span className="text-sm font-medium">Total Ownership: </span>
            <span className={`font-bold ${totalPercent > 100 ? 'text-destructive' : 'text-foreground'}`}>{totalPercent}%</span>
            {totalPercent > 100 && <span className="text-xs text-destructive ml-2">⚠ Exceeds 100%</span>}
          </div>
        )}

        {isLoading ? (
          <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
        ) : shareholders.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No shareholders added yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="text-right">Business %</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shareholders.map(s => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell>{s.phone || '-'}</TableCell>
                  <TableCell>{s.email || '-'}</TableCell>
                  <TableCell className="text-right font-bold">{s.business_percent}%</TableCell>
                  <TableCell>
                    <Badge variant={s.is_active ? 'default' : 'secondary'}>
                      {s.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(s)}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteMutation.mutate(s.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? 'Edit Shareholder' : 'Add Shareholder'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Name *</Label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Shareholder name" />
              </div>
              <div>
                <Label>Phone</Label>
                <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="Phone number" />
              </div>
              <div>
                <Label>Email</Label>
                <Input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="Email address" />
              </div>
              <div>
                <Label>Business Percentage *</Label>
                <Input type="number" min="0" max="100" step="0.01" value={form.business_percent} onChange={e => setForm(f => ({ ...f, business_percent: e.target.value }))} placeholder="e.g. 50" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
                {editing ? 'Update' : 'Add'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
