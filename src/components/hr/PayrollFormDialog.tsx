import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { SalaryPayment, SalaryPaymentInsert } from '@/hooks/useSalaryPayments';
import { Employee } from '@/hooks/useEmployees';
import { format } from 'date-fns';

interface PayrollFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment: SalaryPayment | null;
  employees: Employee[];
  onSubmit: (data: SalaryPaymentInsert) => void;
  isLoading: boolean;
}

export function PayrollFormDialog({
  open,
  onOpenChange,
  payment,
  employees,
  onSubmit,
  isLoading,
}: PayrollFormDialogProps) {
  const [formData, setFormData] = useState<Partial<SalaryPaymentInsert>>({
    employee_id: '',
    payment_date: format(new Date(), 'yyyy-MM-dd'),
    base_salary: 0,
    bonus: 0,
    deductions: 0,
    net_salary: 0,
    payment_method: 'bank_transfer',
    status: 'pending',
    notes: '',
  });

  useEffect(() => {
    if (payment) {
      setFormData({
        employee_id: payment.employee_id,
        payment_date: payment.payment_date,
        base_salary: payment.base_salary,
        bonus: payment.bonus || 0,
        deductions: payment.deductions || 0,
        net_salary: payment.net_salary,
        payment_method: payment.payment_method || 'bank_transfer',
        status: payment.status,
        notes: payment.notes || '',
      });
    } else {
      setFormData({
        employee_id: '',
        payment_date: format(new Date(), 'yyyy-MM-dd'),
        base_salary: 0,
        bonus: 0,
        deductions: 0,
        net_salary: 0,
        payment_method: 'bank_transfer',
        status: 'pending',
        notes: '',
      });
    }
  }, [payment, open]);

  // Auto-calculate net salary
  useEffect(() => {
    const base = formData.base_salary || 0;
    const bonus = formData.bonus || 0;
    const deductions = formData.deductions || 0;
    setFormData((prev) => ({ ...prev, net_salary: base + bonus - deductions }));
  }, [formData.base_salary, formData.bonus, formData.deductions]);

  // Auto-fill base salary when employee is selected
  const handleEmployeeChange = (employeeId: string) => {
    const employee = employees.find((e) => e.id === employeeId);
    setFormData((prev) => ({
      ...prev,
      employee_id: employeeId,
      base_salary: employee?.salary || 0,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.employee_id || !formData.payment_date) return;
    onSubmit(formData as SalaryPaymentInsert);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{payment ? 'Edit Payment' : 'New Salary Payment'}</DialogTitle>
          <DialogDescription>
            {payment ? 'Update the salary payment details.' : 'Create a new salary payment record.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="employee_id">Employee</Label>
              <Select
                value={formData.employee_id}
                onValueChange={handleEmployeeChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees
                    .filter((e) => e.status === 'active')
                    .map((employee) => (
                      <SelectItem key={employee.id} value={employee.id}>
                        {employee.full_name} ({employee.employee_id})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment_date">Payment Date</Label>
              <Input
                id="payment_date"
                type="date"
                value={formData.payment_date}
                onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment_method">Payment Method</Label>
              <Select
                value={formData.payment_method || 'bank_transfer'}
                onValueChange={(value) => setFormData({ ...formData, payment_method: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="check">Check</SelectItem>
                  <SelectItem value="mobile_banking">Mobile Banking</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="base_salary">Base Salary (BDT)</Label>
              <Input
                id="base_salary"
                type="number"
                min="0"
                value={formData.base_salary}
                onChange={(e) =>
                  setFormData({ ...formData, base_salary: parseFloat(e.target.value) || 0 })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bonus">Bonus (BDT)</Label>
              <Input
                id="bonus"
                type="number"
                min="0"
                value={formData.bonus}
                onChange={(e) =>
                  setFormData({ ...formData, bonus: parseFloat(e.target.value) || 0 })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="deductions">Deductions (BDT)</Label>
              <Input
                id="deductions"
                type="number"
                min="0"
                value={formData.deductions}
                onChange={(e) =>
                  setFormData({ ...formData, deductions: parseFloat(e.target.value) || 0 })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="net_salary">Net Salary (BDT)</Label>
              <Input
                id="net_salary"
                type="number"
                value={formData.net_salary}
                readOnly
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2 space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes..."
                rows={2}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : payment ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
