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
import { Edit, Trash2, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { SalaryPayment } from '@/hooks/useSalaryPayments';

interface PayrollTableProps {
  payments: SalaryPayment[];
  isLoading: boolean;
  onEdit: (payment: SalaryPayment) => void;
  onDelete: (payment: SalaryPayment) => void;
  onMarkPaid: (id: string) => void;
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  paid: 'bg-green-500/20 text-green-400 border-green-500/30',
  cancelled: 'bg-red-500/20 text-red-400 border-red-500/30',
};

export function PayrollTable({ payments, isLoading, onEdit, onDelete, onMarkPaid }: PayrollTableProps) {
  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Loading payments...</div>;
  }

  if (payments.length === 0) {
    return <div className="text-center py-8 text-muted-foreground">No salary payments found.</div>;
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Employee</TableHead>
            <TableHead>Department</TableHead>
            <TableHead>Payment Date</TableHead>
            <TableHead className="text-right">Base Salary</TableHead>
            <TableHead className="text-right">Bonus</TableHead>
            <TableHead className="text-right">Deductions</TableHead>
            <TableHead className="text-right">Net Salary</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.map((payment) => (
            <TableRow key={payment.id}>
              <TableCell>
                <div>
                  <p className="font-medium">{payment.employee?.full_name || 'Unknown'}</p>
                  <p className="text-xs text-muted-foreground">{payment.employee?.employee_id}</p>
                </div>
              </TableCell>
              <TableCell>{payment.employee?.department || '-'}</TableCell>
              <TableCell>{format(new Date(payment.payment_date), 'MMM dd, yyyy')}</TableCell>
              <TableCell className="text-right">{formatCurrency(payment.base_salary)}</TableCell>
              <TableCell className="text-right text-green-400">
                +{formatCurrency(payment.bonus || 0)}
              </TableCell>
              <TableCell className="text-right text-red-400">
                -{formatCurrency(payment.deductions || 0)}
              </TableCell>
              <TableCell className="text-right font-semibold">
                {formatCurrency(payment.net_salary)}
              </TableCell>
              <TableCell>
                <Badge className={statusColors[payment.status] || statusColors.pending}>
                  {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  {payment.status === 'pending' && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onMarkPaid(payment.id)}
                      title="Mark as Paid"
                    >
                      <CheckCircle className="h-4 w-4 text-green-400" />
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" onClick={() => onEdit(payment)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(payment)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
