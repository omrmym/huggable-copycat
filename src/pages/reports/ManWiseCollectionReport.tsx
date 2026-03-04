import { useState, useMemo } from 'react';
import { format, parseISO, isWithinInterval, startOfDay, endOfDay, startOfMonth } from 'date-fns';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, CalendarIcon, X, Printer, Download, FileText, TrendingUp, Clock, CheckCircle } from 'lucide-react';
import { useTransactions } from '@/hooks/useTransactions';
import { cn } from '@/lib/utils';
import jsPDF from 'jspdf';

const formatBDT = (amount: number) => `৳${amount.toLocaleString('en-BD')}`;
const formatBDTForPDF = (amount: number) => `BDT ${amount.toLocaleString('en-BD')}`;

export default function ManWiseCollectionReport() {
  const [startDate, setStartDate] = useState<Date | undefined>(startOfMonth(new Date()));
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [startOpen, setStartOpen] = useState(false);
  const [endOpen, setEndOpen] = useState(false);
  const [selectedCollector, setSelectedCollector] = useState<string>('all');

  const { data: transactions = [], isLoading } = useTransactions();

  // Get unique collector names for the filter
  const collectors = useMemo(() => {
    const names = new Set<string>();
    transactions.forEach(tx => {
      if (tx.collected_by) names.add(tx.collected_by);
    });
    return Array.from(names).sort();
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    let filtered = transactions;
    
    // Date filter
    if (startDate || endDate) {
      filtered = filtered.filter(tx => {
        const date = parseISO(tx.created_at);
        const start = startDate ? startOfDay(startDate) : new Date(0);
        const end = endDate ? endOfDay(endDate) : new Date();
        return isWithinInterval(date, { start, end });
      });
    }

    // Collector filter
    if (selectedCollector !== 'all') {
      filtered = filtered.filter(tx => (tx.collected_by || 'Unknown') === selectedCollector);
    }

    return filtered;
  }, [transactions, startDate, endDate, selectedCollector]);

  const collectorStats = useMemo(() => {
    const stats: Record<string, { 
      collector: string; 
      total: number; 
      approved: number; 
      pending: number; 
      transactionCount: number;
      approvedCount: number;
      pendingCount: number;
    }> = {};

    filteredTransactions.forEach(tx => {
      const collector = tx.collected_by || 'Unknown';
      
      if (!stats[collector]) {
        stats[collector] = {
          collector,
          total: 0,
          approved: 0,
          pending: 0,
          transactionCount: 0,
          approvedCount: 0,
          pendingCount: 0,
        };
      }

      stats[collector].total += Number(tx.amount) || 0;
      stats[collector].transactionCount += 1;

      if (tx.status === 'completed') {
        stats[collector].approved += Number(tx.amount) || 0;
        stats[collector].approvedCount += 1;
      } else if (tx.status === 'pending') {
        stats[collector].pending += Number(tx.amount) || 0;
        stats[collector].pendingCount += 1;
      }
    });

    return Object.values(stats).sort((a, b) => b.total - a.total);
  }, [filteredTransactions]);

  const totals = useMemo(() => {
    return collectorStats.reduce(
      (acc, stat) => ({
        total: acc.total + stat.total,
        approved: acc.approved + stat.approved,
        pending: acc.pending + stat.pending,
        transactionCount: acc.transactionCount + stat.transactionCount,
      }),
      { total: 0, approved: 0, pending: 0, transactionCount: 0 }
    );
  }, [collectorStats]);

  const clearFilter = () => {
    setStartDate(startOfMonth(new Date()));
    setEndDate(new Date());
    setSelectedCollector('all');
  };

  const hasFilter = startDate || endDate || selectedCollector !== 'all';

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
          <title>Man Wise Bill Collection Report</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #333; border-bottom: 2px solid #333; padding-bottom: 10px; }
            .date-range { color: #666; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            th { background-color: #f5f5f5; font-weight: bold; }
            .amount { text-align: right; }
            .approved { color: #16a34a; }
            .pending { color: #f59e0b; }
            .total-row { font-weight: bold; background-color: #f0f9ff; }
            .summary { margin-top: 20px; display: flex; gap: 20px; }
            .summary-card { padding: 15px; border: 1px solid #ddd; border-radius: 8px; }
          </style>
        </head>
        <body>
          <h1>Man Wise Bill Collection Report</h1>
          <p class="date-range">Period: ${getDateRangeLabel()}</p>
          <div class="summary">
            <div class="summary-card">
              <strong>Total Collection:</strong> ${formatBDT(totals.total)}
            </div>
            <div class="summary-card approved">
              <strong>Approved:</strong> ${formatBDT(totals.approved)}
            </div>
            <div class="summary-card pending">
              <strong>Pending:</strong> ${formatBDT(totals.pending)}
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Collector Name</th>
                <th class="amount">Total Bills</th>
                <th class="amount">Total Amount</th>
                <th class="amount">Approved</th>
                <th class="amount">Pending</th>
              </tr>
            </thead>
            <tbody>
              ${collectorStats.map((stat, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>${stat.collector}</td>
                  <td class="amount">${stat.transactionCount}</td>
                  <td class="amount">${formatBDT(stat.total)}</td>
                  <td class="amount approved">${formatBDT(stat.approved)}</td>
                  <td class="amount pending">${formatBDT(stat.pending)}</td>
                </tr>
              `).join('')}
              <tr class="total-row">
                <td colspan="2">Grand Total</td>
                <td class="amount">${totals.transactionCount}</td>
                <td class="amount">${formatBDT(totals.total)}</td>
                <td class="amount approved">${formatBDT(totals.approved)}</td>
                <td class="amount pending">${formatBDT(totals.pending)}</td>
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
    const headers = ['#', 'Collector Name', 'Total Bills', 'Total Amount', 'Approved Amount', 'Pending Amount'];
    const rows = collectorStats.map((stat, index) => [
      (index + 1).toString(),
      stat.collector,
      stat.transactionCount.toString(),
      stat.total.toString(),
      stat.approved.toString(),
      stat.pending.toString(),
    ]);

    rows.push([
      '',
      'Grand Total',
      totals.transactionCount.toString(),
      totals.total.toString(),
      totals.approved.toString(),
      totals.pending.toString(),
    ]);

    const csvContent = [
      `Man Wise Bill Collection Report - ${getDateRangeLabel()}`,
      '',
      headers.join(','),
      ...rows.map(row => row.join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `man-wise-collection-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text('Man Wise Bill Collection Report', 14, 22);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Period: ${getDateRangeLabel()}`, 14, 32);
    doc.text(`Generated: ${format(new Date(), 'dd MMM yyyy, hh:mm a')}`, 14, 38);

    // Summary
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text(`Total Collection: ${formatBDTForPDF(totals.total)}`, 14, 50);
    doc.text(`Approved: ${formatBDTForPDF(totals.approved)}`, 14, 58);
    doc.text(`Pending: ${formatBDTForPDF(totals.pending)}`, 14, 66);

    // Table
    let y = 80;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('#', 14, y);
    doc.text('Collector', 24, y);
    doc.text('Bills', 80, y);
    doc.text('Total', 100, y);
    doc.text('Approved', 130, y);
    doc.text('Pending', 165, y);

    doc.setFont('helvetica', 'normal');
    y += 8;

    collectorStats.forEach((stat, index) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.text((index + 1).toString(), 14, y);
      doc.text(stat.collector.substring(0, 20), 24, y);
      doc.text(stat.transactionCount.toString(), 80, y);
      doc.text(formatBDTForPDF(stat.total), 100, y);
      doc.text(formatBDTForPDF(stat.approved), 130, y);
      doc.text(formatBDTForPDF(stat.pending), 165, y);
      y += 7;
    });

    // Grand Total
    y += 5;
    doc.setFont('helvetica', 'bold');
    doc.text('Grand Total', 24, y);
    doc.text(totals.transactionCount.toString(), 80, y);
    doc.text(formatBDTForPDF(totals.total), 100, y);
    doc.text(formatBDTForPDF(totals.approved), 130, y);
    doc.text(formatBDTForPDF(totals.pending), 165, y);

    doc.save(`man-wise-collection-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  return (
    <DashboardLayout title="Man Wise Bill Collection Report">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Man Wise Bill Collection Report
            </CardTitle>

            <div className="flex flex-wrap items-center gap-2">
              <Select value={selectedCollector} onValueChange={setSelectedCollector}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Collectors" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Collectors</SelectItem>
                  {collectors.map(name => (
                    <SelectItem key={name} value={name}>{name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <TrendingUp className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Collection</p>
                    <p className="text-2xl font-bold">{isLoading ? <Skeleton className="h-8 w-24" /> : formatBDT(totals.total)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Approved</p>
                    <p className="text-2xl font-bold text-green-600">{isLoading ? <Skeleton className="h-8 w-24" /> : formatBDT(totals.approved)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-yellow-500/10">
                    <Clock className="w-5 h-5 text-yellow-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Pending</p>
                    <p className="text-2xl font-bold text-yellow-600">{isLoading ? <Skeleton className="h-8 w-24" /> : formatBDT(totals.pending)}</p>
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
          ) : collectorStats.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              No transactions found for the selected period.
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Collector Name</TableHead>
                    <TableHead className="text-right">Total Bills</TableHead>
                    <TableHead className="text-right">Total Amount</TableHead>
                    <TableHead className="text-right">Approved</TableHead>
                    <TableHead className="text-right">Pending</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {collectorStats.map((stat, index) => (
                    <TableRow key={stat.collector}>
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell className="font-medium">{stat.collector}</TableCell>
                      <TableCell className="text-right">{stat.transactionCount}</TableCell>
                      <TableCell className="text-right font-medium">{formatBDT(stat.total)}</TableCell>
                      <TableCell className="text-right text-green-600">{formatBDT(stat.approved)}</TableCell>
                      <TableCell className="text-right text-yellow-600">{formatBDT(stat.pending)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted/50 font-bold">
                    <TableCell colSpan={2}>Grand Total</TableCell>
                    <TableCell className="text-right">{totals.transactionCount}</TableCell>
                    <TableCell className="text-right">{formatBDT(totals.total)}</TableCell>
                    <TableCell className="text-right text-green-600">{formatBDT(totals.approved)}</TableCell>
                    <TableCell className="text-right text-yellow-600">{formatBDT(totals.pending)}</TableCell>
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
