import { useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSalaryPayments } from '@/hooks/useSalaryPayments';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Download, Printer, FileText, Search, DollarSign, UserCog } from 'lucide-react';
import { format, parseISO, isWithinInterval, startOfDay, endOfDay, subDays } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import jsPDF from 'jspdf';

export default function EmployeeSalaryReport() {
  const { data: salaryPayments = [], isLoading } = useSalaryPayments();
  
  const [startDate, setStartDate] = useState<Date | undefined>(subDays(new Date(), 30));
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');

  // Get unique departments for filter
  const departments = useMemo(() => {
    const depts = new Set(salaryPayments.map(p => p.employee?.department).filter(Boolean));
    return Array.from(depts) as string[];
  }, [salaryPayments]);

  // Filter records
  const filteredPayments = useMemo(() => {
    return salaryPayments.filter((payment) => {
      // Date filter
      if (startDate && endDate) {
        const paymentDate = parseISO(payment.payment_date);
        if (!isWithinInterval(paymentDate, {
          start: startOfDay(startDate),
          end: endOfDay(endDate),
        })) {
          return false;
        }
      }

      // Search filter
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        const employeeName = payment.employee?.full_name?.toLowerCase() || '';
        const employeeId = payment.employee?.employee_id?.toLowerCase() || '';
        if (!employeeName.includes(search) && !employeeId.includes(search)) {
          return false;
        }
      }

      // Status filter
      if (statusFilter !== 'all' && payment.status !== statusFilter) {
        return false;
      }

      // Department filter
      if (departmentFilter !== 'all' && payment.employee?.department !== departmentFilter) {
        return false;
      }

      return true;
    });
  }, [salaryPayments, startDate, endDate, searchTerm, statusFilter, departmentFilter]);

  // Calculate totals
  const totals = useMemo(() => {
    return filteredPayments.reduce((acc, payment) => ({
      baseSalary: acc.baseSalary + Number(payment.base_salary),
      bonus: acc.bonus + Number(payment.bonus || 0),
      deductions: acc.deductions + Number(payment.deductions || 0),
      netSalary: acc.netSalary + Number(payment.net_salary),
    }), { baseSalary: 0, bonus: 0, deductions: 0, netSalary: 0 });
  }, [filteredPayments]);

  const clearFilters = () => {
    setStartDate(subDays(new Date(), 30));
    setEndDate(new Date());
    setSearchTerm('');
    setStatusFilter('all');
    setDepartmentFilter('all');
  };

  const getDateRangeText = () => {
    return `${format(startDate || new Date(), 'dd/MM/yyyy')} - ${format(endDate || new Date(), 'dd/MM/yyyy')}`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-success/20 text-success border-success/30">Paid</Badge>;
      case 'pending':
        return <Badge className="bg-warning/20 text-warning border-warning/30">Pending</Badge>;
      case 'cancelled':
        return <Badge className="bg-destructive/20 text-destructive border-destructive/30">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleExportCSV = () => {
    const headers = ['Employee ID', 'Employee Name', 'Department', 'Payment Date', 'Base Salary', 'Bonus', 'Deductions', 'Net Salary', 'Status', 'Payment Method'];
    const rows = filteredPayments.map(payment => [
      payment.employee?.employee_id || '-',
      payment.employee?.full_name || '-',
      payment.employee?.department || '-',
      format(parseISO(payment.payment_date), 'dd/MM/yyyy'),
      payment.base_salary,
      payment.bonus || 0,
      payment.deductions || 0,
      payment.net_salary,
      payment.status,
      payment.payment_method || '-'
    ]);
    
    rows.push(['', '', '', 'Total', totals.baseSalary, totals.bonus, totals.deductions, totals.netSalary, '', '']);
    
    const csvContent = [headers.join(','), ...rows.map(row => row.map(cell => `"${cell}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `salary-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
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
          <title>Employee Salary Report - ${dateRange}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { font-size: 24px; margin-bottom: 5px; }
            .subtitle { color: #666; margin-bottom: 20px; }
            .summary { background: #f5f5f5; padding: 15px; border-radius: 8px; margin-bottom: 20px; display: flex; gap: 30px; flex-wrap: wrap; }
            .summary-item { }
            .summary-title { font-size: 12px; color: #666; }
            .summary-value { font-size: 20px; font-weight: bold; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 11px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f5f5f5; font-weight: 600; }
            .text-right { text-align: right; }
            .status-paid { color: #16a34a; }
            .status-pending { color: #ca8a04; }
            .status-cancelled { color: #dc2626; }
            .total-row { background-color: #f5f5f5; font-weight: bold; }
            .amount { color: #16a34a; }
            .deduction { color: #dc2626; }
            @media print { body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
          </style>
        </head>
        <body>
          <h1>Employee Salary Report</h1>
          <p class="subtitle">${dateRange}</p>
          <div class="summary">
            <div class="summary-item">
              <div class="summary-title">Total Records</div>
              <div class="summary-value">${filteredPayments.length}</div>
            </div>
            <div class="summary-item">
              <div class="summary-title">Total Base Salary</div>
              <div class="summary-value">৳${totals.baseSalary.toLocaleString()}</div>
            </div>
            <div class="summary-item">
              <div class="summary-title">Total Bonus</div>
              <div class="summary-value amount">+৳${totals.bonus.toLocaleString()}</div>
            </div>
            <div class="summary-item">
              <div class="summary-title">Total Deductions</div>
              <div class="summary-value deduction">-৳${totals.deductions.toLocaleString()}</div>
            </div>
            <div class="summary-item">
              <div class="summary-title">Total Net Salary</div>
              <div class="summary-value">৳${totals.netSalary.toLocaleString()}</div>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Employee ID</th>
                <th>Name</th>
                <th>Department</th>
                <th>Date</th>
                <th class="text-right">Base</th>
                <th class="text-right">Bonus</th>
                <th class="text-right">Deductions</th>
                <th class="text-right">Net</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${filteredPayments.map(payment => `
                <tr>
                  <td>${payment.employee?.employee_id || '-'}</td>
                  <td>${payment.employee?.full_name || '-'}</td>
                  <td>${payment.employee?.department || '-'}</td>
                  <td>${format(parseISO(payment.payment_date), 'dd/MM/yyyy')}</td>
                  <td class="text-right">৳${Number(payment.base_salary).toLocaleString()}</td>
                  <td class="text-right amount">+৳${Number(payment.bonus || 0).toLocaleString()}</td>
                  <td class="text-right deduction">-৳${Number(payment.deductions || 0).toLocaleString()}</td>
                  <td class="text-right">৳${Number(payment.net_salary).toLocaleString()}</td>
                  <td class="status-${payment.status}">${payment.status}</td>
                </tr>
              `).join('')}
              <tr class="total-row">
                <td colspan="4">Total</td>
                <td class="text-right">৳${totals.baseSalary.toLocaleString()}</td>
                <td class="text-right amount">+৳${totals.bonus.toLocaleString()}</td>
                <td class="text-right deduction">-৳${totals.deductions.toLocaleString()}</td>
                <td class="text-right">৳${totals.netSalary.toLocaleString()}</td>
                <td></td>
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
    doc.text('Employee Salary Report', 20, 20);
    
    // Date range
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(dateRange, 20, 30);
    
    // Summary
    doc.setFontSize(11);
    doc.setTextColor(0);
    doc.text(`Total Records: ${filteredPayments.length}`, 20, 45);
    doc.text(`Net Salary: ${formatPDF(totals.netSalary)}`, 80, 45);
    doc.setTextColor(22, 163, 74);
    doc.text(`Bonus: +${formatPDF(totals.bonus)}`, 140, 45);
    
    // Table header
    let yPos = 60;
    doc.setFontSize(7);
    doc.setTextColor(0);
    doc.setFillColor(245, 245, 245);
    doc.rect(10, yPos - 5, 190, 10, 'F');
    doc.text('Emp ID', 12, yPos);
    doc.text('Name', 32, yPos);
    doc.text('Dept', 65, yPos);
    doc.text('Date', 90, yPos);
    doc.text('Base', 115, yPos);
    doc.text('Bonus', 135, yPos);
    doc.text('Deduct', 155, yPos);
    doc.text('Net', 175, yPos);
    
    yPos += 8;
    
    // Table rows
    doc.setFontSize(7);
    filteredPayments.forEach((payment) => {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setTextColor(0);
      doc.text((payment.employee?.employee_id || '-').slice(0, 10), 12, yPos);
      doc.text((payment.employee?.full_name || '-').slice(0, 18), 32, yPos);
      doc.text((payment.employee?.department || '-').slice(0, 12), 65, yPos);
      doc.text(format(parseISO(payment.payment_date), 'dd/MM/yy'), 90, yPos);
      doc.text(formatPDF(Number(payment.base_salary)), 115, yPos);
      doc.setTextColor(22, 163, 74);
      doc.text(`+${formatPDF(Number(payment.bonus || 0))}`, 135, yPos);
      doc.setTextColor(220, 38, 38);
      doc.text(`-${formatPDF(Number(payment.deductions || 0))}`, 155, yPos);
      doc.setTextColor(0);
      doc.text(formatPDF(Number(payment.net_salary)), 175, yPos);
      
      yPos += 6;
    });
    
    // Total row
    if (yPos > 270) {
      doc.addPage();
      yPos = 20;
    }
    doc.setFillColor(245, 245, 245);
    doc.rect(10, yPos - 4, 190, 8, 'F');
    doc.setFontSize(8);
    doc.setTextColor(0);
    doc.text('Total', 12, yPos);
    doc.text(formatPDF(totals.baseSalary), 115, yPos);
    doc.setTextColor(22, 163, 74);
    doc.text(`+${formatPDF(totals.bonus)}`, 135, yPos);
    doc.setTextColor(220, 38, 38);
    doc.text(`-${formatPDF(totals.deductions)}`, 155, yPos);
    doc.setTextColor(0);
    doc.text(formatPDF(totals.netSalary), 175, yPos);
    
    doc.save(`salary-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  return (
    <DashboardLayout title="Employee Salary Report" subtitle="View all salary payments">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Records</CardTitle>
            <UserCog className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <Skeleton className="h-8 w-16" /> : filteredPayments.length}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Base Salary</CardTitle>
            <DollarSign className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <Skeleton className="h-8 w-24" /> : `৳${totals.baseSalary.toLocaleString()}`}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Bonus</CardTitle>
            <DollarSign className="w-4 h-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {isLoading ? <Skeleton className="h-8 w-20" /> : `+৳${totals.bonus.toLocaleString()}`}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Net Salary</CardTitle>
            <DollarSign className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <Skeleton className="h-8 w-24" /> : `৳${totals.netSalary.toLocaleString()}`}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-card border-border mb-6">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <CardTitle className="text-lg">Filters</CardTitle>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search employee..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Start Date */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !startDate && "text-muted-foreground")}>
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
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>

            {/* End Date */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !endDate && "text-muted-foreground")}>
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
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            {/* Department Filter */}
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Salary Table */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <UserCog className="w-5 h-5" />
            Salary Payments ({filteredPayments.length})
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
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee ID</TableHead>
                    <TableHead>Employee Name</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Payment Date</TableHead>
                    <TableHead className="text-right">Base Salary</TableHead>
                    <TableHead className="text-right">Bonus</TableHead>
                    <TableHead className="text-right">Deductions</TableHead>
                    <TableHead className="text-right">Net Salary</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Method</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                        No salary payments found for selected filters
                      </TableCell>
                    </TableRow>
                  ) : (
                    <>
                      {filteredPayments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell className="font-medium">{payment.employee?.employee_id || '-'}</TableCell>
                          <TableCell>{payment.employee?.full_name || '-'}</TableCell>
                          <TableCell>{payment.employee?.department || '-'}</TableCell>
                          <TableCell>{format(parseISO(payment.payment_date), 'dd MMM yyyy')}</TableCell>
                          <TableCell className="text-right">৳{Number(payment.base_salary).toLocaleString()}</TableCell>
                          <TableCell className="text-right text-success">+৳{Number(payment.bonus || 0).toLocaleString()}</TableCell>
                          <TableCell className="text-right text-destructive">-৳{Number(payment.deductions || 0).toLocaleString()}</TableCell>
                          <TableCell className="text-right font-medium">৳{Number(payment.net_salary).toLocaleString()}</TableCell>
                          <TableCell>{getStatusBadge(payment.status)}</TableCell>
                          <TableCell className="capitalize">{payment.payment_method?.replace('_', ' ') || '-'}</TableCell>
                        </TableRow>
                      ))}
                      {/* Total Row */}
                      <TableRow className="bg-muted/50 font-bold">
                        <TableCell colSpan={4}>Total</TableCell>
                        <TableCell className="text-right">৳{totals.baseSalary.toLocaleString()}</TableCell>
                        <TableCell className="text-right text-success">+৳{totals.bonus.toLocaleString()}</TableCell>
                        <TableCell className="text-right text-destructive">-৳{totals.deductions.toLocaleString()}</TableCell>
                        <TableCell className="text-right">৳{totals.netSalary.toLocaleString()}</TableCell>
                        <TableCell colSpan={2}></TableCell>
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
