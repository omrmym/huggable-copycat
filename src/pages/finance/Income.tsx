import { useState, useMemo, useEffect } from 'react';
import { useHasPermission } from '@/hooks/useHasPermission';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Pencil, Trash2, TrendingUp } from 'lucide-react';
import { useIncome, useCreateIncome, useUpdateIncome, useDeleteIncome, Income as IncomeType } from '@/hooks/useIncome';
import { useIncomeCategories } from '@/hooks/useIncomeCategories';
import { DateRangeFilter } from '@/components/finance/DateRangeFilter';
import { format, parseISO, isWithinInterval, startOfDay, endOfDay, startOfMonth } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';

export default function Income() {
  const { hasPermission } = useHasPermission();
  const { user } = useAuth();
  const { data: incomeList = [], isLoading } = useIncome();
  const { data: incomeCategories = [] } = useIncomeCategories();
  const createIncome = useCreateIncome();
  const updateIncome = useUpdateIncome();
  const deleteIncome = useDeleteIncome();

  // Get current user's name from auth context
  const currentUserName = user?.user_metadata?.full_name || user?.email || '';

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingIncome, setEditingIncome] = useState<IncomeType | null>(null);
  const [startDate, setStartDate] = useState<Date | undefined>(startOfMonth(new Date()));
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [formData, setFormData] = useState({
    added_by: currentUserName,
    amount: '',
    description: '',
    category: '',
    date: format(new Date(), 'yyyy-MM-dd'),
  });

  // Update added_by when user changes
  useEffect(() => {
    if (!editingIncome) {
      setFormData(prev => ({ ...prev, added_by: currentUserName }));
    }
  }, [currentUserName, editingIncome]);

  const filteredIncomeList = useMemo(() => {
    if (!startDate && !endDate) return incomeList;
    
    return incomeList.filter((income) => {
      const incomeDate = parseISO(income.date);
      if (startDate && endDate) {
        return isWithinInterval(incomeDate, {
          start: startOfDay(startDate),
          end: endOfDay(endDate),
        });
      }
      if (startDate) {
        return incomeDate >= startOfDay(startDate);
      }
      if (endDate) {
        return incomeDate <= endOfDay(endDate);
      }
      return true;
    });
  }, [incomeList, startDate, endDate]);

  const clearDateFilter = () => {
    setStartDate(startOfMonth(new Date()));
    setEndDate(new Date());
  };

  const resetForm = () => {
    setFormData({
      added_by: currentUserName,
      amount: '',
      description: '',
      category: '',
      date: format(new Date(), 'yyyy-MM-dd'),
    });
    setEditingIncome(null);
  };

  const handleOpenDialog = (income?: IncomeType) => {
    if (income) {
      setEditingIncome(income);
      setFormData({
        added_by: income.added_by || '',
        amount: String(income.amount),
        description: income.description || '',
        category: income.category || '',
        date: income.date,
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      amount: parseFloat(formData.amount),
      description: formData.description || undefined,
      category: formData.category || undefined,
      added_by: formData.added_by || undefined,
      date: formData.date,
    };

    if (editingIncome) {
      await updateIncome.mutateAsync({ id: editingIncome.id, ...data });
    } else {
      await createIncome.mutateAsync(data);
    }
    setIsDialogOpen(false);
    resetForm();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this income entry?')) {
      await deleteIncome.mutateAsync(id);
    }
  };

  const totalIncome = filteredIncomeList.reduce((sum, item) => sum + Number(item.amount), 0);

  return (
    <DashboardLayout title="Income" subtitle="Manage your income entries">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <DateRangeFilter
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
            onClear={clearDateFilter}
          />
          {hasPermission('finance.income.add') && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => handleOpenDialog()}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Income
                </Button>
              </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingIncome ? 'Edit Income' : 'Add New Income'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="added_by">Added By</Label>
                  <Input
                    id="added_by"
                    value={formData.added_by}
                    readOnly
                    className="bg-muted cursor-not-allowed"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category / Purpose *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {incomeCategories
                        .filter((cat) => cat.is_active)
                        .map((cat) => (
                          <SelectItem key={cat.id} value={cat.name}>
                            {cat.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date">Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount (৳) *</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="Enter amount"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Additional details..."
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createIncome.isPending || updateIncome.isPending}>
                    {editingIncome ? 'Update' : 'Add'} Income
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
          )}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-success" />
              {startDate || endDate ? 'Filtered Income' : 'Total Income'}
            </CardTitle>
            <span className="text-2xl font-bold text-success">৳{totalIncome.toLocaleString()}</span>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Income Entries ({filteredIncomeList.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-muted-foreground">Loading...</p>
            ) : filteredIncomeList.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">{startDate || endDate ? 'No income entries in selected date range.' : 'No income entries yet. Add your first income!'}</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Added By</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredIncomeList.map((income) => (
                    <TableRow key={income.id}>
                      <TableCell>{format(new Date(income.date), 'dd MMM yyyy')}</TableCell>
                      <TableCell>{income.added_by || '-'}</TableCell>
                      <TableCell>{income.category || '-'}</TableCell>
                      <TableCell className="max-w-xs truncate">{income.description || '-'}</TableCell>
                      <TableCell className="text-right font-medium text-success">
                        ৳{Number(income.amount).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {hasPermission('finance.income.edit') && (
                            <Button size="icon" variant="ghost" onClick={() => handleOpenDialog(income)}>
                              <Pencil className="w-4 h-4" />
                            </Button>
                          )}
                          {hasPermission('finance.income.delete') && (
                            <Button size="icon" variant="ghost" onClick={() => handleDelete(income.id)}>
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
