import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useResellerAuth } from '@/contexts/ResellerAuthContext';
import { ResellerLayout } from '@/components/reseller/ResellerLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';

export default function ResellerRechargesPage() {
  const { reseller, isLoading } = useResellerAuth();
  const navigate = useNavigate();

  const isSuperAdmin = reseller?.is_super_admin || false;

  useEffect(() => {
    if (!isLoading && !reseller) {
      navigate('/reseller/login', { replace: true });
    }
  }, [reseller, isLoading, navigate]);

  const { data: recharges, isLoading: loadingRecharges } = useQuery({
    queryKey: ['reseller-recharges', reseller?.id, isSuperAdmin],
    queryFn: async () => {
      if (!reseller?.id && !isSuperAdmin) return [];
      
      let query = supabase
        .from('reseller_user_recharges')
        .select('*, radius_users(username, full_name), billing_plans(name), resellers(name)')
        .order('created_at', { ascending: false });
      
      if (!isSuperAdmin) {
        query = query.eq('reseller_id', reseller!.id);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data;
    },
    enabled: !!reseller?.id || isSuperAdmin,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!reseller) return null;

  return (
    <ResellerLayout 
      title={isSuperAdmin ? "All Recharge History" : "Recharge History"} 
      subtitle={isSuperAdmin ? "View all user recharges across resellers" : "View all user recharges you have performed"}
    >
      <Card>
        <CardHeader>
          <CardTitle>User Recharges</CardTitle>
          <CardDescription>
            {isSuperAdmin ? "Complete history of recharges from all resellers" : "Complete history of recharges done by your account"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingRecharges ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : recharges?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No recharges found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  {isSuperAdmin && <TableHead>Reseller</TableHead>}
                  <TableHead>User</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Commission</TableHead>
                  <TableHead className="text-right">Net Cost</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recharges?.map((recharge) => (
                  <TableRow key={recharge.id}>
                    <TableCell className="text-sm">
                      {format(new Date(recharge.created_at), 'dd MMM yyyy, hh:mm a')}
                    </TableCell>
                    {isSuperAdmin && (
                      <TableCell>
                        <span className="font-medium text-primary">
                          {(recharge as any).resellers?.name || '-'}
                        </span>
                      </TableCell>
                    )}
                    <TableCell>
                      <div>
                        <p className="font-medium">{recharge.radius_users?.full_name || '-'}</p>
                        <p className="text-xs text-muted-foreground font-mono">{recharge.radius_users?.username}</p>
                      </div>
                    </TableCell>
                    <TableCell>{recharge.billing_plans?.name || '-'}</TableCell>
                    <TableCell className="text-right">৳{recharge.amount}</TableCell>
                    <TableCell className="text-right text-success">
                      ৳{recharge.commission_amount} ({recharge.commission_rate}%)
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ৳{(recharge.amount - recharge.commission_amount).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={recharge.status === 'completed' ? 'default' : 'secondary'}>
                        {recharge.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </ResellerLayout>
  );
}
