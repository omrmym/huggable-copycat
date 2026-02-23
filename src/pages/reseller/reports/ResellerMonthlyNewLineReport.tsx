import { useState, useMemo } from 'react';
import { format, parseISO, isWithinInterval, startOfDay, endOfDay, startOfMonth } from 'date-fns';
import { ResellerLayout } from '@/components/reseller/ResellerLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { UserPlus, CalendarIcon, X, Printer, Download, FileText, Users, Banknote, CreditCard } from 'lucide-react';
import { useResellerAuth } from '@/contexts/ResellerAuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { ResellerFilter } from '@/components/reseller/ResellerFilter';
import jsPDF from 'jspdf';

const formatBDT = (amount: number) => `৳${amount.toLocaleString('en-BD')}`;

export default function ResellerMonthlyNewLineReport() {
  const [startDate, setStartDate] = useState<Date | undefined>(startOfMonth(new Date()));
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [startOpen, setStartOpen] = useState(false);
  const [endOpen, setEndOpen] = useState(false);
  const [selectedResellerId, setSelectedResellerId] = useState<string | null>(null);

  const { reseller } = useResellerAuth();
  const isSuperAdmin = reseller?.is_super_admin || false;

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['reseller-new-lines', reseller?.id, isSuperAdmin, selectedResellerId],
    queryFn: async () => {
      let query = supabase
        .from('radius_users')
        .select('*')
        .order('connection_date', { ascending: false });
      
      if (isSuperAdmin && selectedResellerId) {
        query = query.eq('reseller_id', selectedResellerId);
      } else if (!isSuperAdmin && reseller?.id) {
        query = query.eq('reseller_id', reseller.id);
      } else {
        query = query.not('reseller_id', 'is', null);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!reseller?.id || isSuperAdmin,
  });

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const connectionDate = user.connection_date ? parseISO(user.connection_date) : parseISO(user.created_at);
      
      if (!startDate && !endDate) return true;
      
      const start = startDate ? startOfDay(startDate) : new Date(0);
      const end = endDate ? endOfDay(endDate) : new Date();
      return isWithinInterval(connectionDate, { start, end });
    });
  }, [users, startDate, endDate]);

  const totals = useMemo(() => {
    return filteredUsers.reduce(
      (acc, user) => ({
        count: acc.count + 1,
        monthlyBill: acc.monthlyBill + (Number(user.monthly_bill) || 0),
        connectionFee: acc.connectionFee + (Number(user.connection_fee) || 0),
      }),
      { count: 0, monthlyBill: 0, connectionFee: 0 }
    );
  }, [filteredUsers]);

  const clearFilter = () => {
    setStartDate(startOfMonth(new Date()));
    setEndDate(new Date());
    setSelectedResellerId(null);
  };

  const hasFilter = startDate || endDate;

  const getDateRangeLabel = () => {
    if (startDate && endDate) {
      return `${format(startDate, 'dd MMM yyyy')} - ${format(endDate, 'dd MMM yyyy')}`;
    } else if (startDate) {
      return `From ${format(startDate, 'dd MMM yyyy')}`;
    } else if (endDate) {
      return `Until ${format(endDate, 'dd MMM yyyy')}`;
    }
    return 'All Time';
  };

  const handlePrint = () => {
    const printContent = `
      <html>
        <head>
          <title>Monthly New Line Report</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #333; border-bottom: 2px solid #333; padding-bottom: 10px; }
            .date-range { color: #666; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            th { background-color: #f5f5f5; font-weight: bold; }
            .amount { text-align: right; }
            .total-row { font-weight: bold; background-color: #f0f9ff; }
            .summary { margin-top: 20px; display: flex; gap: 20px; flex-wrap: wrap; }
            .summary-card { padding: 15px; border: 1px solid #ddd; border-radius: 8px; min-width: 150px; }
          </style>
        </head>
        <body>
          <h1>Monthly New Line Report</h1>
          <p class="date-range">Period: ${getDateRangeLabel()}</p>
          <div class="summary">
            <div class="summary-card">
              <strong>Total New Lines:</strong> ${totals.count}
            </div>
            <div class="summary-card">
              <strong>Total Monthly Bill:</strong> ${formatBDT(totals.monthlyBill)}
            </div>
            <div class="summary-card">
              <strong>Total Connection Fee:</strong> ${formatBDT(totals.connectionFee)}
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Username</th>
                <th>Full Name</th>
                <th>Phone</th>
                <th>Connection Date</th>
                <th class="amount">Monthly Bill</th>
                <th class="amount">Connection Fee</th>
              </tr>
            </thead>
            <tbody>
              ${filteredUsers.map((user, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>${user.username}</td>
                  <td>${user.full_name || '-'}</td>
                  <td>${user.phone || '-'}</td>
                  <td>${user.connection_date ? format(parseISO(user.connection_date), 'dd MMM yyyy') : format(parseISO(user.created_at), 'dd MMM yyyy')}</td>
                  <td class="amount">${formatBDT(Number(user.monthly_bill) || 0)}</td>
                  <td class="amount">${formatBDT(Number(user.connection_fee) || 0)}</td>
                </tr>
              `).join('')}
              <tr class="total-row">
                <td colspan="5">Grand Total (${totals.count} users)</td>
                <td class="amount">${formatBDT(totals.monthlyBill)}</td>
                <td class="amount">${formatBDT(totals.connectionFee)}</td>
              </tr>
            </tbody>
          </table>
          <p style="margin-top: 30px; color: #666; font-size: 12px;">
            Generated on: ${format(new Date(), 'dd MMM yyyy, hh:mm a')}
          </p>
        </body>
      </html>
    `;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleDownloadCSV = () => {
    const headers = ['#', 'Username', 'Full Name', 'Phone', 'Connection Date', 'Monthly Bill', 'Connection Fee'];
    const rows = filteredUsers.map((user, index) => [
      (index + 1).toString(),
      user.username,
      user.full_name || '-',
      user.phone || '-',
      user.connection_date ? format(parseISO(user.connection_date), 'dd MMM yyyy') : format(parseISO(user.created_at), 'dd MMM yyyy'),
      (Number(user.monthly_bill) || 0).toString(),
      (Number(user.connection_fee) || 0).toString(),
    ]);

    rows.push([
      '',
      `Grand Total (${totals.count} users)`,
      '',
      '',
      '',
      totals.monthlyBill.toString(),
      totals.connectionFee.toString(),
    ]);

    const csvContent = [
      `Monthly New Line Report - ${getDateRangeLabel()}`,
      '',
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `reseller-monthly-new-line-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text('Monthly New Line Report', 14, 22);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Period: ${getDateRangeLabel()}`, 14, 32);
    doc.text(`Generated: ${format(new Date(), 'dd MMM yyyy, hh:mm a')}`, 14, 38);

    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text(`Total New Lines: ${totals.count}`, 14, 50);
    doc.text(`Total Monthly Bill: ${formatBDT(totals.monthlyBill)}`, 14, 58);
    doc.text(`Total Connection Fee: ${formatBDT(totals.connectionFee)}`, 14, 66);

    let y = 80;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('#', 14, y);
    doc.text('Username', 22, y);
    doc.text('Full Name', 50, y);
    doc.text('Phone', 95, y);
    doc.text('Date', 130, y);
    doc.text('Bill', 155, y);
    doc.text('Conn. Fee', 175, y);

    doc.setFont('helvetica', 'normal');
    y += 8;

    filteredUsers.forEach((user, index) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.text((index + 1).toString(), 14, y);
      doc.text(user.username.substring(0, 12), 22, y);
      doc.text((user.full_name || '-').substring(0, 18), 50, y);
      doc.text((user.phone || '-').substring(0, 14), 95, y);
      const connDate = user.connection_date ? format(parseISO(user.connection_date), 'dd/MM/yy') : format(parseISO(user.created_at), 'dd/MM/yy');
      doc.text(connDate, 130, y);
      doc.text(formatBDT(Number(user.monthly_bill) || 0), 155, y);
      doc.text(formatBDT(Number(user.connection_fee) || 0), 175, y);
      y += 6;
    });

    y += 5;
    doc.setFont('helvetica', 'bold');
    doc.text(`Grand Total (${totals.count} users)`, 22, y);
    doc.text(formatBDT(totals.monthlyBill), 155, y);
    doc.text(formatBDT(totals.connectionFee), 175, y);

    doc.save(`reseller-monthly-new-line-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  return (
    <ResellerLayout title={isSuperAdmin ? "All Resellers Monthly New Line" : "Monthly New Line Report"}>
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Monthly New Line Report
            </CardTitle>

            <div className="flex flex-wrap items-center gap-2">
              {isSuperAdmin && (
                <ResellerFilter
                  selectedResellerId={selectedResellerId}
                  onResellerChange={setSelectedResellerId}
                />
              )}
              <Popover open={startOpen} onOpenChange={setStartOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-[140px] justify-start text-left font-normal',
                      !startDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, 'dd MMM yyyy') : 'Start date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => {
                      setStartDate(date);
                      setStartOpen(false);
                    }}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>

              <span className="text-muted-foreground">to</span>

              <Popover open={endOpen} onOpenChange={setEndOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-[140px] justify-start text-left font-normal',
                      !endDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, 'dd MMM yyyy') : 'End date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={(date) => {
                      setEndDate(date);
                      setEndOpen(false);
                    }}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>

              {hasFilter && (
                <Button variant="ghost" size="icon" onClick={clearFilter} title="Clear filter">
                  <X className="h-4 w-4" />
                </Button>
              )}

              <Button variant="outline" onClick={handleDownloadCSV}>
                <FileText className="w-4 h-4 mr-2" />CSV
              </Button>
              <Button variant="outline" onClick={handlePrint}>
                <Printer className="w-4 h-4 mr-2" />Print
              </Button>
              <Button variant="outline" onClick={handleDownloadPDF}>
                <Download className="w-4 h-4 mr-2" />PDF
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total New Lines</p>
                    <p className="text-2xl font-bold">{isLoading ? <Skeleton className="h-8 w-16" /> : totals.count}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <Banknote className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Monthly Bill</p>
                    <p className="text-2xl font-bold">{isLoading ? <Skeleton className="h-8 w-24" /> : formatBDT(totals.monthlyBill)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <CreditCard className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Connection Fee</p>
                    <p className="text-2xl font-bold">{isLoading ? <Skeleton className="h-8 w-24" /> : formatBDT(totals.connectionFee)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              No new lines found for the selected period.
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Full Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Connection Date</TableHead>
                    <TableHead className="text-right">Monthly Bill</TableHead>
                    <TableHead className="text-right">Connection Fee</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user, index) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell className="font-medium">{user.username}</TableCell>
                      <TableCell>{user.full_name || '-'}</TableCell>
                      <TableCell>{user.phone || '-'}</TableCell>
                      <TableCell>
                        {user.connection_date 
                          ? format(parseISO(user.connection_date), 'dd MMM yyyy') 
                          : format(parseISO(user.created_at), 'dd MMM yyyy')}
                      </TableCell>
                      <TableCell className="text-right">{formatBDT(Number(user.monthly_bill) || 0)}</TableCell>
                      <TableCell className="text-right">{formatBDT(Number(user.connection_fee) || 0)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted/50 font-bold">
                    <TableCell colSpan={5}>Grand Total ({totals.count} users)</TableCell>
                    <TableCell className="text-right">{formatBDT(totals.monthlyBill)}</TableCell>
                    <TableCell className="text-right">{formatBDT(totals.connectionFee)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </ResellerLayout>
  );
}
