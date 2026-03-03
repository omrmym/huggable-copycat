import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  CreditCard, 
  Users,
  FileText,
  Download,
  Printer,
  CalendarIcon,
  
} from 'lucide-react';
import { useExpenses } from '@/hooks/useExpenses';
import { useSalaryPayments } from '@/hooks/useSalaryPayments';
import { useIncome } from '@/hooks/useIncome';
import { useTransactions } from '@/hooks/useTransactions';
import { useRadiusUsers } from '@/hooks/useRadiusUsers';

import { Skeleton } from '@/components/ui/skeleton';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format, parseISO, isWithinInterval, startOfDay, endOfDay, startOfMonth } from 'date-fns';
import jsPDF from 'jspdf';

export default function FinalReport() {
  const [startDate, setStartDate] = useState<Date | undefined>(startOfMonth(new Date()));
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());

  const { data: expenses = [], isLoading: expensesLoading } = useExpenses();
  const { data: salaryPayments = [], isLoading: salaryLoading } = useSalaryPayments();
  const { data: incomeList = [], isLoading: incomeLoading } = useIncome();
  const { data: transactions = [], isLoading: transactionsLoading } = useTransactions();
  const { data: users = [], isLoading: usersLoading } = useRadiusUsers();
  

  const isLoading = expensesLoading || salaryLoading || incomeLoading || transactionsLoading || usersLoading;

  // Filter data by date range
  const filteredExpenses = useMemo(() => {
    if (!startDate && !endDate) return expenses;
    return expenses.filter(e => {
      const date = parseISO(e.date);
      if (startDate && endDate) {
        return isWithinInterval(date, { start: startOfDay(startDate), end: endOfDay(endDate) });
      }
      if (startDate) return date >= startOfDay(startDate);
      if (endDate) return date <= endOfDay(endDate);
      return true;
    });
  }, [expenses, startDate, endDate]);

  const filteredSalaryPayments = useMemo(() => {
    if (!startDate && !endDate) return salaryPayments;
    return salaryPayments.filter(p => {
      const date = parseISO(p.payment_date);
      if (startDate && endDate) {
        return isWithinInterval(date, { start: startOfDay(startDate), end: endOfDay(endDate) });
      }
      if (startDate) return date >= startOfDay(startDate);
      if (endDate) return date <= endOfDay(endDate);
      return true;
    });
  }, [salaryPayments, startDate, endDate]);

  const filteredIncome = useMemo(() => {
    if (!startDate && !endDate) return incomeList;
    return incomeList.filter(i => {
      const date = parseISO(i.date);
      if (startDate && endDate) {
        return isWithinInterval(date, { start: startOfDay(startDate), end: endOfDay(endDate) });
      }
      if (startDate) return date >= startOfDay(startDate);
      if (endDate) return date <= endOfDay(endDate);
      return true;
    });
  }, [incomeList, startDate, endDate]);

  const filteredTransactions = useMemo(() => {
    if (!startDate && !endDate) return transactions;
    return transactions.filter(t => {
      const date = parseISO(t.created_at);
      if (startDate && endDate) {
        return isWithinInterval(date, { start: startOfDay(startDate), end: endOfDay(endDate) });
      }
      if (startDate) return date >= startOfDay(startDate);
      if (endDate) return date <= endOfDay(endDate);
      return true;
    });
  }, [transactions, startDate, endDate]);

  const filteredUsers = useMemo(() => {
    if (!startDate && !endDate) return users;
    return users.filter(u => {
      if (!u.connection_date) return false;
      const date = parseISO(u.connection_date);
      if (startDate && endDate) {
        return isWithinInterval(date, { start: startOfDay(startDate), end: endOfDay(endDate) });
      }
      if (startDate) return date >= startOfDay(startDate);
      if (endDate) return date <= endOfDay(endDate);
      return true;
    });
  }, [users, startDate, endDate]);


  // Calculate totals based on filtered data
  const totals = useMemo(() => {
    // Total bill from filtered transactions (recharge type)
    const totalBill = filteredTransactions
      .filter(t => t.status === 'completed' && t.type === 'recharge')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    // Extra income from filtered income
    const extraIncome = filteredIncome.reduce((sum, i) => sum + Number(i.amount), 0);

    // Connection fee from filtered users
    const connectionFee = filteredUsers.reduce((sum, u) => sum + (u.connection_fee || 0), 0);


    // Total expense from filtered expenses
    const totalExpense = filteredExpenses.reduce((sum, e) => sum + Number(e.amount), 0);

    // Total salary from filtered salary payments
    const totalSalary = filteredSalaryPayments
      .filter(p => p.status === 'paid')
      .reduce((sum, p) => sum + Number(p.net_salary), 0);

    const totalIncome = totalBill + extraIncome + connectionFee;
    const totalOutgoing = totalExpense + totalSalary;
    const profitLoss = totalIncome - totalOutgoing;

    return {
      totalBill,
      extraIncome,
      connectionFee,
      totalExpense,
      totalSalary,
      totalIncome,
      totalOutgoing,
      profitLoss,
    };
  }, [filteredExpenses, filteredSalaryPayments, filteredIncome, filteredTransactions, filteredUsers]);

  const formatCurrency = (amount: number) => `৳${amount.toLocaleString()}`;
  const formatCurrencyPDF = (amount: number) => `BDT ${amount.toLocaleString()}`;

  const getDateRangeLabel = () => {
    if (startDate && endDate) {
      return `${format(startDate, 'dd MMM yyyy')} - ${format(endDate, 'dd MMM yyyy')}`;
    }
    if (startDate) {
      return `From ${format(startDate, 'dd MMM yyyy')}`;
    }
    if (endDate) {
      return `Until ${format(endDate, 'dd MMM yyyy')}`;
    }
    return 'All Time';
  };

  const handleClearFilter = () => {
    setStartDate(startOfMonth(new Date()));
    setEndDate(new Date());
  };

  const handlePrint = () => {
    const printContent = `
      <html>
        <head>
          <title>Final Report</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { text-align: center; margin-bottom: 10px; }
            .date-range { text-align: center; margin-bottom: 30px; color: #666; }
            .section { margin-bottom: 20px; }
            .section-title { font-size: 18px; font-weight: bold; margin-bottom: 10px; border-bottom: 2px solid #333; padding-bottom: 5px; }
            .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
            .label { font-weight: 500; }
            .value { font-weight: bold; }
            .income { color: #16a34a; }
            .expense { color: #dc2626; }
            .total-row { background: #f3f4f6; padding: 10px; margin-top: 10px; font-size: 18px; }
            .profit { color: #16a34a; }
            .loss { color: #dc2626; }
          </style>
        </head>
        <body>
          <h1>Final Financial Report</h1>
          <div class="date-range">${getDateRangeLabel()}</div>
          
          <div class="section">
            <div class="section-title">Income</div>
            <div class="row">
              <span class="label">Total Bill</span>
              <span class="value income">${formatCurrency(totals.totalBill)}</span>
            </div>
            <div class="row">
              <span class="label">Extra Income</span>
              <span class="value income">${formatCurrency(totals.extraIncome)}</span>
            </div>
            <div class="row">
              <span class="label">Connection Fee</span>
              <span class="value income">${formatCurrency(totals.connectionFee)}</span>
            </div>
            <div class="total-row">
              <div class="row" style="border: none;">
                <span class="label">Total Income</span>
                <span class="value income">${formatCurrency(totals.totalIncome)}</span>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Expenses</div>
            <div class="row">
              <span class="label">Total Expense</span>
              <span class="value expense">${formatCurrency(totals.totalExpense)}</span>
            </div>
            <div class="row">
              <span class="label">Total Salary</span>
              <span class="value expense">${formatCurrency(totals.totalSalary)}</span>
            </div>
            <div class="total-row">
              <div class="row" style="border: none;">
                <span class="label">Total Outgoing</span>
                <span class="value expense">${formatCurrency(totals.totalOutgoing)}</span>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Summary</div>
            <div class="total-row">
              <div class="row" style="border: none; font-size: 20px;">
                <span class="label">${totals.profitLoss >= 0 ? 'Net Profit' : 'Net Loss'}</span>
                <span class="value ${totals.profitLoss >= 0 ? 'profit' : 'loss'}">${formatCurrency(Math.abs(totals.profitLoss))}</span>
              </div>
            </div>
          </div>

          <div style="text-align: center; margin-top: 30px; color: #666; font-size: 12px;">
            Generated on ${new Date().toLocaleDateString()}
          </div>
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
    const headers = ['Category', 'Item', 'Amount'];
    const rows = [
      ['Income', 'Total Bill', totals.totalBill.toString()],
      ['Income', 'Extra Income', totals.extraIncome.toString()],
      ['Income', 'Connection Fee', totals.connectionFee.toString()],
      
      ['Income', 'Total Income', totals.totalIncome.toString()],
      ['Expense', 'Total Expense', totals.totalExpense.toString()],
      ['Expense', 'Total Salary', totals.totalSalary.toString()],
      ['Expense', 'Total Outgoing', totals.totalOutgoing.toString()],
      ['Summary', totals.profitLoss >= 0 ? 'Net Profit' : 'Net Loss', Math.abs(totals.profitLoss).toString()],
    ];

    const csvContent = [
      `Final Financial Report - ${getDateRangeLabel()}`,
      '',
      headers.join(','),
      ...rows.map(row => row.join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `final-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.text('Final Financial Report', 105, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.text(getDateRangeLabel(), 105, 28, { align: 'center' });
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 105, 34, { align: 'center' });

    let y = 50;

    // Income Section
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Income', 20, y);
    doc.line(20, y + 2, 190, y + 2);
    y += 12;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    
    const incomeItems = [
      { label: 'Total Bill', value: totals.totalBill },
      { label: 'Extra Income', value: totals.extraIncome },
      { label: 'Connection Fee', value: totals.connectionFee },
      
    ];

    incomeItems.forEach(item => {
      doc.text(item.label, 25, y);
      doc.text(formatCurrencyPDF(item.value), 180, y, { align: 'right' });
      y += 8;
    });

    doc.setFont('helvetica', 'bold');
    doc.setFillColor(240, 240, 240);
    doc.rect(20, y - 2, 170, 10, 'F');
    doc.text('Total Income', 25, y + 5);
    doc.text(formatCurrencyPDF(totals.totalIncome), 180, y + 5, { align: 'right' });
    y += 20;

    // Expense Section
    doc.setFontSize(14);
    doc.text('Expenses', 20, y);
    doc.line(20, y + 2, 190, y + 2);
    y += 12;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');

    const expenseItems = [
      { label: 'Total Expense', value: totals.totalExpense },
      { label: 'Total Salary', value: totals.totalSalary },
    ];

    expenseItems.forEach(item => {
      doc.text(item.label, 25, y);
      doc.text(formatCurrencyPDF(item.value), 180, y, { align: 'right' });
      y += 8;
    });

    doc.setFont('helvetica', 'bold');
    doc.setFillColor(240, 240, 240);
    doc.rect(20, y - 2, 170, 10, 'F');
    doc.text('Total Outgoing', 25, y + 5);
    doc.text(formatCurrencyPDF(totals.totalOutgoing), 180, y + 5, { align: 'right' });
    y += 25;

    // Summary Section
    doc.setFontSize(16);
    doc.text('Summary', 20, y);
    doc.line(20, y + 2, 190, y + 2);
    y += 15;

    const isProfit = totals.profitLoss >= 0;
    if (isProfit) {
      doc.setFillColor(220, 252, 231);
    } else {
      doc.setFillColor(254, 226, 226);
    }
    doc.rect(20, y - 5, 170, 15, 'F');
    doc.setFontSize(14);
    doc.text(isProfit ? 'Net Profit' : 'Net Loss', 25, y + 5);
    doc.text(formatCurrencyPDF(Math.abs(totals.profitLoss)), 180, y + 5, { align: 'right' });

    doc.save('final-report.pdf');
  };

  return (
    <DashboardLayout title="Final Report" subtitle="Complete financial summary">
      <div className="space-y-6">
        {/* Filters and Actions */}
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex flex-wrap gap-2 items-center">
            {/* Start Date */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-[160px] justify-start text-left font-normal",
                    !startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "dd MMM yyyy") : "Start Date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={setStartDate}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>

            {/* End Date */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-[160px] justify-start text-left font-normal",
                    !endDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, "dd MMM yyyy") : "End Date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={setEndDate}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>

            {(startDate || endDate) && (
              <Button variant="ghost" size="sm" onClick={handleClearFilter}>
                Clear
              </Button>
            )}
          </div>

          <div className="flex gap-2">
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

        {/* Income Cards */}
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-success" />
            Income
          </h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Bill</CardTitle>
                <CreditCard className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-success">
                  {isLoading ? <Skeleton className="h-8 w-24" /> : formatCurrency(totals.totalBill)}
                </div>
                <p className="text-xs text-muted-foreground">Bill collection</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Extra Income</CardTitle>
                <DollarSign className="h-4 w-4 text-success" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-success">
                  {isLoading ? <Skeleton className="h-8 w-24" /> : formatCurrency(totals.extraIncome)}
                </div>
                <p className="text-xs text-muted-foreground">{filteredIncome.length} entries</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Connection Fee</CardTitle>
                <Users className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-success">
                  {isLoading ? <Skeleton className="h-8 w-24" /> : formatCurrency(totals.connectionFee)}
                </div>
                <p className="text-xs text-muted-foreground">{filteredUsers.length} connections</p>
              </CardContent>
            </Card>


            <Card className="bg-success/10 border-success/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Income</CardTitle>
                <TrendingUp className="h-4 w-4 text-success" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-success">
                  {isLoading ? <Skeleton className="h-8 w-24" /> : formatCurrency(totals.totalIncome)}
                </div>
                <p className="text-xs text-muted-foreground">Combined income</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Expense Cards */}
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-destructive" />
            Expenses
          </h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Expense</CardTitle>
                <FileText className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">
                  {isLoading ? <Skeleton className="h-8 w-24" /> : formatCurrency(totals.totalExpense)}
                </div>
                <p className="text-xs text-muted-foreground">{filteredExpenses.length} entries</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Salary</CardTitle>
                <Users className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">
                  {isLoading ? <Skeleton className="h-8 w-24" /> : formatCurrency(totals.totalSalary)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {filteredSalaryPayments.filter(p => p.status === 'paid').length} paid
                </p>
              </CardContent>
            </Card>

            <Card className="bg-destructive/10 border-destructive/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Outgoing</CardTitle>
                <TrendingDown className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">
                  {isLoading ? <Skeleton className="h-8 w-24" /> : formatCurrency(totals.totalOutgoing)}
                </div>
                <p className="text-xs text-muted-foreground">Combined expenses</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Profit/Loss Summary */}
        <Card className={totals.profitLoss >= 0 ? 'bg-success/5 border-success/30' : 'bg-destructive/5 border-destructive/30'}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className={`w-5 h-5 ${totals.profitLoss >= 0 ? 'text-success' : 'text-destructive'}`} />
              Financial Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="text-center p-4 bg-background rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Total Income</p>
                <p className="text-xl font-bold text-success">
                  {isLoading ? <Skeleton className="h-7 w-24 mx-auto" /> : formatCurrency(totals.totalIncome)}
                </p>
              </div>
              <div className="text-center p-4 bg-background rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Total Outgoing</p>
                <p className="text-xl font-bold text-destructive">
                  {isLoading ? <Skeleton className="h-7 w-24 mx-auto" /> : formatCurrency(totals.totalOutgoing)}
                </p>
              </div>
              <div className="text-center p-4 bg-background rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">
                  {totals.profitLoss >= 0 ? 'Net Profit' : 'Net Loss'}
                </p>
                {isLoading ? (
                  <Skeleton className="h-8 w-28 mx-auto" />
                ) : (
                  <p className={`text-2xl font-bold ${totals.profitLoss >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {formatCurrency(Math.abs(totals.profitLoss))}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
