import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, Loader2, Clock, Trash2, Eye } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export default function RequestManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['user-requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_requests')
        .select(`
          *,
          district:districts(name),
          police_station:police_stations(name),
          area:areas(name),
          plan:billing_plans(name, price)
        `)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (request: any) => {
      // Check if username already exists in radius_users
      const { data: existingUser } = await supabase
        .from('radius_users')
        .select('id, username')
        .eq('username', request.mikrotik_username)
        .maybeSingle();

      if (existingUser) {
        // User already exists - auto-reject this request
        await supabase
          .from('user_requests')
          .update({ status: 'rejected' } as any)
          .eq('id', request.id);
        throw new Error(`ইউজার আইডি "${request.mikrotik_username}" ইতিমধ্যে প্যানেলে আছে। রিকোয়েস্ট বাতিল করা হয়েছে।`);
      }

      // 1. Create radius_user from request data with status 'disabled'
      const now = new Date();

      const { error: createError } = await supabase.from('radius_users').insert({
        full_name: request.full_name,
        father_name: request.father_name,
        nid_number: request.nid_number,
        phone: request.phone,
        gender: request.gender,
        customer_type: request.customer_type,
        district_id: request.district_id,
        police_station_id: request.police_station_id,
        area_id: request.area_id,
        address_details: request.address_details,
        plan_id: request.plan_id,
        mikrotik_router_id: request.mikrotik_router_id,
        monthly_bill: request.monthly_bill,
        connection_fee: request.connection_fee,
        username: request.mikrotik_username,
        password_hash: request.mikrotik_username,
        connection_date: now.toISOString(),
        billing_type: 'prepaid',
        billing_cycle: 'monthly',
        connectivity_type: 'shared',
        reseller_office: 'Main-User',
        service_type: 'hotspot',
        status: 'disabled',
      });

      if (createError) throw createError;

      // MikroTik user remains disabled - will be enabled when first recharge/bill is generated

      // 2. Update request status to approved
      const { error: updateError } = await supabase
        .from('user_requests')
        .update({ status: 'approved' } as any)
        .eq('id', request.id);

      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-requests'] });
      queryClient.invalidateQueries({ queryKey: ['radius-users'] });
      toast({ title: "Request Approved", description: "User created (disabled). Will be enabled after first recharge." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (request: any) => {
      // 1. Delete user from MikroTik
      try {
        await supabase.functions.invoke('mikrotik-sync', {
          body: {
            action: 'delete-user',
            username: request.mikrotik_username,
          },
        });
      } catch (syncError) {
        console.warn('MikroTik delete failed:', syncError);
      }

      // 2. Delete request
      const { error } = await supabase.from('user_requests').delete().eq('id', request.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-requests'] });
      toast({ title: "Request Rejected", description: "Request has been rejected and deleted." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const pendingRequests = requests.filter((r: any) => r.status === 'pending');
  const processedRequests = requests.filter((r: any) => r.status !== 'pending');

  const getTimeRemaining = (createdAt: string) => {
    const created = new Date(createdAt);
    const expiresAt = new Date(created.getTime() + 48 * 60 * 60 * 1000);
    const now = new Date();
    if (now > expiresAt) return "Expired";
    return formatDistanceToNow(expiresAt, { addSuffix: false }) + " left";
  };

  return (
    <DashboardLayout title="User Requests" subtitle="Manage new connection requests">
      <div className="space-y-6">
        {/* Pending Requests */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-yellow-500" />
              Pending Requests ({pendingRequests.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>
            ) : pendingRequests.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No pending requests</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Area</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Monthly Bill</TableHead>
                      <TableHead>Time Left</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingRequests.map((req: any) => (
                      <TableRow key={req.id}>
                        <TableCell className="font-medium">{req.full_name}</TableCell>
                        <TableCell>{req.phone}</TableCell>
                        <TableCell>{req.area?.name || '-'}</TableCell>
                        <TableCell>{req.plan?.name || '-'}</TableCell>
                        <TableCell>৳{req.monthly_bill}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                            {getTimeRemaining(req.created_at)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(req.created_at), 'PPp')}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button size="sm" variant="ghost" onClick={() => { setSelectedRequest(req); setViewDialogOpen(true); }}>
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="default" className="bg-green-600 hover:bg-green-700" onClick={() => approveMutation.mutate(req)} disabled={approveMutation.isPending}>
                              {approveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => rejectMutation.mutate(req)} disabled={rejectMutation.isPending}>
                              {rejectMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Processed Requests */}
        {processedRequests.length > 0 && (
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                Processed Requests ({processedRequests.length})
              </CardTitle>
              <Button
                size="sm"
                variant="destructive"
                onClick={async () => {
                  const ids = processedRequests.map((r: any) => r.id);
                  const { error } = await supabase.from('user_requests').delete().in('id', ids);
                  if (error) {
                    toast({ title: "Error", description: error.message, variant: "destructive" });
                  } else {
                    queryClient.invalidateQueries({ queryKey: ['user-requests'] });
                    toast({ title: "Cleared", description: "All processed requests removed." });
                  }
                }}
              >
                <Trash2 className="w-4 h-4 mr-1" /> Clear All
              </Button>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Submitted</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {processedRequests.map((req: any) => (
                      <TableRow key={req.id}>
                        <TableCell className="font-medium">{req.full_name}</TableCell>
                        <TableCell>{req.phone}</TableCell>
                        <TableCell>{req.plan?.name || '-'}</TableCell>
                        <TableCell>
                          <Badge variant={req.status === 'approved' ? 'default' : 'destructive'}>
                            {req.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(req.created_at), 'PPp')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* View Request Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Request Details</DialogTitle>
            <DialogDescription>Full details of the connection request</DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-muted-foreground">Name</Label><p className="font-medium">{selectedRequest.full_name}</p></div>
                <div><Label className="text-muted-foreground">Father Name</Label><p>{selectedRequest.father_name || '-'}</p></div>
                <div><Label className="text-muted-foreground">Phone</Label><p>{selectedRequest.phone}</p></div>
                <div><Label className="text-muted-foreground">NID</Label><p>{selectedRequest.nid_number || '-'}</p></div>
                <div><Label className="text-muted-foreground">Gender</Label><p className="capitalize">{selectedRequest.gender}</p></div>
                <div><Label className="text-muted-foreground">Client Type</Label><p className="capitalize">{selectedRequest.customer_type}</p></div>
                <div><Label className="text-muted-foreground">District</Label><p>{selectedRequest.district?.name || '-'}</p></div>
                <div><Label className="text-muted-foreground">Police Station</Label><p>{selectedRequest.police_station?.name || '-'}</p></div>
                <div><Label className="text-muted-foreground">Area</Label><p>{selectedRequest.area?.name || '-'}</p></div>
                <div><Label className="text-muted-foreground">Plan</Label><p>{selectedRequest.plan?.name || '-'} (৳{selectedRequest.plan?.price || 0})</p></div>
                <div><Label className="text-muted-foreground">Monthly Bill</Label><p>৳{selectedRequest.monthly_bill}</p></div>
                <div><Label className="text-muted-foreground">Connection Fee</Label><p>৳{selectedRequest.connection_fee}</p></div>
              </div>
              <div>
                <Label className="text-muted-foreground">Address</Label>
                <p>{selectedRequest.address_details || '-'}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
