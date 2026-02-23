import { useState, useMemo, useRef } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTransactions } from '@/hooks/useTransactions';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Calendar, Download, DollarSign, Printer, FileText } from 'lucide-react';
import { format, startOfDay, endOfDay, eachDayOfInterval, startOfMonth } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import jsPDF from 'jspdf';

export default function BillingReport() {
  const tableRef = useRef<HTMLDivElement>(null);
  const { data: transactions = [], isLoading } = useTransactions();
  
  // Default to current month
  const [startDate, setStartDate] = useState<Date | undefined>(startOfMonth(new Date()));
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());

  // Calculate daily income within date range
  const dailyIncome = useMemo(() => {
    if (!startDate || !endDate) return [];
    
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    
    return days.map(date => {
      const dayStart = startOfDay(date);
      const dayEnd = endOfDay(date);
      
      const dayTransactions = transactions.filter(tx => {
        const txDate = new Date(tx.created_at);
        return txDate >= dayStart && txDate <= dayEnd && tx.status === 'completed';
      });
      
      const totalAmount = dayTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
      const count = dayTransactions.length;
      
      return {
        date,
        formattedDate: format(date, 'dd/MM/yyyy'),
        dayName: format(date, 'EEEE'),
        amount: totalAmount,
        count,
      };
    }).reverse(); // Most recent first
  }, [transactions, startDate, endDate]);

  // Calculate total income for the period
  const totalIncome = useMemo(() => {
    return dailyIncome.reduce((sum, day) => sum + day.amount, 0);
  }, [dailyIncome]);

  const totalTransactions = useMemo(() => {
    return dailyIncome.reduce((sum, day) => sum + day.count, 0);
  }, [dailyIncome]);

  const handleExportCSV = () => {
    const headers = ['Date', 'Day', 'Transactions', 'Amount'];
    const rows = dailyIncome.map(day => [
      day.formattedDate,
      day.dayName,
      day.count,
      day.amount
    ]);
    
    // Add total row
    rows.push(['', 'Total', totalTransactions, totalIncome]);
    
    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `daily-income-${format(startDate || new Date(), 'yyyy-MM-dd')}-to-${format(endDate || new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    const printContent = tableRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const dateRange = `${format(startDate || new Date(), 'dd/MM/yyyy')} - ${format(endDate || new Date(), 'dd/MM/yyyy')}`;

    printWindow.document.write(`
      <html>
        <head>
          <title>Daily Income Report - ${dateRange}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { font-size: 24px; margin-bottom: 5px; }
            .subtitle { color: #666; margin-bottom: 20px; }
            .summary { background: #f5f5f5; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
            .summary-title { font-size: 14px; color: #666; }
            .summary-value { font-size: 28px; font-weight: bold; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 12px 8px; text-align: left; }
            th { background-color: #f5f5f5; font-weight: 600; }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .total-row { background-color: #f5f5f5; font-weight: bold; }
            @media print { body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
          </style>
        </head>
        <body>
          <h1>Daily Income Report</h1>
          <p class="subtitle">${dateRange}</p>
          <div class="summary">
            <div class="summary-title">Total Income</div>
            <div class="summary-value">৳${totalIncome.toLocaleString()}</div>
            <div class="summary-title">${totalTransactions} transactions</div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Day</th>
                <th class="text-center">Transactions</th>
                <th class="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${dailyIncome.map(day => `
                <tr>
                  <td>${day.formattedDate}</td>
                  <td>${day.dayName}</td>
                  <td class="text-center">${day.count}</td>
                  <td class="text-right">৳${day.amount.toLocaleString()}</td>
                </tr>
              `).join('')}
              <tr class="total-row">
                <td colspan="2">Total</td>
                <td class="text-center">${totalTransactions}</td>
                <td class="text-right">৳${totalIncome.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    const dateRange = `${format(startDate || new Date(), 'dd/MM/yyyy')} - ${format(endDate || new Date(), 'dd/MM/yyyy')}`;
    
    const formatPDF = (amount: number) => `BDT ${amount.toLocaleString()}`;
    
    // Title
    doc.setFontSize(20);
    doc.text('Daily Income Report', 20, 20);
    
    // Date range
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(dateRange, 20, 30);
    
    // Summary
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text(`Total Income: ${formatPDF(totalIncome)}`, 20, 45);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`${totalTransactions} transactions`, 20, 52);
    
    // Table header
    let yPos = 65;
    doc.setFontSize(11);
    doc.setTextColor(0);
    doc.setFillColor(245, 245, 245);
    doc.rect(20, yPos - 5, 170, 10, 'F');
    doc.text('Date', 22, yPos);
    doc.text('Day', 62, yPos);
    doc.text('Transactions', 102, yPos);
    doc.text('Amount', 152, yPos);
    
    yPos += 10;
    
    // Table rows
    doc.setFontSize(10);
    dailyIncome.forEach((day) => {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
      doc.text(day.formattedDate, 22, yPos);
      doc.text(day.dayName, 62, yPos);
      doc.text(String(day.count), 112, yPos);
      doc.text(formatPDF(day.amount), 152, yPos);
      yPos += 8;
    });
    
    // Total row
    if (yPos > 270) {
      doc.addPage();
      yPos = 20;
    }
    doc.setFillColor(245, 245, 245);
    doc.rect(20, yPos - 5, 170, 10, 'F');
    doc.setFontSize(11);
    doc.text('Total', 22, yPos);
    doc.text(String(totalTransactions), 112, yPos);
    doc.text(formatPDF(totalIncome), 152, yPos);
    
    doc.save(`daily-income-${format(startDate || new Date(), 'yyyy-MM-dd')}-to-${format(endDate || new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  const clearFilters = () => {
    setStartDate(startOfMonth(new Date()));
    setEndDate(new Date());
  };

  return (
    <DashboardLayout title="Billing Report" subtitle="Daily income overview">
      {/* Summary Card */}
      <Card className="bg-card border-border mb-6">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Total Income</CardTitle>
          <DollarSign className="w-4 h-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {isLoading ? <Skeleton className="h-8 w-24" /> : `৳${totalIncome.toLocaleString()}`}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {totalTransactions} transactions in selected period
          </p>
        </CardContent>
      </Card>

      {/* Date Filter */}
      <Card className="bg-card border-border mb-6">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Date Range</CardTitle>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Reset
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportCSV}>
                <Download className="w-4 h-4 mr-2" />
                CSV
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
                <FileText className="w-4 h-4 mr-2" />
                PDF
              </Button>
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="w-4 h-4 mr-2" />
                Print
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-[200px] justify-start text-left font-normal", !startDate && "text-muted-foreground")}>
                  <Calendar className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "dd/MM/yyyy") : "Start Date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <CalendarComponent mode="single" selected={startDate} onSelect={setStartDate} initialFocus />
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-[200px] justify-start text-left font-normal", !endDate && "text-muted-foreground")}>
                  <Calendar className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, "dd/MM/yyyy") : "End Date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <CalendarComponent mode="single" selected={endDate} onSelect={setEndDate} initialFocus />
              </PopoverContent>
            </Popover>
          </div>
        </CardContent>
      </Card>

      {/* Daily Income Table */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg">Daily Income</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <div ref={tableRef} className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Day</TableHead>
                    <TableHead className="text-center">Transactions</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dailyIncome.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        No data found for selected date range
                      </TableCell>
                    </TableRow>
                  ) : (
                    <>
                      {dailyIncome.map((day, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{day.formattedDate}</TableCell>
                          <TableCell>{day.dayName}</TableCell>
                          <TableCell className="text-center">{day.count}</TableCell>
                          <TableCell className="text-right font-medium">
                            ৳{day.amount.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                      {/* Total Row */}
                      <TableRow className="bg-muted/50 font-bold">
                        <TableCell colSpan={2}>Total</TableCell>
                        <TableCell className="text-center">{totalTransactions}</TableCell>
                        <TableCell className="text-right">৳{totalIncome.toLocaleString()}</TableCell>
                      </TableRow>
                    </>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
