import { useState, useMemo, useRef } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useExpenses } from '@/hooks/useExpenses';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Calendar, Download, TrendingDown, Printer, FileText } from 'lucide-react';
import { format, parseISO, isWithinInterval, startOfDay, endOfDay, startOfMonth } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import jsPDF from 'jspdf';

export default function ExpenseReport() {
  const { data: expenseList = [], isLoading } = useExpenses();
  const tableRef = useRef<HTMLDivElement>(null);
  
  const [startDate, setStartDate] = useState<Date | undefined>(startOfMonth(new Date()));
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());

  // Filter records within date range
  const filteredExpenses = useMemo(() => {
    if (!startDate && !endDate) return expenseList;
    
    return expenseList.filter((expense) => {
      const expenseDate = parseISO(expense.date);
      if (startDate && endDate) {
        return isWithinInterval(expenseDate, {
          start: startOfDay(startDate),
          end: endOfDay(endDate),
        });
      }
      if (startDate) {
        return expenseDate >= startOfDay(startDate);
      }
      if (endDate) {
        return expenseDate <= endOfDay(endDate);
      }
      return true;
    });
  }, [expenseList, startDate, endDate]);

  // Calculate total expense
  const totalExpense = useMemo(() => {
    return filteredExpenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
  }, [filteredExpenses]);

  const clearFilters = () => {
    setStartDate(startOfMonth(new Date()));
    setEndDate(new Date());
  };

  const getDateRangeText = () => {
    return `${format(startDate || new Date(), 'dd/MM/yyyy')} - ${format(endDate || new Date(), 'dd/MM/yyyy')}`;
  };

  const handleExportCSV = () => {
    const headers = ['Date', 'Added By', 'Category', 'Description', 'Amount'];
    const rows = filteredExpenses.map(expense => [
      format(parseISO(expense.date), 'dd/MM/yyyy'),
      expense.added_by || '-',
      expense.category || '-',
      expense.description || '-',
      expense.amount
    ]);
    
    rows.push(['', '', '', 'Total', totalExpense]);
    
    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expense-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const dateRange = getDateRangeText();

    printWindow.document.write(`
      <html>
        <head>
          <title>Expense Report - ${dateRange}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { font-size: 24px; margin-bottom: 5px; }
            .subtitle { color: #666; margin-bottom: 20px; }
            .summary { background: #f5f5f5; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
            .summary-title { font-size: 14px; color: #666; }
            .summary-value { font-size: 28px; font-weight: bold; color: #dc2626; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 12px 8px; text-align: left; }
            th { background-color: #f5f5f5; font-weight: 600; }
            .text-right { text-align: right; }
            .total-row { background-color: #f5f5f5; font-weight: bold; }
            .expense-amount { color: #dc2626; }
            @media print { body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
          </style>
        </head>
        <body>
          <h1>Expense Report</h1>
          <p class="subtitle">${dateRange}</p>
          <div class="summary">
            <div class="summary-title">Total Expenses</div>
            <div class="summary-value">৳${totalExpense.toLocaleString()}</div>
            <div class="summary-title">${filteredExpenses.length} entries</div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Added By</th>
                <th>Category</th>
                <th>Description</th>
                <th class="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${filteredExpenses.map(expense => `
                <tr>
                  <td>${format(parseISO(expense.date), 'dd/MM/yyyy')}</td>
                  <td>${expense.added_by || '-'}</td>
                  <td>${expense.category || '-'}</td>
                  <td>${expense.description || '-'}</td>
                  <td class="text-right expense-amount">৳${Number(expense.amount).toLocaleString()}</td>
                </tr>
              `).join('')}
              <tr class="total-row">
                <td colspan="4">Total</td>
                <td class="text-right expense-amount">৳${totalExpense.toLocaleString()}</td>
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
    const dateRange = getDateRangeText();
    
    const formatPDF = (amount: number) => `BDT ${amount.toLocaleString()}`;
    
    // Title
    doc.setFontSize(20);
    doc.text('Expense Report', 20, 20);
    
    // Date range
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(dateRange, 20, 30);
    
    // Summary
    doc.setFontSize(14);
    doc.setTextColor(220, 38, 38); // Red color for expenses
    doc.text(`Total Expenses: ${formatPDF(totalExpense)}`, 20, 45);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`${filteredExpenses.length} entries`, 20, 52);
    
    // Table header
    let yPos = 65;
    doc.setFontSize(10);
    doc.setTextColor(0);
    doc.setFillColor(245, 245, 245);
    doc.rect(20, yPos - 5, 170, 10, 'F');
    doc.text('Date', 22, yPos);
    doc.text('Added By', 50, yPos);
    doc.text('Category', 90, yPos);
    doc.text('Amount', 155, yPos);
    
    yPos += 10;
    
    // Table rows
    doc.setFontSize(9);
    filteredExpenses.forEach((expense) => {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
      doc.setTextColor(0);
      doc.text(format(parseISO(expense.date), 'dd/MM/yyyy'), 22, yPos);
      doc.text((expense.added_by || '-').slice(0, 18), 50, yPos);
      doc.text((expense.category || '-').slice(0, 18), 90, yPos);
      doc.setTextColor(220, 38, 38);
      doc.text(formatPDF(Number(expense.amount)), 155, yPos);
      yPos += 7;
    });
    
    // Total row
    if (yPos > 270) {
      doc.addPage();
      yPos = 20;
    }
    doc.setFillColor(245, 245, 245);
    doc.rect(20, yPos - 5, 170, 10, 'F');
    doc.setFontSize(10);
    doc.setTextColor(0);
    doc.text('Total', 22, yPos);
    doc.setTextColor(220, 38, 38);
    doc.text(formatPDF(totalExpense), 155, yPos);
    
    doc.save(`expense-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  return (
    <DashboardLayout title="Expense Report" subtitle="View all expense entries">
      {/* Summary Card */}
      <Card className="bg-card border-border mb-6">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Total Expenses</CardTitle>
          <TrendingDown className="w-4 h-4 text-destructive" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-destructive">
            {isLoading ? <Skeleton className="h-8 w-24" /> : `৳${totalExpense.toLocaleString()}`}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {filteredExpenses.length} entries in selected period
          </p>
        </CardContent>
      </Card>

      {/* Date Filter */}
      <Card className="bg-card border-border mb-6">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <CardTitle className="text-lg">Date Range</CardTitle>
            <div className="flex flex-wrap gap-2">
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
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent 
                  mode="single" 
                  selected={startDate} 
                  onSelect={setStartDate} 
                  initialFocus 
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-[200px] justify-start text-left font-normal", !endDate && "text-muted-foreground")}>
                  <Calendar className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, "dd/MM/yyyy") : "End Date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent 
                  mode="single" 
                  selected={endDate} 
                  onSelect={setEndDate} 
                  initialFocus 
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>
        </CardContent>
      </Card>

      {/* Expense Table */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingDown className="w-5 h-5" />
            Expense Entries ({filteredExpenses.length})
          </CardTitle>
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
                    <TableHead>Added By</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredExpenses.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        No expense entries found for selected date range
                      </TableCell>
                    </TableRow>
                  ) : (
                    <>
                      {filteredExpenses.map((expense) => (
                        <TableRow key={expense.id}>
                          <TableCell className="font-medium">
                            {format(parseISO(expense.date), 'dd MMM yyyy')}
                          </TableCell>
                          <TableCell>{expense.added_by || '-'}</TableCell>
                          <TableCell>{expense.category || '-'}</TableCell>
                          <TableCell className="max-w-xs truncate">{expense.description || '-'}</TableCell>
                          <TableCell className="text-right font-medium text-destructive">
                            ৳{Number(expense.amount).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                      {/* Total Row */}
                      <TableRow className="bg-muted/50 font-bold">
                        <TableCell colSpan={4}>Total</TableCell>
                        <TableCell className="text-right text-destructive">৳{totalExpense.toLocaleString()}</TableCell>
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
