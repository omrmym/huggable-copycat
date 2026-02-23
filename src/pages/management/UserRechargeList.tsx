import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { useResellerUserRecharges } from '@/hooks/useResellerUserRecharges';
import { useResellers } from '@/hooks/useResellers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';

export default function UserRechargeList() {
  const [selectedReseller, setSelectedReseller] = useState<string>('all');
  const { data: recharges, isLoading } = useResellerUserRecharges(selectedReseller === 'all' ? undefined : selectedReseller);
  const { data: resellers } = useResellers();

  const totalRecharges = recharges?.reduce((sum, r) => sum + r.amount, 0) || 0;
  const totalCommission = recharges?.reduce((sum, r) => sum + r.commission_amount, 0) || 0;

  return (
    <DashboardLayout title="User Recharge List" subtitle="Track all user recharges by resellers with commission tracking">
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Recharges</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">৳{totalRecharges.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {recharges?.length || 0} transactions
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Commission</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">৳{totalCommission.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Earned by resellers
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {recharges?.filter(r => r.status === 'completed').length || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Successful recharges
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Filter by Reseller</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedReseller} onValueChange={setSelectedReseller}>
                <SelectTrigger>
                  <SelectValue placeholder="All Resellers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Resellers</SelectItem>
                  {resellers?.map((reseller) => (
                    <SelectItem key={reseller.id} value={reseller.id}>
                      {reseller.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </div>

        <div className="bg-card border border-border rounded-xl overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Reseller</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Commission Rate</TableHead>
                  <TableHead>Commission</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recharges?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No user recharges found
                    </TableCell>
                  </TableRow>
                ) : (
                  recharges?.map((recharge) => (
                    <TableRow key={recharge.id}>
                      <TableCell>{format(new Date(recharge.created_at), 'dd MMM yyyy, hh:mm a')}</TableCell>
                      <TableCell className="font-medium">{recharge.resellers?.name || '-'}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{recharge.radius_users?.full_name || '-'}</div>
                          <div className="text-xs text-muted-foreground">{recharge.radius_users?.username}</div>
                        </div>
                      </TableCell>
                      <TableCell>{recharge.billing_plans?.name || '-'}</TableCell>
                      <TableCell>৳{recharge.amount.toLocaleString()}</TableCell>
                      <TableCell>{recharge.commission_rate}%</TableCell>
                      <TableCell className="text-primary">৳{recharge.commission_amount.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            recharge.status === 'completed' ? 'default' : 
                            recharge.status === 'pending' ? 'secondary' : 'destructive'
                          }
                        >
                          {recharge.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
