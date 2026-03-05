import { useState } from 'react';
import { startOfMonth, endOfMonth, startOfDay, endOfDay, isWithinInterval } from 'date-fns';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageSquare, Send, CheckCircle, XCircle, Clock, Search, BarChart3, Trash2, FileText, RefreshCw, Loader2, Users } from 'lucide-react';
import { DateRangeFilter } from '@/components/finance/DateRangeFilter';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import SmsTemplates from '@/components/sms/SmsTemplates';
import { useSmsHistory, useClearSmsHistory, type SmsHistoryRecord } from '@/hooks/useSmsHistory';
import { useQueryClient } from '@tanstack/react-query';
import { useHasPermission } from '@/hooks/useHasPermission';

const typeColors: Record<string, string> = {
  'Bill Reminder': 'hsl(var(--primary))',
  'Payment Confirmation': 'hsl(142, 76%, 36%)',
  'Expiry Warning': 'hsl(38, 92%, 50%)',
  'Service Activation': 'hsl(262, 83%, 58%)',
  'Custom': 'hsl(var(--muted-foreground))',
};

const buildDailyData = (data: SmsHistoryRecord[]) => {
  const map: Record<string, { sent: number; delivered: number; failed: number }> = {};
  data.forEach((sms) => {
    const date = new Date(sms.created_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
    if (!map[date]) map[date] = { sent: 0, delivered: 0, failed: 0 };
    map[date].sent++;
    if (sms.status === 'delivered') map[date].delivered++;
    if (sms.status === 'failed') map[date].failed++;
  });
  return Object.entries(map)
    .map(([date, counts]) => ({ date, ...counts }))
    .sort((a, b) => new Date(a.date + ' 2026').getTime() - new Date(b.date + ' 2026').getTime());
};

const buildTypeData = (data: SmsHistoryRecord[]) => {
  const map: Record<string, number> = {};
  data.forEach((sms) => {
    map[sms.sms_type] = (map[sms.sms_type] || 0) + 1;
  });
  return Object.entries(map).map(([name, value]) => ({
    name,
    value,
    color: typeColors[name] || 'hsl(var(--muted-foreground))',
  }));
};

const statusColors: Record<string, string> = {
  delivered: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  failed: 'bg-destructive/10 text-destructive border-destructive/20',
  pending: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
};

const statusIcons: Record<string, React.ReactNode> = {
  delivered: <CheckCircle className="w-3.5 h-3.5" />,
  failed: <XCircle className="w-3.5 h-3.5" />,
  pending: <Clock className="w-3.5 h-3.5" />,
};

export default function SmsHistory() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [startDate, setStartDate] = useState<Date | undefined>(startOfMonth(new Date()));
  const [endDate, setEndDate] = useState<Date | undefined>(endOfMonth(new Date()));

  const { data: smsData = [], isLoading } = useSmsHistory();
  const clearHistory = useClearSmsHistory();
  const queryClient = useQueryClient();
  const { hasPermission } = useHasPermission();

  const canViewHistory = hasPermission('sms.history');
  const canSendSms = hasPermission('sms.send');
  const canManageTemplates = hasPermission('sms.templates');

  const defaultTab = canViewHistory ? 'history' : canManageTemplates ? 'templates' : 'history';

  const filtered = smsData.filter((sms) => {
    const matchSearch = !search || sms.recipient_phone.includes(search) || (sms.recipient_name || '').toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === 'all' || sms.sms_type === typeFilter;
    const matchStatus = statusFilter === 'all' || sms.status === statusFilter;

    let matchDate = true;
    if (startDate || endDate) {
      const smsDate = new Date(sms.created_at);
      if (startDate && endDate) {
        matchDate = isWithinInterval(smsDate, { start: startOfDay(startDate), end: endOfDay(endDate) });
      } else if (startDate) {
        matchDate = smsDate >= startOfDay(startDate);
      } else if (endDate) {
        matchDate = smsDate <= endOfDay(endDate);
      }
    }

    return matchSearch && matchType && matchStatus && matchDate;
  });

  const totalSent = filtered.length;
  const totalDelivered = filtered.filter(s => s.status === 'delivered').length;
  const totalFailed = filtered.filter(s => s.status === 'failed').length;

  const dailyData = buildDailyData(filtered);
  const typeData = buildTypeData(filtered);

  return (
    <DashboardLayout title="SMS Management" subtitle="SMS history, analytics and templates">
      <Tabs defaultValue={defaultTab} className="space-y-6">
        <TabsList className="bg-muted/50">
          {canViewHistory && (
            <TabsTrigger value="history" className="flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4" />
              History & Analytics
            </TabsTrigger>
          )}
          {canManageTemplates && (
            <TabsTrigger value="templates" className="flex items-center gap-1.5">
              <FileText className="w-4 h-4" />
              Templates
            </TabsTrigger>
          )}
        </TabsList>

        {canViewHistory && (
        <TabsContent value="history" className="space-y-6">
          {/* Date Filter */}
          <div className="flex flex-wrap items-center gap-4">
            <DateRangeFilter
              startDate={startDate}
              endDate={endDate}
              onStartDateChange={setStartDate}
              onEndDateChange={setEndDate}
              onClear={() => { setStartDate(undefined); setEndDate(undefined); }}
            />
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Card className="bg-card border-border">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Send className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{totalSent}</p>
                    <p className="text-xs text-muted-foreground">Total Sent</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{totalDelivered}</p>
                    <p className="text-xs text-muted-foreground">Delivered</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                    <XCircle className="w-5 h-5 text-destructive" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{totalFailed}</p>
                    <p className="text-xs text-muted-foreground">Failed</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="bg-card border-border lg:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-primary" />
                  Daily SMS Activity
                </CardTitle>
                <CardDescription className="text-xs">Recent activity</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={dailyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
                    <Line type="monotone" dataKey="sent" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} name="Sent" />
                    <Line type="monotone" dataKey="delivered" stroke="hsl(142, 76%, 36%)" strokeWidth={2} dot={{ r: 4 }} name="Delivered" />
                    <Line type="monotone" dataKey="failed" stroke="hsl(var(--destructive))" strokeWidth={2} dot={{ r: 4 }} name="Failed" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-primary" />
                  SMS by Type
                </CardTitle>
                <CardDescription className="text-xs">Distribution</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={typeData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                      {typeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* History Table */}
          <Card className="bg-card border-border">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-primary" />
                    SMS History
                  </CardTitle>
                  <CardDescription>Complete log of all sent SMS messages</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => queryClient.invalidateQueries({ queryKey: ['sms-history'] })}
                    className="flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => clearHistory.mutate()}
                    disabled={smsData.length === 0 || clearHistory.isPending}
                    className="flex items-center gap-1.5"
                  >
                    <Trash2 className="w-4 h-4" />
                    Clear History
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="flex flex-wrap gap-3 mb-4">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by phone or name..."
                    className="pl-9 bg-secondary border-border"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-[180px] bg-secondary border-border">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="Bill Reminder">Bill Reminder</SelectItem>
                    <SelectItem value="Payment Confirmation">Payment Confirmation</SelectItem>
                    <SelectItem value="Expiry Warning">Expiry Warning</SelectItem>
                    <SelectItem value="Service Activation">Service Activation</SelectItem>
                    <SelectItem value="Custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[150px] bg-secondary border-border">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Table */}
              <div className="rounded-lg border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead className="text-xs">Recipient</TableHead>
                      <TableHead className="text-xs">Type</TableHead>
                      <TableHead className="text-xs hidden md:table-cell">Message</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                      <TableHead className="text-xs">Sent At</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8">
                          <Loader2 className="w-5 h-5 animate-spin mx-auto text-muted-foreground" />
                        </TableCell>
                      </TableRow>
                    ) : filtered.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          No SMS records found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filtered.map((sms) => (
                        <TableRow key={sms.id} className="hover:bg-muted/20">
                          <TableCell>
                            <div>
                              <p className="font-medium text-sm text-foreground">{sms.recipient_name || 'Unknown'}</p>
                              <p className="text-xs text-muted-foreground">{sms.recipient_phone}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs border-border">
                              {sms.sms_type}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <p className="text-xs text-muted-foreground truncate max-w-[300px]">{sms.message}</p>
                          </TableCell>
                          <TableCell>
                            <Badge className={`text-xs flex items-center gap-1 w-fit ${statusColors[sms.status] || ''}`}>
                              {statusIcons[sms.status]}
                              {sms.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <p className="text-xs text-muted-foreground">
                              {new Date(sms.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                              {' '}
                              {new Date(sms.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        )}

        {canManageTemplates && (
        <TabsContent value="templates">
          <SmsTemplates />
        </TabsContent>
        )}
      </Tabs>
    </DashboardLayout>
  );
}
