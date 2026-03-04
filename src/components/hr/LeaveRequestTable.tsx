import { useState } from 'react';
import { LeaveRequest } from '@/hooks/useLeaveRequests';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X, Trash2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';

interface LeaveRequestTableProps {
  requests: LeaveRequest[];
  isLoading: boolean;
  onApprove?: (id: string) => void;
  onReject?: (id: string, reason: string) => void;
  onDelete?: (id: string) => void;
}

const statusVariants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pending: 'outline',
  approved: 'default',
  rejected: 'destructive',
};

const statusLabels: Record<string, string> = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
};

export function LeaveRequestTable({ requests, isLoading, onApprove, onReject, onDelete }: LeaveRequestTableProps) {
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const handleReject = () => {
    if (rejectingId && rejectionReason.trim()) {
      onReject(rejectingId, rejectionReason);
      setRejectingId(null);
      setRejectionReason('');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No leave requests found.
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Leave Type</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>End Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.map((request) => (
              <TableRow key={request.id}>
                <TableCell className="font-medium">
                  {request.employee?.full_name || '-'}
                  <div className="text-xs text-muted-foreground">
                    {request.employee?.employee_id}
                  </div>
                </TableCell>
                <TableCell>{request.leave_type}</TableCell>
                <TableCell>{format(new Date(request.start_date), 'MMM dd, yyyy')}</TableCell>
                <TableCell>{format(new Date(request.end_date), 'MMM dd, yyyy')}</TableCell>
                <TableCell>
                  <Badge variant={statusVariants[request.status] || 'secondary'}>
                    {statusLabels[request.status] || request.status}
                  </Badge>
                  {request.status === 'rejected' && request.rejection_reason && (
                    <div className="text-xs text-destructive mt-1 max-w-[150px] truncate">
                      {request.rejection_reason}
                    </div>
                  )}
                </TableCell>
                <TableCell className="max-w-[150px] truncate">{request.reason || '-'}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    {request.status === 'pending' && (
                      <>
                        {onApprove && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-primary hover:text-primary hover:bg-primary/10"
                            onClick={() => onApprove(request.id)}
                            title="Approve"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                        {onReject && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => setRejectingId(request.id)}
                            title="Reject"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </>
                    )}
                    {onDelete && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => onDelete(request.id)}
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Rejection Dialog */}
      <Dialog open={!!rejectingId} onOpenChange={() => setRejectingId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Leave Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rejection_reason">Rejection Reason *</Label>
              <Textarea
                id="rejection_reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Please provide a reason for rejection"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectingId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={!rejectionReason.trim()}
            >
              Reject Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
