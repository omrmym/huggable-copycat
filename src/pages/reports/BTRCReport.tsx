import { useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, FileSpreadsheet } from 'lucide-react';
import { useRadiusUsers } from '@/hooks/useRadiusUsers';
import { useBillingPlans } from '@/hooks/useBillingPlans';
import { useDistricts } from '@/hooks/useDistricts';
import { usePoliceStations } from '@/hooks/usePoliceStations';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { format, startOfMonth } from 'date-fns';
import { DateRangeFilter } from '@/components/finance/DateRangeFilter';
import { writeExcelFile } from '@/lib/excelUtils';

export default function BTRCReport() {
  const { data: users = [], isLoading: usersLoading } = useRadiusUsers();
  const { data: plans = [] } = useBillingPlans();
  const { data: districts = [] } = useDistricts();
  const { data: policeStations = [] } = usePoliceStations();

  // Default to current month
  const [startDate, setStartDate] = useState<Date | undefined>(startOfMonth(new Date()));
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());

  const handleClearFilter = () => {
    setStartDate(startOfMonth(new Date()));
    setEndDate(new Date());
  };

  // Helper functions to get names from IDs
  const getDistrictName = (districtId: string | null) => {
    if (!districtId) return '';
    const district = districts.find(d => d.id === districtId);
    return district?.name || '';
  };

  const getPoliceStationName = (psId: string | null) => {
    if (!psId) return '';
    const ps = policeStations.find(p => p.id === psId);
    return ps?.name || '';
  };

  const getPlanSpeed = (planId: string | null) => {
    if (!planId) return '';
    const plan = plans.find(p => p.id === planId);
    if (!plan) return '';
    // Convert kbps to Mbps - only download speed, no decimals
    const downloadMbps = Math.round(plan.download_speed_kbps / 1024);
    return String(downloadMbps);
  };

  const getPlanPrice = (planId: string | null) => {
    if (!planId) return 0;
    const plan = plans.find(p => p.id === planId);
    return plan?.price || 0;
  };

  // Filter users: only active users within date range
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      // Only active users
      if (user.status !== 'active') return false;

      // Date filter based on connection_date
      if (startDate && user.connection_date) {
        const connectionDate = new Date(user.connection_date);
        if (connectionDate < startDate) return false;
      }
      if (endDate && user.connection_date) {
        const connectionDate = new Date(user.connection_date);
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);
        if (connectionDate > endOfDay) return false;
      }

      return true;
    });
  }, [users, startDate, endDate]);

  // Map user data to BTRC format
  const btrcData = useMemo(() => filteredUsers.map(user => ({
    client_type: user.customer_type || 'home', // Home or Corporate
    connection_type: 'wired', // Default, can be extended
    client_name: user.full_name || '',
    bandwidth_distribution_point: 'PoP', // PoP as distribution point
    connectivity_type: user.connectivity_type || 'shared', // Shared or Dedicated
    activation_date: user.connection_date ? format(new Date(user.connection_date), 'yyyy-MM-dd') : '',
    bandwidth_allocation: getPlanSpeed(user.plan_id), // Only download speed in Mbps
    allocated_ip: user.username, // Username as allocated_ip (e.g., office.flynet1)
    division: 'Mymensingh', // Fixed division
    district: getDistrictName(user.district_id),
    thana: getPoliceStationName(user.police_station_id),
    address: user.address_details || '',
    client_mobile: user.phone || '',
    client_email: user.email || '',
    selling_price_bdt_excluding_vat: getPlanPrice(user.plan_id),
  })), [filteredUsers, plans, districts, policeStations]);

  const handleExportExcel = async () => {
    const exportData = btrcData.map(row => ({
      'client_type': row.client_type,
      'connection_type': row.connection_type,
      'client_name': row.client_name,
      'bandwidth_distribution_point': row.bandwidth_distribution_point,
      'connectivity_type': row.connectivity_type,
      'activation_date': row.activation_date,
      'bandwidth_allocation': row.bandwidth_allocation,
      'allocated_ip': row.allocated_ip,
      'division': row.division,
      'district': row.district,
      'thana': row.thana,
      'address': row.address,
      'client_mobile': row.client_mobile,
      'client_email': row.client_email,
      'selling_price_bdt_excluding_vat': row.selling_price_bdt_excluding_vat,
    }));

    await writeExcelFile(
      exportData,
      `BTRC_Report_${format(new Date(), 'yyyy-MM-dd')}.xlsx`,
      'BTRC Report',
      [12, 15, 25, 30, 15, 15, 20, 40, 12, 15, 15, 30, 15, 25, 30]
    );
  };

  return (
    <DashboardLayout title="BTRC Report">
      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            BTRC Report (Active Users Only)
          </CardTitle>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <DateRangeFilter
              startDate={startDate}
              endDate={endDate}
              onStartDateChange={setStartDate}
              onEndDateChange={setEndDate}
              onClear={handleClearFilter}
            />
            <Button onClick={handleExportExcel} className="gap-2">
              <FileSpreadsheet className="w-4 h-4" />
              Export Excel
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground mb-4">
            Total Active Records: {btrcData.length}
          </div>
          
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client Type</TableHead>
                  <TableHead>Connection Type</TableHead>
                  <TableHead>Client Name</TableHead>
                  <TableHead>Distribution Point</TableHead>
                  <TableHead>Connectivity Type</TableHead>
                  <TableHead>Activation Date</TableHead>
                  <TableHead>Bandwidth</TableHead>
                  <TableHead>Allocated IP (User ID)</TableHead>
                  <TableHead>District</TableHead>
                  <TableHead>Thana</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Mobile</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Price (BDT)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usersLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 14 }).map((_, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-4 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : btrcData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={14} className="text-center text-muted-foreground py-8">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  btrcData.map((row, index) => (
                    <TableRow key={index}>
                      <TableCell className="capitalize">{row.client_type}</TableCell>
                      <TableCell className="capitalize">{row.connection_type}</TableCell>
                      <TableCell>{row.client_name}</TableCell>
                      <TableCell>{row.bandwidth_distribution_point}</TableCell>
                      <TableCell className="capitalize">{row.connectivity_type}</TableCell>
                      <TableCell>{row.activation_date}</TableCell>
                      <TableCell>{row.bandwidth_allocation}</TableCell>
                      <TableCell className="font-mono text-xs">{row.allocated_ip}</TableCell>
                      <TableCell>{row.district}</TableCell>
                      <TableCell>{row.thana}</TableCell>
                      <TableCell>{row.address}</TableCell>
                      <TableCell>{row.client_mobile}</TableCell>
                      <TableCell>{row.client_email}</TableCell>
                      <TableCell>{row.selling_price_bdt_excluding_vat}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
