import { useState, useMemo, useRef } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Store, ArrowUpRight, ArrowDownLeft, Loader2, Download, FileText, Printer } from 'lucide-react';
import { useResellerCredits } from '@/hooks/useResellerCredits';
import { useResellers } from '@/hooks/useResellers';
import { DateRangeFilter } from '@/components/finance/DateRangeFilter';
import { format, parseISO, isWithinInterval, startOfDay, endOfDay, startOfMonth } from 'date-fns';
import jsPDF from 'jspdf';

export default function ResellerCreditReport() {
  const { data: credits, isLoading } = useResellerCredits();
  const { data: resellers } = useResellers();
  const [startDate, setStartDate] = useState<Date | undefined>(startOfMonth(new Date()));
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [selectedResellerId, setSelectedResellerId] = useState<string>('all');
  const tableRef = useRef<HTMLDivElement>(null);

  const filteredCredits = useMemo(() => {
    if (!credits) return [];

    return credits.filter((credit) => {
      // Reseller filter
      if (selectedResellerId !== 'all' && credit.reseller_id !== selectedResellerId) {
        return false;
      }

      // Date filter
      if (!startDate && !endDate) return true;
      
      const creditDate = parseISO(credit.created_at);
      if (startDate && endDate) {
        return isWithinInterval(creditDate, {
          start: startOfDay(startDate),
          end: endOfDay(endDate),
        });
      }
      if (startDate) {
        return creditDate >= startOfDay(startDate);
      }
      if (endDate) {
        return creditDate <= endOfDay(endDate);
      }
      return true;
    });
  }, [credits, startDate, endDate, selectedResellerId]);

  const clearFilters = () => {
    setStartDate(startOfMonth(new Date()));
    setEndDate(new Date());
    setSelectedResellerId('all');
  };

  // Summary calculations
  const totalCredits = filteredCredits.filter(c => c.type === 'credit').reduce((sum, c) => sum + c.amount, 0);
  const totalDebits = filteredCredits.filter(c => c.type === 'debit').reduce((sum, c) => sum + c.amount, 0);
  const creditCount = filteredCredits.filter(c => c.type === 'credit').length;
  const debitCount = filteredCredits.filter(c => c.type === 'debit').length;

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Date', 'Reseller', 'Type', 'Amount', 'Method', 'Balance After', 'Description'];
    const rows = filteredCredits.map(credit => [
      format(new Date(credit.created_at), 'dd MMM yyyy, hh:mm a'),
      credit.resellers?.name || '-',
      credit.type,
      credit.amount.toString(),
      credit.payment_method || '-',
      credit.balance_after.toString(),
      credit.description || '-'
    ]);

    const csvContent = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `reseller-credit-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  // Export to PDF
  const exportToPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    const formatPDF = (amount: number) => `BDT ${amount.toLocaleString()}`;
    
    // Title
    doc.setFontSize(18);
    doc.text('Reseller Credit Report', pageWidth / 2, 20, { align: 'center' });
    
    // Date range
    doc.setFontSize(10);
    const dateRange = `${startDate ? format(startDate, 'dd MMM yyyy') : 'All'} - ${endDate ? format(endDate, 'dd MMM yyyy') : 'All'}`;
    doc.text(`Period: ${dateRange}`, pageWidth / 2, 28, { align: 'center' });

    // Summary
    doc.setFontSize(11);
    doc.text(`Total Credits: ${formatPDF(totalCredits)} (${creditCount} transactions)`, 14, 40);
    doc.text(`Total Debits: ${formatPDF(totalDebits)} (${debitCount} transactions)`, 14, 48);

    // Table headers
    let y = 60;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Date', 14, y);
    doc.text('Reseller', 45, y);
    doc.text('Type', 85, y);
    doc.text('Amount', 105, y);
    doc.text('Method', 135, y);
    doc.text('Balance', 165, y);

    // Table rows
    doc.setFont('helvetica', 'normal');
    y += 8;

    filteredCredits.forEach((credit) => {
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
      doc.text(format(new Date(credit.created_at), 'dd/MM/yy'), 14, y);
      doc.text((credit.resellers?.name || '-').substring(0, 15), 45, y);
      doc.text(credit.type, 85, y);
      doc.text(`${credit.type === 'credit' ? '+' : '-'}${credit.amount.toLocaleString()}`, 105, y);
      doc.text((credit.payment_method || '-').substring(0, 10), 135, y);
      doc.text(credit.balance_after.toLocaleString(), 165, y);
      y += 7;
    });

    doc.save(`reseller-credit-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  // Print
  const handlePrint = () => {
    const printContent = tableRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const dateRange = `${startDate ? format(startDate, 'dd MMM yyyy') : 'All'} - ${endDate ? format(endDate, 'dd MMM yyyy') : 'All'}`;

    printWindow.document.write(`
      <html>
        <head>
          <title>Reseller Credit Report</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { text-align: center; margin-bottom: 5px; }
            .date-range { text-align: center; color: #666; margin-bottom: 20px; }
            .summary { display: flex; gap: 40px; justify-content: center; margin-bottom: 20px; }
            .summary-item { text-align: center; }
            .summary-value { font-size: 24px; font-weight: bold; }
            .summary-label { color: #666; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
            th { background-color: #f5f5f5; font-weight: bold; }
            .credit { color: green; }
            .debit { color: red; }
            @media print { body { -webkit-print-color-adjust: exact; } }
          </style>
        </head>
        <body>
          <h1>Reseller Credit Report</h1>
          <p class="date-range">Period: ${dateRange}</p>
          <div class="summary">
            <div class="summary-item">
              <div class="summary-value credit">৳${totalCredits.toLocaleString()}</div>
              <div class="summary-label">Total Credits (${creditCount})</div>
            </div>
            <div class="summary-item">
              <div class="summary-value debit">৳${totalDebits.toLocaleString()}</div>
              <div class="summary-label">Total Debits (${debitCount})</div>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Reseller</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Balance After</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              ${filteredCredits.map(credit => `
                <tr>
                  <td>${format(new Date(credit.created_at), 'dd MMM yyyy, hh:mm a')}</td>
                  <td>${credit.resellers?.name || '-'}</td>
                  <td><span class="${credit.type}">${credit.type}</span></td>
                  <td class="${credit.type}">${credit.type === 'credit' ? '+' : '-'}৳${credit.amount.toLocaleString()}</td>
                  <td>${credit.payment_method || '-'}</td>
                  <td>৳${credit.balance_after.toLocaleString()}</td>
                  <td>${credit.description || '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <script>window.onload = function() { window.print(); window.close(); }</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <DashboardLayout title="Reseller Credit Report" subtitle="View credit transactions for resellers">
      <div className="space-y-6">
        {/* Filters and Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <DateRangeFilter
              startDate={startDate}
              endDate={endDate}
              onStartDateChange={setStartDate}
              onEndDateChange={setEndDate}
              onClear={clearFilters}
            />
            <Select value={selectedResellerId} onValueChange={setSelectedResellerId}>
              <SelectTrigger className="w-[200px]">
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
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={exportToCSV}>
              <Download className="w-4 h-4 mr-2" />
              CSV
            </Button>
            <Button variant="outline" size="sm" onClick={exportToPDF}>
              <FileText className="w-4 h-4 mr-2" />
              PDF
            </Button>
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-2" />
              Print
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Credits</CardTitle>
              <ArrowUpRight className="w-4 h-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">৳{totalCredits.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">{creditCount} transactions</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Debits</CardTitle>
              <ArrowDownLeft className="w-4 h-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">৳{totalDebits.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">{debitCount} transactions</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Net Balance Change</CardTitle>
              <Store className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${totalCredits - totalDebits >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                ৳{(totalCredits - totalDebits).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">{filteredCredits.length} total transactions</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Resellers</CardTitle>
              <Store className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Set(filteredCredits.map(c => c.reseller_id)).size}
              </div>
              <p className="text-xs text-muted-foreground">With transactions in period</p>
            </CardContent>
          </Card>
        </div>

        {/* Data Table */}
        <div ref={tableRef} className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="p-4 border-b border-border">
            <h3 className="font-semibold flex items-center gap-2">
              <Store className="w-5 h-5" />
              Credit Transaction History ({filteredCredits.length})
            </h3>
          </div>
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
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Balance After</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCredits.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No credit transactions found for the selected filters
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCredits.map((credit) => (
                    <TableRow key={credit.id}>
                      <TableCell>{format(new Date(credit.created_at), 'dd MMM yyyy, hh:mm a')}</TableCell>
                      <TableCell className="font-medium">{credit.resellers?.name || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={credit.type === 'credit' ? 'default' : 'secondary'} className="flex items-center gap-1 w-fit">
                          {credit.type === 'credit' ? (
                            <ArrowUpRight className="w-3 h-3" />
                          ) : (
                            <ArrowDownLeft className="w-3 h-3" />
                          )}
                          {credit.type === 'credit' ? 'Credit' : 'Debit'}
                        </Badge>
                      </TableCell>
                      <TableCell className={credit.type === 'credit' ? 'text-green-500 font-medium' : 'text-red-500 font-medium'}>
                        {credit.type === 'credit' ? '+' : '-'}৳{credit.amount.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{credit.payment_method || '-'}</Badge>
                      </TableCell>
                      <TableCell>৳{credit.balance_after.toLocaleString()}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{credit.description || '-'}</TableCell>
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
