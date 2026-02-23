import { useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLeaveRequests } from '@/hooks/useLeaveRequests';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Download, Printer, FileText, Search, CalendarDays } from 'lucide-react';
import { format, parseISO, isWithinInterval, startOfDay, endOfDay, subDays, differenceInDays } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import jsPDF from 'jspdf';

export default function LeaveReport() {
  const { data: leaveRequests = [], isLoading } = useLeaveRequests();
  
  const [startDate, setStartDate] = useState<Date | undefined>(subDays(new Date(), 30));
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [leaveTypeFilter, setLeaveTypeFilter] = useState<string>('all');

  // Get unique leave types for filter
  const leaveTypes = useMemo(() => {
    const types = new Set(leaveRequests.map(r => r.leave_type));
    return Array.from(types);
  }, [leaveRequests]);

  // Filter records
  const filteredRequests = useMemo(() => {
    return leaveRequests.filter((request) => {
      // Date filter
      if (startDate && endDate) {
        const requestDate = parseISO(request.start_date);
        if (!isWithinInterval(requestDate, {
          start: startOfDay(startDate),
          end: endOfDay(endDate),
        })) {
          return false;
        }
      }

      // Search filter
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        const employeeName = request.employee?.full_name?.toLowerCase() || '';
        const employeeId = request.employee?.employee_id?.toLowerCase() || '';
        if (!employeeName.includes(search) && !employeeId.includes(search)) {
          return false;
        }
      }

      // Status filter
      if (statusFilter !== 'all' && request.status !== statusFilter) {
        return false;
      }

      // Leave type filter
      if (leaveTypeFilter !== 'all' && request.leave_type !== leaveTypeFilter) {
        return false;
      }

      return true;
    });
  }, [leaveRequests, startDate, endDate, searchTerm, statusFilter, leaveTypeFilter]);

  // Calculate total days
  const totalLeaveDays = useMemo(() => {
    return filteredRequests.reduce((sum, request) => {
      const start = parseISO(request.start_date);
      const end = parseISO(request.end_date);
      return sum + differenceInDays(end, start) + 1;
    }, 0);
  }, [filteredRequests]);

  const clearFilters = () => {
    setStartDate(subDays(new Date(), 30));
    setEndDate(new Date());
    setSearchTerm('');
    setStatusFilter('all');
    setLeaveTypeFilter('all');
  };

  const getDateRangeText = () => {
    return `${format(startDate || new Date(), 'dd/MM/yyyy')} - ${format(endDate || new Date(), 'dd/MM/yyyy')}`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-success/20 text-success border-success/30">Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-destructive/20 text-destructive border-destructive/30">Rejected</Badge>;
      case 'pending':
        return <Badge className="bg-warning/20 text-warning border-warning/30">Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleExportCSV = () => {
    const headers = ['Employee ID', 'Employee Name', 'Leave Type', 'Start Date', 'End Date', 'Days', 'Status', 'Reason', 'Approved By'];
    const rows = filteredRequests.map(request => {
      const days = differenceInDays(parseISO(request.end_date), parseISO(request.start_date)) + 1;
      return [
        request.employee?.employee_id || '-',
        request.employee?.full_name || '-',
        request.leave_type,
        format(parseISO(request.start_date), 'dd/MM/yyyy'),
        format(parseISO(request.end_date), 'dd/MM/yyyy'),
        days,
        request.status,
        request.reason || '-',
        request.approver?.full_name || '-'
      ];
    });
    
    rows.push(['', '', '', '', 'Total Days', totalLeaveDays, '', '', '']);
    
    const csvContent = [headers.join(','), ...rows.map(row => row.map(cell => `"${cell}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leave-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
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
          <title>Leave Report - ${dateRange}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { font-size: 24px; margin-bottom: 5px; }
            .subtitle { color: #666; margin-bottom: 20px; }
            .summary { background: #f5f5f5; padding: 15px; border-radius: 8px; margin-bottom: 20px; display: flex; gap: 40px; }
            .summary-item { }
            .summary-title { font-size: 14px; color: #666; }
            .summary-value { font-size: 24px; font-weight: bold; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f5f5f5; font-weight: 600; }
            .status-approved { color: #16a34a; }
            .status-rejected { color: #dc2626; }
            .status-pending { color: #ca8a04; }
            .total-row { background-color: #f5f5f5; font-weight: bold; }
            @media print { body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
          </style>
        </head>
        <body>
          <h1>Leave Report</h1>
          <p class="subtitle">${dateRange}</p>
          <div class="summary">
            <div class="summary-item">
              <div class="summary-title">Total Requests</div>
              <div class="summary-value">${filteredRequests.length}</div>
            </div>
            <div class="summary-item">
              <div class="summary-title">Total Leave Days</div>
              <div class="summary-value">${totalLeaveDays}</div>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Employee ID</th>
                <th>Employee Name</th>
                <th>Leave Type</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Days</th>
                <th>Status</th>
                <th>Reason</th>
              </tr>
            </thead>
            <tbody>
              ${filteredRequests.map(request => {
                const days = differenceInDays(parseISO(request.end_date), parseISO(request.start_date)) + 1;
                return `
                  <tr>
                    <td>${request.employee?.employee_id || '-'}</td>
                    <td>${request.employee?.full_name || '-'}</td>
                    <td>${request.leave_type}</td>
                    <td>${format(parseISO(request.start_date), 'dd/MM/yyyy')}</td>
                    <td>${format(parseISO(request.end_date), 'dd/MM/yyyy')}</td>
                    <td>${days}</td>
                    <td class="status-${request.status}">${request.status}</td>
                    <td>${request.reason || '-'}</td>
                  </tr>
                `;
              }).join('')}
              <tr class="total-row">
                <td colspan="5">Total</td>
                <td>${totalLeaveDays}</td>
                <td colspan="2"></td>
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
    
    // Title
    doc.setFontSize(20);
    doc.text('Leave Report', 20, 20);
    
    // Date range
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(dateRange, 20, 30);
    
    // Summary
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text(`Total Requests: ${filteredRequests.length}`, 20, 45);
    doc.text(`Total Leave Days: ${totalLeaveDays}`, 100, 45);
    
    // Table header
    let yPos = 60;
    doc.setFontSize(8);
    doc.setTextColor(0);
    doc.setFillColor(245, 245, 245);
    doc.rect(10, yPos - 5, 190, 10, 'F');
    doc.text('Emp ID', 12, yPos);
    doc.text('Name', 35, yPos);
    doc.text('Type', 75, yPos);
    doc.text('Start', 105, yPos);
    doc.text('End', 130, yPos);
    doc.text('Days', 155, yPos);
    doc.text('Status', 170, yPos);
    
    yPos += 10;
    
    // Table rows
    doc.setFontSize(7);
    filteredRequests.forEach((request) => {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
      const days = differenceInDays(parseISO(request.end_date), parseISO(request.start_date)) + 1;
      
      doc.setTextColor(0);
      doc.text((request.employee?.employee_id || '-').slice(0, 12), 12, yPos);
      doc.text((request.employee?.full_name || '-').slice(0, 20), 35, yPos);
      doc.text(request.leave_type.slice(0, 15), 75, yPos);
      doc.text(format(parseISO(request.start_date), 'dd/MM/yy'), 105, yPos);
      doc.text(format(parseISO(request.end_date), 'dd/MM/yy'), 130, yPos);
      doc.text(String(days), 155, yPos);
      
      // Status color
      if (request.status === 'approved') doc.setTextColor(22, 163, 74);
      else if (request.status === 'rejected') doc.setTextColor(220, 38, 38);
      else if (request.status === 'pending') doc.setTextColor(202, 138, 4);
      doc.text(request.status, 170, yPos);
      
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
    doc.text(String(totalLeaveDays), 155, yPos);
    
    doc.save(`leave-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  return (
    <DashboardLayout title="Leave Report" subtitle="View all employee leave requests">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Requests</CardTitle>
            <CalendarDays className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <Skeleton className="h-8 w-16" /> : filteredRequests.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              in selected period
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Leave Days</CardTitle>
            <Calendar className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <Skeleton className="h-8 w-16" /> : totalLeaveDays}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              days requested
            </p>
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
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>

            {/* Leave Type Filter */}
            <Select value={leaveTypeFilter} onValueChange={setLeaveTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Leave Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {leaveTypes.map((type) => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Leave Requests Table */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <CalendarDays className="w-5 h-5" />
            Leave Requests ({filteredRequests.length})
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
                    <TableHead>Leave Type</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Days</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Approved By</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequests.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                        No leave requests found for selected filters
                      </TableCell>
                    </TableRow>
                  ) : (
                    <>
                      {filteredRequests.map((request) => {
                        const days = differenceInDays(parseISO(request.end_date), parseISO(request.start_date)) + 1;
                        return (
                          <TableRow key={request.id}>
                            <TableCell className="font-medium">{request.employee?.employee_id || '-'}</TableCell>
                            <TableCell>{request.employee?.full_name || '-'}</TableCell>
                            <TableCell>{request.leave_type}</TableCell>
                            <TableCell>{format(parseISO(request.start_date), 'dd MMM yyyy')}</TableCell>
                            <TableCell>{format(parseISO(request.end_date), 'dd MMM yyyy')}</TableCell>
                            <TableCell>{days}</TableCell>
                            <TableCell>{getStatusBadge(request.status)}</TableCell>
                            <TableCell className="max-w-xs truncate">{request.reason || '-'}</TableCell>
                            <TableCell>{request.approver?.full_name || '-'}</TableCell>
                          </TableRow>
                        );
                      })}
                      {/* Total Row */}
                      <TableRow className="bg-muted/50 font-bold">
                        <TableCell colSpan={5}>Total</TableCell>
                        <TableCell>{totalLeaveDays}</TableCell>
                        <TableCell colSpan={3}></TableCell>
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
