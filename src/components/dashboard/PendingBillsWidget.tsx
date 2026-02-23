import { Clock, CheckCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePendingTransactions, useApproveTransaction } from '@/hooks/useTransactions';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

export function PendingBillsWidget() {
  const navigate = useNavigate();
  const { data: pendingTransactions = [], isLoading } = usePendingTransactions();
  const approveTransaction = useApproveTransaction();

  const totalPendingAmount = pendingTransactions.reduce((sum, t) => sum + t.amount, 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleQuickApprove = async (transaction: typeof pendingTransactions[0]) => {
    if (!transaction.radius_user_id) return;
    await approveTransaction.mutateAsync({
      transactionId: transaction.id,
      userId: transaction.radius_user_id,
      amount: transaction.amount,
    });
  };

  if (isLoading) {
    return (
      <div className="bg-card border border-border rounded-xl p-6">
        <Skeleton className="h-6 w-40 mb-4" />
        <Skeleton className="h-20 w-full mb-4" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <Clock className="w-5 h-5 text-warning" />
          Pending Bills
        </h3>
        {pendingTransactions.length > 0 && (
          <span className="bg-warning/20 text-warning text-xs font-medium px-2.5 py-1 rounded-full">
            {pendingTransactions.length} pending
          </span>
        )}
      </div>

      {pendingTransactions.length === 0 ? (
        <div className="text-center py-6">
          <CheckCircle className="w-12 h-12 text-success mx-auto mb-2" />
          <p className="text-muted-foreground">All bills are processed!</p>
        </div>
      ) : (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-secondary/50 rounded-lg p-3">
              <p className="text-xs text-muted-foreground">Pending Count</p>
              <p className="text-xl font-bold text-foreground">{pendingTransactions.length}</p>
            </div>
            <div className="bg-secondary/50 rounded-lg p-3">
              <p className="text-xs text-muted-foreground">Total Amount</p>
              <p className="text-xl font-bold text-warning">{formatCurrency(totalPendingAmount)}</p>
            </div>
          </div>

          {/* Recent Pending Items */}
          <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
            {pendingTransactions.slice(0, 3).map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between bg-secondary/30 rounded-lg p-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {transaction.radius_user?.full_name || transaction.radius_user?.username || 'Unknown'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(transaction.created_at), 'MMM d, h:mm a')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">
                    {formatCurrency(transaction.amount)}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0 text-success hover:text-success hover:bg-success/20"
                    onClick={() => handleQuickApprove(transaction)}
                    disabled={approveTransaction.isPending}
                  >
                    <CheckCircle className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* View All Button */}
          <Button
            variant="outline"
            className="w-full"
            onClick={() => navigate('/recharge/pending')}
          >
            View All Pending Bills
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </>
      )}
    </div>
  );
}
