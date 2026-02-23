import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useDeviceList } from '@/hooks/useDeviceInventory';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Search, HardDrive } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

const statusBadge = (status: string) => {
  switch (status) {
    case 'active': return <Badge variant="outline" className="text-green-500 border-green-500">Active</Badge>;
    case 'expired': return <Badge variant="outline" className="text-red-500 border-red-500">Expired</Badge>;
    case 'disabled': return <Badge variant="outline" className="text-muted-foreground border-muted-foreground">Disabled</Badge>;
    case 'suspended': return <Badge variant="outline" className="text-yellow-500 border-yellow-500">Suspended</Badge>;
    default: return <Badge variant="outline">{status}</Badge>;
  }
};

export default function DeviceListPage() {
  const { data: devices = [], isLoading } = useDeviceList();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filtered = devices.filter(d => {
    const q = search.toLowerCase();
    const matchesSearch =
      d.username?.toLowerCase().includes(q) ||
      d.full_name?.toLowerCase().includes(q) ||
      d.mac_serial?.toLowerCase().includes(q) ||
      d.areas?.name?.toLowerCase().includes(q) ||
      d.address_details?.toLowerCase().includes(q);

    if (!matchesSearch) return false;
    if (statusFilter !== 'all' && d.status !== statusFilter) return false;

    return true;
  });

  return (
    <DashboardLayout title="Device List" subtitle="View all user devices and MAC/Serial numbers">
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <HardDrive className="w-5 h-5 text-primary" />
              Device List ({filtered.length})
            </CardTitle>
            <div className="flex items-center gap-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
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
              <div className="relative w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by user, area, MAC/Serial..."
                  className="pl-9 bg-secondary border-border"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Area</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Device</TableHead>
                    <TableHead>Mac/Serial</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Modified</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                        No devices found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((device) => (
                      <TableRow key={device.id}>
                        <TableCell>
                          <Link to={`/users/${device.id}`} className="text-primary hover:underline font-medium">
                            {device.username}
                          </Link>
                        </TableCell>
                        <TableCell>{device.full_name || '-'}</TableCell>
                        <TableCell>{device.areas?.name || '-'}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{device.address_details || '-'}</TableCell>
                        <TableCell>{device.connectivity_type || '-'}</TableCell>
                        <TableCell className="font-mono text-sm">{device.mac_serial || '-'}</TableCell>
                        <TableCell>{statusBadge(device.status)}</TableCell>
                        <TableCell>{format(new Date(device.updated_at), 'dd MMM yyyy')}</TableCell>
                      </TableRow>
                    ))
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
