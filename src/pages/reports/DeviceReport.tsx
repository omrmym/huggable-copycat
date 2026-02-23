import { useState, useRef } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useDeviceList } from '@/hooks/useDeviceInventory';
import { useDeviceChangeRequests } from '@/hooks/useDeviceInventory';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Search, FileText, Download, FileDown, Printer } from 'lucide-react';
import { format } from 'date-fns';
import jsPDF from 'jspdf';

const statusBadge = (status: string) => {
  switch (status) {
    case 'active': return <Badge variant="outline" className="text-green-500 border-green-500">Active</Badge>;
    case 'expired': return <Badge variant="outline" className="text-red-500 border-red-500">Expired</Badge>;
    case 'disabled': return <Badge variant="outline" className="text-muted-foreground border-muted-foreground">Disabled</Badge>;
    case 'suspended': return <Badge variant="outline" className="text-yellow-500 border-yellow-500">Suspended</Badge>;
    default: return <Badge variant="outline">{status}</Badge>;
  }
};

const statusLabel = (status: string) => {
  switch (status) {
    case 'active': return 'Active';
    case 'expired': return 'Expired';
    case 'disabled': return 'Disabled';
    case 'suspended': return 'Suspended';
    default: return status;
  }
};

export default function DeviceReportPage() {
  const { data: devices = [], isLoading: devicesLoading } = useDeviceList();
  const { data: changeRequests = [] } = useDeviceChangeRequests();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const tableRef = useRef<HTMLDivElement>(null);

  const filtered = devices.filter(d => {
    const q = search.toLowerCase();
    const matchesSearch =
      d.username?.toLowerCase().includes(q) ||
      d.full_name?.toLowerCase().includes(q) ||
      d.mac_serial?.toLowerCase().includes(q) ||
      d.connectivity_type?.toLowerCase().includes(q);

    if (!matchesSearch) return false;
    if (statusFilter !== 'all' && d.status !== statusFilter) return false;

    return true;
  });

  const handleReset = () => {
    setStatusFilter('all');
    setSearch('');
  };

  const handleExportCSV = () => {
    const headers = ['User ID', 'Name', 'Device', 'Mac/Serial', 'Status', 'Area', 'Last Modified'];
    const rows = filtered.map(d => [
      d.username, d.full_name || '-', d.connectivity_type || '-',
      d.mac_serial || '-', statusLabel(d.status), d.areas?.name || '-',
      format(new Date(d.updated_at), 'dd MMM yyyy'),
    ]);
    const csvContent = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `device-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  const handleExportPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape' });
    doc.setFontSize(16);
    doc.text('Device Report', 14, 15);
    doc.setFontSize(9);
    if (statusFilter !== 'all') {
      doc.text(`Filter: ${statusLabel(statusFilter)}`, 14, 22);
    }
    const headers = ['User ID', 'Name', 'Device', 'Mac/Serial', 'Status', 'Area', 'Last Modified'];
    const colWidths = [35, 45, 30, 50, 25, 40, 35];
    let y = 30;
    doc.setFontSize(8);
    doc.setFont(undefined as any, 'bold');
    headers.forEach((h, i) => {
      doc.text(h, 14 + colWidths.slice(0, i).reduce((a, b) => a + b, 0), y);
    });
    doc.setFont(undefined as any, 'normal');
    y += 6;
    filtered.forEach((d) => {
      if (y > 190) { doc.addPage(); y = 15; }
      const row = [d.username, d.full_name || '-', d.connectivity_type || '-',
        d.mac_serial || '-', statusLabel(d.status), d.areas?.name || '-',
        format(new Date(d.updated_at), 'dd MMM yyyy')];
      row.forEach((cell, i) => {
        doc.text(String(cell).substring(0, 25), 14 + colWidths.slice(0, i).reduce((a, b) => a + b, 0), y);
      });
      y += 5;
    });
    doc.save(`device-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  const handlePrint = () => {
    const win = window.open('', '', 'width=900,height=600');
    if (!win) return;
    win.document.write(`<html><head><title>Device Report</title>
      <style>body{font-family:sans-serif;padding:20px}table{width:100%;border-collapse:collapse;font-size:12px}th,td{border:1px solid #ccc;padding:6px 8px;text-align:left}th{background:#f0f0f0;font-weight:bold}h2{margin-bottom:4px}p{color:#666;font-size:12px;margin-bottom:12px}</style></head><body>
      <h2>Device Report</h2>
      <table><thead><tr><th>User ID</th><th>Name</th><th>Device</th><th>Mac/Serial</th><th>Status</th><th>Area</th><th>Last Modified</th></tr></thead>
      <tbody>${filtered.map(d => `<tr><td>${d.username}</td><td>${d.full_name || '-'}</td><td>${d.connectivity_type || '-'}</td><td>${d.mac_serial || '-'}</td><td>${statusLabel(d.status)}</td><td>${d.areas?.name || '-'}</td><td>${format(new Date(d.updated_at), 'dd MMM yyyy')}</td></tr>`).join('')}</tbody></table></body></html>`);
    win.document.close();
    win.print();
  };

  return (
    <DashboardLayout title="Device Report" subtitle="Device inventory and change history report">
      <div className="space-y-6">
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <h3 className="font-semibold text-foreground whitespace-nowrap">Status</h3>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                    <SelectItem value="disabled">Disabled</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleReset}>Reset</Button>
                <Button variant="outline" size="sm" onClick={handleExportCSV}>
                  <Download className="w-4 h-4 mr-1" /> CSV
                </Button>
                <Button variant="outline" size="sm" onClick={handleExportPDF}>
                  <FileDown className="w-4 h-4 mr-1" /> PDF
                </Button>
                <Button variant="outline" size="sm" onClick={handlePrint}>
                  <Printer className="w-4 h-4 mr-1" /> Print
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-foreground">{filtered.length}</div>
              <p className="text-sm text-muted-foreground">Total Users</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-primary">{filtered.filter(d => d.mac_serial).length}</div>
              <p className="text-sm text-muted-foreground">With Mac/Serial</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-yellow-500">{filtered.filter(d => !d.mac_serial).length}</div>
              <p className="text-sm text-muted-foreground">Without Mac/Serial</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-500">{changeRequests.filter(r => r.status === 'approved').length}</div>
              <p className="text-sm text-muted-foreground">Approved Changes</p>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-card border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Device Report ({filtered.length})
              </CardTitle>
              <div className="relative w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Search..." className="pl-9 bg-secondary border-border" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {devicesLoading ? (
              <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
            ) : (
              <div className="overflow-x-auto" ref={tableRef}>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Device</TableHead>
                      <TableHead>Mac/Serial</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Area</TableHead>
                      <TableHead>Last Modified</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((device) => (
                      <TableRow key={device.id}>
                        <TableCell className="font-medium">{device.username}</TableCell>
                        <TableCell>{device.full_name || '-'}</TableCell>
                        <TableCell>{device.connectivity_type || '-'}</TableCell>
                        <TableCell className="font-mono text-sm">{device.mac_serial || '-'}</TableCell>
                        <TableCell>{statusBadge(device.status)}</TableCell>
                        <TableCell>{device.areas?.name || '-'}</TableCell>
                        <TableCell>{format(new Date(device.updated_at), 'dd MMM yyyy')}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
