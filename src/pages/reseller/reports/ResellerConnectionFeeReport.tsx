import { useState, useMemo, useRef } from 'react';
import { ResellerLayout } from '@/components/reseller/ResellerLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Calendar, Download, Wallet, Printer, FileText } from 'lucide-react';
import { format, startOfDay, endOfDay, startOfMonth } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { useResellerAuth } from '@/contexts/ResellerAuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ResellerFilter } from '@/components/reseller/ResellerFilter';
import jsPDF from 'jspdf';

export default function ResellerConnectionFeeReport() {
  const { reseller } = useResellerAuth();
  const isSuperAdmin = reseller?.is_super_admin || false;
  const tableRef = useRef<HTMLDivElement>(null);
  const [selectedResellerId, setSelectedResellerId] = useState<string | null>(null);
  
  const { data: records = [], isLoading } = useQuery({
    queryKey: ['reseller-connection-fee', reseller?.id, isSuperAdmin, selectedResellerId],
    queryFn: async () => {
      let query = supabase
        .from('radius_users')
        .select('id, username, full_name, connection_date, connection_fee, created_at')
        .gt('connection_fee', 0)
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
  
  const [startDate, setStartDate] = useState<Date | undefined>(startOfMonth(new Date()));
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());

  const filteredRecords = useMemo(() => {
    return records.filter(record => {
      if (!record.connection_date) return false;
      
      const connectionDate = new Date(record.connection_date);
      const matchesStartDate = !startDate || connectionDate >= startOfDay(startDate);
      const matchesEndDate = !endDate || connectionDate <= endOfDay(endDate);
      
      return matchesStartDate && matchesEndDate;
    });
  }, [records, startDate, endDate]);

  const totalConnectionFee = useMemo(() => {
    return filteredRecords.reduce((sum, record) => sum + (Number(record.connection_fee) || 0), 0);
  }, [filteredRecords]);

  const clearFilters = () => {
    setStartDate(startOfMonth(new Date()));
    setEndDate(new Date());
    setSelectedResellerId(null);
  };

  const getDateRangeText = () => {
    return `${format(startDate || new Date(), 'dd/MM/yyyy')} - ${format(endDate || new Date(), 'dd/MM/yyyy')}`;
  };

  const handleExportCSV = () => {
    const headers = ['Date', 'Username', 'Full Name', 'Connection Fee'];
    const rows = filteredRecords.map(record => [
      record.connection_date ? format(new Date(record.connection_date), 'dd/MM/yyyy') : '-',
      record.username,
      record.full_name || '-',
      record.connection_fee || 0
    ]);
    
    rows.push(['', '', 'Total', totalConnectionFee]);
    
    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reseller-connection-fee-${format(new Date(), 'yyyy-MM-dd')}.csv`;
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
          <title>Connection Fee Report - ${dateRange}</title>
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
            .text-right { text-align: right; }
            .total-row { background-color: #f5f5f5; font-weight: bold; }
            @media print { body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
          </style>
        </head>
        <body>
          <h1>Connection Fee Report</h1>
          <p class="subtitle">${dateRange}</p>
          <div class="summary">
            <div class="summary-title">Total Connection Fee</div>
            <div class="summary-value">৳${totalConnectionFee.toLocaleString()}</div>
            <div class="summary-title">${filteredRecords.length} connections</div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Username</th>
                <th>Full Name</th>
                <th class="text-right">Connection Fee</th>
              </tr>
            </thead>
            <tbody>
              ${filteredRecords.map(record => `
                <tr>
                  <td>${record.connection_date ? format(new Date(record.connection_date), 'dd/MM/yyyy') : '-'}</td>
                  <td>${record.username}</td>
                  <td>${record.full_name || '-'}</td>
                  <td class="text-right">৳${(Number(record.connection_fee) || 0).toLocaleString()}</td>
                </tr>
              `).join('')}
              <tr class="total-row">
                <td colspan="3">Total</td>
                <td class="text-right">৳${totalConnectionFee.toLocaleString()}</td>
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
    
    doc.setFontSize(20);
    doc.text('Connection Fee Report', 20, 20);
    
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(dateRange, 20, 30);
    
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text(`Total Connection Fee: ৳${totalConnectionFee.toLocaleString()}`, 20, 45);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`${filteredRecords.length} connections`, 20, 52);
    
    let yPos = 65;
    doc.setFontSize(10);
    doc.setTextColor(0);
    doc.setFillColor(245, 245, 245);
    doc.rect(20, yPos - 5, 170, 10, 'F');
    doc.text('Date', 22, yPos);
    doc.text('Username', 55, yPos);
    doc.text('Full Name', 100, yPos);
    doc.text('Connection Fee', 150, yPos);
    
    yPos += 10;
    
    doc.setFontSize(9);
    filteredRecords.forEach((record) => {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
      doc.text(record.connection_date ? format(new Date(record.connection_date), 'dd/MM/yyyy') : '-', 22, yPos);
      doc.text(record.username.slice(0, 18), 55, yPos);
      doc.text((record.full_name || '-').slice(0, 20), 100, yPos);
      doc.text(`৳${(Number(record.connection_fee) || 0).toLocaleString()}`, 150, yPos);
      yPos += 7;
    });
    
    if (yPos > 270) {
      doc.addPage();
      yPos = 20;
    }
    doc.setFillColor(245, 245, 245);
    doc.rect(20, yPos - 5, 170, 10, 'F');
    doc.setFontSize(10);
    doc.text('Total', 22, yPos);
    doc.text(`৳${totalConnectionFee.toLocaleString()}`, 150, yPos);
    
    doc.save(`reseller-connection-fee-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  return (
    <ResellerLayout title={isSuperAdmin ? "All Resellers Connection Fee Report" : "Connection Fee Report"} subtitle="View all connection fee collections">
      <Card className="bg-card border-border mb-6">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Total Connection Fee</CardTitle>
          <Wallet className="w-4 h-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {isLoading ? <Skeleton className="h-8 w-24" /> : `৳${totalConnectionFee.toLocaleString()}`}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {filteredRecords.length} connections in selected period
          </p>
        </CardContent>
      </Card>

      <Card className="bg-card border-border mb-6">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <CardTitle className="text-lg">Date Range</CardTitle>
            <div className="flex flex-wrap gap-2">
              <Button variant="ghost" size="sm" onClick={clearFilters}>Reset</Button>
              <Button variant="outline" size="sm" onClick={handleExportCSV}>
                <Download className="w-4 h-4 mr-2" />CSV
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
                <FileText className="w-4 h-4 mr-2" />PDF
              </Button>
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="w-4 h-4 mr-2" />Print
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-center">
            {isSuperAdmin && (
              <ResellerFilter
                selectedResellerId={selectedResellerId}
                onResellerChange={setSelectedResellerId}
              />
            )}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-[200px] justify-start text-left font-normal", !startDate && "text-muted-foreground")}>
                  <Calendar className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "dd/MM/yyyy") : "Start Date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent mode="single" selected={startDate} onSelect={setStartDate} initialFocus className="p-3 pointer-events-auto" />
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
                <CalendarComponent mode="single" selected={endDate} onSelect={setEndDate} initialFocus className="p-3 pointer-events-auto" />
              </PopoverContent>
            </Popover>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            Connection Fee Records ({filteredRecords.length})
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
                    <TableHead>Username</TableHead>
                    <TableHead>Full Name</TableHead>
                    <TableHead className="text-right">Connection Fee</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        No connection fee records found for selected date range
                      </TableCell>
                    </TableRow>
                  ) : (
                    <>
                      {filteredRecords.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell className="font-medium">
                            {record.connection_date ? format(new Date(record.connection_date), 'dd/MM/yyyy') : '-'}
                          </TableCell>
                          <TableCell>{record.username}</TableCell>
                          <TableCell>{record.full_name || '-'}</TableCell>
                          <TableCell className="text-right font-medium">
                            ৳{(Number(record.connection_fee) || 0).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-muted/50 font-bold">
                        <TableCell colSpan={3}>Total</TableCell>
                        <TableCell className="text-right">৳{totalConnectionFee.toLocaleString()}</TableCell>
                      </TableRow>
                    </>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </ResellerLayout>
  );
}
