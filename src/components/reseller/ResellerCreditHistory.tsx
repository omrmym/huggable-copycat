import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ResellerBkashRecharge } from './ResellerBkashRecharge';

interface ResellerCreditHistoryProps {
  resellerId: string;
  resellerName?: string;
  currentBalance?: number;
  isSuperAdmin?: boolean;
}

export function ResellerCreditHistory({ resellerId, resellerName, currentBalance = 0, isSuperAdmin = false }: ResellerCreditHistoryProps) {
  const { data: credits, isLoading } = useQuery({
    queryKey: ['reseller-credits', resellerId, isSuperAdmin],
    queryFn: async () => {
      let query = supabase
        .from('reseller_credits')
        .select('*, resellers(name)')
        .order('created_at', { ascending: false });
      
      if (!isSuperAdmin) {
        query = query.eq('reseller_id', resellerId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* bKash Recharge Card - Only show for non-super admin resellers */}
      {!isSuperAdmin && resellerName && (
        <ResellerBkashRecharge 
          resellerId={resellerId}
          resellerName={resellerName}
          currentBalance={currentBalance}
        />
      )}
      
      <Card>
      <CardHeader>
        <CardTitle>Credit History</CardTitle>
        <CardDescription>
          {isSuperAdmin ? "Credit transactions across all resellers" : "Your credit transactions and balance history"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {credits?.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No credit transactions found
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                {isSuperAdmin && <TableHead>Reseller</TableHead>}
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Method</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Balance After</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {credits?.map((credit) => (
                <TableRow key={credit.id}>
                  <TableCell className="text-sm">
                    {format(new Date(credit.created_at), 'dd MMM yyyy, hh:mm a')}
                  </TableCell>
                  {isSuperAdmin && (
                    <TableCell>
                      <span className="font-medium text-primary">
                        {(credit as any).resellers?.name || '-'}
                      </span>
                    </TableCell>
                  )}
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {credit.type === 'credit' ? (
                        <ArrowUpCircle className="w-4 h-4 text-success" />
                      ) : (
                        <ArrowDownCircle className="w-4 h-4 text-destructive" />
                      )}
                      <Badge variant={credit.type === 'credit' ? 'default' : 'secondary'}>
                        {credit.type}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {credit.description || '-'}
                  </TableCell>
                  <TableCell>{credit.payment_method || '-'}</TableCell>
                  <TableCell className={`text-right font-medium ${credit.type === 'credit' ? 'text-success' : 'text-destructive'}`}>
                    {credit.type === 'credit' ? '+' : '-'}৳{credit.amount.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    ৳{credit.balance_after.toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
    </div>
  );
}
