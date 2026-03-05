import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import { History, ArrowUpRight, ArrowDownRight, Trash2 } from 'lucide-react';
import { useDeleteTransaction } from '@/hooks/useTransactions';
import { InvoicePreviewDialog } from '@/components/invoice/InvoicePreviewDialog';
import { useHasPermission } from '@/hooks/useHasPermission';
import { format } from 'date-fns';

interface Transaction {
  id: string;
  type: string;
  amount: number;
  description: string | null;
  status: string;
  created_at: string;
  radius_user_id?: string | null;
}

interface TransactionHistoryTabProps {
  transactions: Transaction[];
  isLoading: boolean;
  userId: string;
  billingCycle?: string;
  userDetails?: {
    username: string;
    full_name: string | null;
    phone: string | null;
    expires_at: string | null;
    plan?: {
      name: string;
      price: number;
    } | null;
  };
}

export function TransactionHistoryTab({ 
  transactions, 
  isLoading, 
  userId,
  billingCycle = 'monthly',
  userDetails 
}: TransactionHistoryTabProps) {
  const [selectedInvoice, setSelectedInvoice] = useState<Transaction | null>(null);
  const [invoicePreviewOpen, setInvoicePreviewOpen] = useState(false);
  const { hasPermission } = useHasPermission();
  const canDeleteTransaction = hasPermission('users.profile.delete_transaction');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<Transaction | null>(null);

  const deleteTransaction = useDeleteTransaction();

  const handleInvoiceClick = (tx: Transaction) => {
    setSelectedInvoice(tx);
    setInvoicePreviewOpen(true);
  };

  const handleDeleteClick = (e: React.MouseEvent, tx: Transaction) => {
    e.stopPropagation();
    setInvoiceToDelete(tx);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!invoiceToDelete) return;

    await deleteTransaction.mutateAsync({
      transactionId: invoiceToDelete.id,
      userId: userId,
      amount: Number(invoiceToDelete.amount),
      billingCycle: billingCycle,
    });

    setDeleteDialogOpen(false);
    setInvoiceToDelete(null);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Transaction History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Transaction History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <History className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No transactions found</p>
              <p className="text-sm mt-1">Transaction history will appear here once payments are made.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => handleInvoiceClick(tx)}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      tx.type === 'payment' || tx.type === 'recharge' || tx.type === 'credit' 
                        ? 'bg-green-500/10 text-green-500' 
                        : 'bg-red-500/10 text-red-500'
                    }`}>
                      {tx.type === 'payment' || tx.type === 'recharge' || tx.type === 'credit' ? (
                        <ArrowDownRight className="w-5 h-5" />
                      ) : (
                        <ArrowUpRight className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">
                        <span className="font-mono text-xs text-muted-foreground mr-2">
                          #{tx.id.slice(0, 8).toUpperCase()}
                        </span>
                        <span className="capitalize">{tx.type.replace('_', ' ')}</span>
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {tx.description || 'No description'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className={`font-bold font-mono ${
                        tx.type === 'payment' || tx.type === 'recharge' || tx.type === 'credit' 
                          ? 'text-green-500' 
                          : 'text-red-500'
                      }`}>
                        {tx.type === 'payment' || tx.type === 'recharge' || tx.type === 'credit' ? '+' : '-'}৳{Math.abs(tx.amount).toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(tx.created_at), 'MMM d, yyyy HH:mm')}
                      </p>
                      <Badge 
                        variant={tx.status === 'completed' ? 'default' : tx.status === 'pending' ? 'secondary' : 'destructive'}
                        className="mt-1"
                      >
                        {tx.status}
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={(e) => handleDeleteClick(e, tx)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invoice Preview Dialog */}
      <InvoicePreviewDialog
        open={invoicePreviewOpen}
        onOpenChange={setInvoicePreviewOpen}
        invoice={selectedInvoice ? {
          ...selectedInvoice,
          radius_users: userDetails
        } : null}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Invoice</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this invoice? This will:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Remove the transaction record</li>
                <li>Reduce user balance by ৳{invoiceToDelete ? Math.abs(invoiceToDelete.amount).toLocaleString() : 0}</li>
                <li>Reduce user expire date by {billingCycle === 'monthly' ? '1 month' : '30 days'}</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleConfirmDelete}
              disabled={deleteTransaction.isPending}
            >
              {deleteTransaction.isPending ? 'Deleting...' : 'Delete Invoice'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
