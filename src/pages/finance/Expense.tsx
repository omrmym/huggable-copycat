import { useState, useMemo, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Pencil, Trash2, TrendingDown } from 'lucide-react';
import { useExpenses, useCreateExpense, useUpdateExpense, useDeleteExpense, Expense as ExpenseType } from '@/hooks/useExpenses';
import { useExpenseCategories } from '@/hooks/useExpenseCategories';
import { DateRangeFilter } from '@/components/finance/DateRangeFilter';
import { format, parseISO, isWithinInterval, startOfDay, endOfDay, startOfMonth } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';

export default function Expense() {
  const { user } = useAuth();
  const { data: expenseList = [], isLoading } = useExpenses();
  const { data: expenseCategories = [] } = useExpenseCategories();
  const createExpense = useCreateExpense();
  const updateExpense = useUpdateExpense();
  const deleteExpense = useDeleteExpense();

  // Get current user's name from auth context
  const currentUserName = user?.user_metadata?.full_name || user?.email || '';

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseType | null>(null);
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
    if (!editingExpense) {
      setFormData(prev => ({ ...prev, added_by: currentUserName }));
    }
  }, [currentUserName, editingExpense]);

  const filteredExpenseList = useMemo(() => {
    if (!startDate && !endDate) return expenseList;
    
    return expenseList.filter((expense) => {
      const expenseDate = parseISO(expense.date);
      if (startDate && endDate) {
        return isWithinInterval(expenseDate, {
          start: startOfDay(startDate),
          end: endOfDay(endDate),
        });
      }
      if (startDate) {
        return expenseDate >= startOfDay(startDate);
      }
      if (endDate) {
        return expenseDate <= endOfDay(endDate);
      }
      return true;
    });
  }, [expenseList, startDate, endDate]);

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
    setEditingExpense(null);
  };

  const handleOpenDialog = (expense?: ExpenseType) => {
    if (expense) {
      setEditingExpense(expense);
      setFormData({
        added_by: expense.added_by || '',
        amount: String(expense.amount),
        description: expense.description || '',
        category: expense.category || '',
        date: expense.date,
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

    if (editingExpense) {
      await updateExpense.mutateAsync({ id: editingExpense.id, ...data });
    } else {
      await createExpense.mutateAsync(data);
    }
    setIsDialogOpen(false);
    resetForm();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this expense entry?')) {
      await deleteExpense.mutateAsync(id);
    }
  };

  const totalExpense = filteredExpenseList.reduce((sum, item) => sum + Number(item.amount), 0);

  return (
    <DashboardLayout title="Expenses" subtitle="Manage your expense entries">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <DateRangeFilter
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
            onClear={clearDateFilter}
          />
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="w-4 h-4 mr-2" />
                Add Expense
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingExpense ? 'Edit Expense' : 'Add New Expense'}</DialogTitle>
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
                      {expenseCategories
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
                  <Button type="submit" disabled={createExpense.isPending || updateExpense.isPending}>
                    {editingExpense ? 'Update' : 'Add'} Expense
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-destructive" />
              {startDate || endDate ? 'Filtered Expenses' : 'Total Expenses'}
            </CardTitle>
            <span className="text-2xl font-bold text-destructive">৳{totalExpense.toLocaleString()}</span>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Expense Entries ({filteredExpenseList.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-muted-foreground">Loading...</p>
            ) : filteredExpenseList.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">{startDate || endDate ? 'No expense entries in selected date range.' : 'No expense entries yet. Add your first expense!'}</p>
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
                  {filteredExpenseList.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell>{format(new Date(expense.date), 'dd MMM yyyy')}</TableCell>
                      <TableCell>{expense.added_by || '-'}</TableCell>
                      <TableCell>{expense.category || '-'}</TableCell>
                      <TableCell className="max-w-xs truncate">{expense.description || '-'}</TableCell>
                      <TableCell className="text-right font-medium text-destructive">
                        ৳{Number(expense.amount).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="icon" variant="ghost" onClick={() => handleOpenDialog(expense)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => handleDelete(expense.id)}>
                            <Trash2 className="w-4 h-4 text-destructive" />
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
      </div>
    </DashboardLayout>
  );
}
