import { useState, useMemo } from 'react';
import { format, parseISO, isWithinInterval, startOfDay, endOfDay, startOfMonth } from 'date-fns';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Clock, CalendarIcon, X, Printer, Download, FileText, Users, Banknote, AlertTriangle } from 'lucide-react';
import { useRadiusUsers } from '@/hooks/useRadiusUsers';
import { cn } from '@/lib/utils';
import jsPDF from 'jspdf';

const formatBDT = (amount: number) => `৳${amount.toLocaleString('en-BD')}`;
const formatBDTForPDF = (amount: number) => `BDT ${amount.toLocaleString('en-BD')}`;

export default function MonthlyExpireReport() {
  const [startDate, setStartDate] = useState<Date | undefined>(startOfMonth(new Date()));
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [startOpen, setStartOpen] = useState(false);
  const [endOpen, setEndOpen] = useState(false);

  const { data: users = [], isLoading } = useRadiusUsers();

  // Filter only expired users
  const expiredUsers = useMemo(() => {
    return users.filter(user => user.status === 'expired');
  }, [users]);

  // Apply date filter based on expires_at date
  const filteredUsers = useMemo(() => {
    return expiredUsers.filter(user => {
      if (!user.expires_at) return false;
      
      const expiryDate = parseISO(user.expires_at);
      
      if (!startDate && !endDate) return true;
      
      const start = startDate ? startOfDay(startDate) : new Date(0);
      const end = endDate ? endOfDay(endDate) : new Date();
      return isWithinInterval(expiryDate, { start, end });
    });
  }, [expiredUsers, startDate, endDate]);

  const totals = useMemo(() => {
    return filteredUsers.reduce(
      (acc, user) => ({
        count: acc.count + 1,
        monthlyBill: acc.monthlyBill + (Number(user.monthly_bill) || Number(user.plan?.price) || 0),
      }),
      { count: 0, monthlyBill: 0 }
    );
  }, [filteredUsers]);

  const clearFilter = () => {
    setStartDate(startOfMonth(new Date()));
    setEndDate(new Date());
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

  const getUserBill = (user: typeof filteredUsers[0]) => {
    return Number(user.monthly_bill) || Number(user.plan?.price) || 0;
  };

  const handlePrint = () => {
    const printContent = `
      <html>
        <head>
          <title>Monthly Expire User Report</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #333; border-bottom: 2px solid #333; padding-bottom: 10px; }
            .date-range { color: #666; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            th { background-color: #f5f5f5; font-weight: bold; }
            .amount { text-align: right; }
            .total-row { font-weight: bold; background-color: #fef2f2; }
            .summary { margin-top: 20px; display: flex; gap: 20px; flex-wrap: wrap; }
            .summary-card { padding: 15px; border: 1px solid #ddd; border-radius: 8px; min-width: 150px; }
            .expired { color: #dc2626; }
          </style>
        </head>
        <body>
          <h1>Monthly Expire User Report</h1>
          <p class="date-range">Period: ${getDateRangeLabel()}</p>
          <div class="summary">
            <div class="summary-card expired">
              <strong>Total Expired Users:</strong> ${totals.count}
            </div>
            <div class="summary-card">
              <strong>Total Pending Bill:</strong> ${formatBDT(totals.monthlyBill)}
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Username</th>
                <th>Full Name</th>
                <th>Phone</th>
                <th>Plan</th>
                <th>Expired Date</th>
                <th class="amount">Monthly Bill</th>
              </tr>
            </thead>
            <tbody>
              ${filteredUsers.map((user, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>${user.username}</td>
                  <td>${user.full_name || '-'}</td>
                  <td>${user.phone || '-'}</td>
                  <td>${user.plan?.name || '-'}</td>
                  <td class="expired">${user.expires_at ? format(parseISO(user.expires_at), 'dd MMM yyyy') : '-'}</td>
                  <td class="amount">${formatBDT(getUserBill(user))}</td>
                </tr>
              `).join('')}
              <tr class="total-row">
                <td colspan="6">Grand Total (${totals.count} expired users)</td>
                <td class="amount">${formatBDT(totals.monthlyBill)}</td>
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
    const headers = ['#', 'Username', 'Full Name', 'Phone', 'Plan', 'Expired Date', 'Monthly Bill'];
    const rows = filteredUsers.map((user, index) => [
      (index + 1).toString(),
      user.username,
      user.full_name || '-',
      user.phone || '-',
      user.plan?.name || '-',
      user.expires_at ? format(parseISO(user.expires_at), 'dd MMM yyyy') : '-',
      getUserBill(user).toString(),
    ]);

    rows.push([
      '',
      `Grand Total (${totals.count} expired users)`,
      '',
      '',
      '',
      '',
      totals.monthlyBill.toString(),
    ]);

    const csvContent = [
      `Monthly Expire User Report - ${getDateRangeLabel()}`,
      '',
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `monthly-expire-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text('Monthly Expire User Report', 14, 22);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Period: ${getDateRangeLabel()}`, 14, 32);
    doc.text(`Generated: ${format(new Date(), 'dd MMM yyyy, hh:mm a')}`, 14, 38);

    // Summary
    doc.setFontSize(12);
    doc.setTextColor(220, 38, 38); // Red for expired
    doc.text(`Total Expired Users: ${totals.count}`, 14, 50);
    doc.setTextColor(0);
    doc.text(`Total Pending Bill: ${formatBDTForPDF(totals.monthlyBill)}`, 14, 58);

    // Table
    let y = 72;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('#', 14, y);
    doc.text('Username', 22, y);
    doc.text('Full Name', 50, y);
    doc.text('Phone', 90, y);
    doc.text('Plan', 125, y);
    doc.text('Expired', 155, y);
    doc.text('Bill', 180, y);

    doc.setFont('helvetica', 'normal');
    y += 8;

    filteredUsers.forEach((user, index) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.text((index + 1).toString(), 14, y);
      doc.text(user.username.substring(0, 12), 22, y);
      doc.text((user.full_name || '-').substring(0, 16), 50, y);
      doc.text((user.phone || '-').substring(0, 14), 90, y);
      doc.text((user.plan?.name || '-').substring(0, 12), 125, y);
      doc.setTextColor(220, 38, 38);
      doc.text(user.expires_at ? format(parseISO(user.expires_at), 'dd/MM/yy') : '-', 155, y);
      doc.setTextColor(0);
      doc.text(formatBDTForPDF(getUserBill(user)), 180, y);
      y += 6;
    });

    // Grand Total
    y += 5;
    doc.setFont('helvetica', 'bold');
    doc.text(`Grand Total (${totals.count} expired)`, 22, y);
    doc.text(formatBDTForPDF(totals.monthlyBill), 180, y);

    doc.save(`monthly-expire-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  return (
    <DashboardLayout title="Monthly Expire User Report">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Monthly Expire User Report
            </CardTitle>

            <div className="flex flex-wrap items-center gap-2">
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
                <FileText className="w-4 h-4 mr-2" />
                CSV
              </Button>
              <Button variant="outline" onClick={handlePrint}>
                <Printer className="w-4 h-4 mr-2" />
                Print
              </Button>
              <Button variant="outline" onClick={handleDownloadPDF}>
                <Download className="w-4 h-4 mr-2" />
                PDF
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-destructive/10">
                    <AlertTriangle className="w-5 h-5 text-destructive" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Expired Users</p>
                    <p className="text-2xl font-bold text-destructive">{isLoading ? <Skeleton className="h-8 w-16" /> : totals.count}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Banknote className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Pending Bill</p>
                    <p className="text-2xl font-bold">{isLoading ? <Skeleton className="h-8 w-24" /> : formatBDT(totals.monthlyBill)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Data Table */}
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              No expired users found for the selected period.
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
                    <TableHead>Plan</TableHead>
                    <TableHead>Expired Date</TableHead>
                    <TableHead className="text-right">Monthly Bill</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user, index) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell className="font-medium">{user.username}</TableCell>
                      <TableCell>{user.full_name || '-'}</TableCell>
                      <TableCell>{user.phone || '-'}</TableCell>
                      <TableCell>{user.plan?.name || '-'}</TableCell>
                      <TableCell className="text-destructive">
                        {user.expires_at ? format(parseISO(user.expires_at), 'dd MMM yyyy') : '-'}
                      </TableCell>
                      <TableCell className="text-right">{formatBDT(getUserBill(user))}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-destructive/5 font-bold">
                    <TableCell colSpan={6}>Grand Total ({totals.count} expired users)</TableCell>
                    <TableCell className="text-right">{formatBDT(totals.monthlyBill)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
