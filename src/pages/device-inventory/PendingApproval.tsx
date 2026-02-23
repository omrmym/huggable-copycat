import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useDeviceChangeRequests, useApproveDeviceChange } from '@/hooks/useDeviceInventory';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Clock, CheckCircle, XCircle, ArrowRight, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export default function PendingApprovalPage() {
  const { data: pendingRequests = [], isLoading: pendingLoading } = useDeviceChangeRequests('pending');
  const { data: allRequests = [], isLoading: allLoading } = useDeviceChangeRequests();
  const approveChange = useApproveDeviceChange();
  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; id: string }>({ open: false, id: '' });
  const [rejectionReason, setRejectionReason] = useState('');
  const [clearing, setClearing] = useState(false);
  const queryClient = useQueryClient();

  const handleClearAll = async () => {
    setClearing(true);
    try {
      const { error } = await supabase
        .from('device_change_requests')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['device-change-requests'] });
      toast.success('All requests cleared');
    } catch (error: any) {
      toast.error(`Failed to clear: ${error.message}`);
    } finally {
      setClearing(false);
    }
  };

  const handleApprove = (id: string) => {
    approveChange.mutate({ id, approve: true });
  };

  const handleReject = () => {
    if (rejectDialog.id) {
      approveChange.mutate({ id: rejectDialog.id, approve: false, rejectionReason });
      setRejectDialog({ open: false, id: '' });
      setRejectionReason('');
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge variant="outline" className="text-yellow-500 border-yellow-500"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
      case 'approved': return <Badge variant="outline" className="text-green-500 border-green-500"><CheckCircle className="w-3 h-3 mr-1" /> Approved</Badge>;
      case 'rejected': return <Badge variant="outline" className="text-red-500 border-red-500"><XCircle className="w-3 h-3 mr-1" /> Rejected</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const renderTable = (requests: typeof allRequests, showActions: boolean) => (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User ID</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Device Change</TableHead>
            <TableHead>Mac/Serial Change</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Requested</TableHead>
            {showActions && <TableHead>Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.length === 0 ? (
            <TableRow>
              <TableCell colSpan={showActions ? 7 : 6} className="text-center text-muted-foreground py-8">
                No requests found
              </TableCell>
            </TableRow>
          ) : (
            requests.map((req) => (
              <TableRow key={req.id}>
                <TableCell className="font-medium">{req.radius_users?.username || '-'}</TableCell>
                <TableCell>{req.radius_users?.full_name || '-'}</TableCell>
                <TableCell>
                  {req.old_device || req.new_device ? (
                    <div className="flex items-center gap-1 text-sm">
                      <span className="text-muted-foreground">{req.old_device || 'None'}</span>
                      <ArrowRight className="w-3 h-3" />
                      <span className="font-medium">{req.new_device || 'None'}</span>
                    </div>
                  ) : '-'}
                </TableCell>
                <TableCell>
                  {req.old_mac_serial || req.new_mac_serial ? (
                    <div className="flex items-center gap-1 text-sm font-mono">
                      <span className="text-muted-foreground">{req.old_mac_serial || 'None'}</span>
                      <ArrowRight className="w-3 h-3" />
                      <span className="font-medium">{req.new_mac_serial || 'None'}</span>
                    </div>
                  ) : '-'}
                </TableCell>
                <TableCell>{statusBadge(req.status)}</TableCell>
                <TableCell>{format(new Date(req.created_at), 'dd MMM yyyy HH:mm')}</TableCell>
                {showActions && (
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-green-600 border-green-600 hover:bg-green-600/10"
                        onClick={() => handleApprove(req.id)}
                        disabled={approveChange.isPending}
                      >
                        <CheckCircle className="w-3 h-3 mr-1" /> Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 border-red-600 hover:bg-red-600/10"
                        onClick={() => setRejectDialog({ open: true, id: req.id })}
                        disabled={approveChange.isPending}
                      >
                        <XCircle className="w-3 h-3 mr-1" /> Reject
                      </Button>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <DashboardLayout title="Pending Approval" subtitle="Review and approve device change requests">
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Device Change Requests
            </CardTitle>
            {allRequests.length > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" disabled={clearing}>
                    {clearing ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Trash2 className="w-4 h-4 mr-1" />}
                    Clear All Requests
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Clear All Requests?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete all device change requests. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleClearAll}>Clear All</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="pending">
            <TabsList className="mb-4 bg-secondary">
              <TabsTrigger value="pending">Pending ({pendingRequests.length})</TabsTrigger>
              <TabsTrigger value="all">All Requests ({allRequests.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="pending">
              {pendingLoading ? (
                <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
              ) : renderTable(pendingRequests, true)}
            </TabsContent>

            <TabsContent value="all">
              {allLoading ? (
                <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
              ) : renderTable(allRequests, false)}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Reject Dialog */}
      <Dialog open={rejectDialog.open} onOpenChange={(open) => setRejectDialog({ ...rejectDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Device Change</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Reason for Rejection</Label>
              <Textarea
                placeholder="Enter reason for rejection..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialog({ open: false, id: '' })}>Cancel</Button>
            <Button variant="destructive" onClick={handleReject} disabled={approveChange.isPending}>
              {approveChange.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
