import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageSquare, Send, CheckCircle, XCircle, Clock, Search, BarChart3, Trash2, FileText, RefreshCw } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import SmsTemplates from '@/components/sms/SmsTemplates';

// Mock SMS history data
const mockSmsHistory = [
  { id: '1', recipient: '01909509331', recipientName: 'Jhumon', type: 'Bill Reminder', message: 'Your bill of ৳70 is due on March 7.', status: 'delivered', sentAt: '2026-03-01T10:30:00Z', cost: 0.25 },
  { id: '2', recipient: '01919744232', recipientName: 'Md Omar Faruk', type: 'Payment Confirmation', message: 'Payment of ৳300 received. Thank you!', status: 'delivered', sentAt: '2026-03-01T09:15:00Z', cost: 0.25 },
  { id: '3', recipient: '01712345678', recipientName: 'Karim Uddin', type: 'Expiry Warning', message: 'Your connection expires in 3 days.', status: 'delivered', sentAt: '2026-02-28T14:20:00Z', cost: 0.25 },
  { id: '4', recipient: '01812345679', recipientName: 'Rahim Mia', type: 'Service Activation', message: 'Your internet service has been activated.', status: 'failed', sentAt: '2026-02-28T11:00:00Z', cost: 0.25 },
  { id: '5', recipient: '01612345680', recipientName: 'Salam Ahmed', type: 'Bill Reminder', message: 'Your bill of ৳200 is due on March 5.', status: 'delivered', sentAt: '2026-02-27T16:45:00Z', cost: 0.25 },
  { id: '6', recipient: '01512345681', recipientName: 'Nasir Hossain', type: 'Payment Confirmation', message: 'Payment of ৳150 received. Thank you!', status: 'pending', sentAt: '2026-02-27T13:30:00Z', cost: 0.25 },
  { id: '7', recipient: '01909509331', recipientName: 'Jhumon', type: 'Expiry Warning', message: 'Your connection expires tomorrow.', status: 'delivered', sentAt: '2026-02-26T08:00:00Z', cost: 0.25 },
  { id: '8', recipient: '01919744232', recipientName: 'Md Omar Faruk', type: 'Bill Reminder', message: 'Your bill of ৳300 is due on Feb 27.', status: 'delivered', sentAt: '2026-02-25T10:00:00Z', cost: 0.25 },
  { id: '9', recipient: '01312345682', recipientName: 'Jamal Khan', type: 'Service Activation', message: 'Your internet service has been activated.', status: 'delivered', sentAt: '2026-02-24T15:20:00Z', cost: 0.25 },
  { id: '10', recipient: '01412345683', recipientName: 'Faruk Islam', type: 'Expiry Warning', message: 'Your connection expires in 2 days.', status: 'failed', sentAt: '2026-02-23T09:10:00Z', cost: 0.25 },
];

const typeColors: Record<string, string> = {
  'Bill Reminder': 'hsl(var(--primary))',
  'Payment Confirmation': 'hsl(142, 76%, 36%)',
  'Expiry Warning': 'hsl(38, 92%, 50%)',
  'Service Activation': 'hsl(262, 83%, 58%)',
};

const buildDailyData = (data: typeof mockSmsHistory) => {
  const map: Record<string, { sent: number; delivered: number; failed: number }> = {};
  data.forEach((sms) => {
    const date = new Date(sms.sentAt).toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
    if (!map[date]) map[date] = { sent: 0, delivered: 0, failed: 0 };
    map[date].sent++;
    if (sms.status === 'delivered') map[date].delivered++;
    if (sms.status === 'failed') map[date].failed++;
  });
  return Object.entries(map)
    .map(([date, counts]) => ({ date, ...counts }))
    .sort((a, b) => new Date(a.date + ' 2026').getTime() - new Date(b.date + ' 2026').getTime());
};

const buildTypeData = (data: typeof mockSmsHistory) => {
  const map: Record<string, number> = {};
  data.forEach((sms) => {
    map[sms.type] = (map[sms.type] || 0) + 1;
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
  const [smsData, setSmsData] = useState(mockSmsHistory);

  const filtered = smsData.filter((sms) => {
    const matchSearch = !search || sms.recipient.includes(search) || sms.recipientName.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === 'all' || sms.type === typeFilter;
    const matchStatus = statusFilter === 'all' || sms.status === statusFilter;
    return matchSearch && matchType && matchStatus;
  });

  const totalSent = smsData.length;
  const totalDelivered = smsData.filter(s => s.status === 'delivered').length;
  const totalFailed = smsData.filter(s => s.status === 'failed').length;
  const totalCost = smsData.reduce((sum, s) => sum + s.cost, 0);

  const dailyData = buildDailyData(smsData);
  const typeData = buildTypeData(smsData);

  const handleClearHistory = () => {
    setSmsData([]);
    setSearch('');
    setTypeFilter('all');
    setStatusFilter('all');
  };

  const handleReloadHistory = () => {
    setSmsData(mockSmsHistory);
    setSearch('');
    setTypeFilter('all');
    setStatusFilter('all');
  };

  return (
    <DashboardLayout title="SMS Management" subtitle="SMS history, analytics and templates">
      <Tabs defaultValue="history" className="space-y-6">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="history" className="flex items-center gap-1.5">
            <MessageSquare className="w-4 h-4" />
            History & Analytics
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-1.5">
            <FileText className="w-4 h-4" />
            Templates
          </TabsTrigger>
        </TabsList>

        {/* History & Analytics Tab */}
        <TabsContent value="history" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
            <Card className="bg-card border-border">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">৳{totalCost.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">Total Cost</p>
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
                <CardDescription className="text-xs">Last 7 days</CardDescription>
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
                  <CardDescription>Complete log of all sent SMS messages (demo data)</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {smsData.length === 0 && (
                    <Button variant="outline" size="sm" onClick={handleReloadHistory} className="flex items-center gap-1.5">
                      <RefreshCw className="w-4 h-4" />
                      Reload Demo Data
                    </Button>
                  )}
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleClearHistory}
                    disabled={smsData.length === 0}
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
                    {filtered.map((sms) => (
                      <TableRow key={sms.id} className="hover:bg-muted/20">
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm text-foreground">{sms.recipientName}</p>
                            <p className="text-xs text-muted-foreground">{sms.recipient}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs border-border">
                            {sms.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <p className="text-xs text-muted-foreground truncate max-w-[300px]">{sms.message}</p>
                        </TableCell>
                        <TableCell>
                          <Badge className={`text-xs flex items-center gap-1 w-fit ${statusColors[sms.status]}`}>
                            {statusIcons[sms.status]}
                            {sms.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <p className="text-xs text-muted-foreground">
                            {new Date(sms.sentAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                            {' '}
                            {new Date(sms.sentAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filtered.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          No SMS records found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates">
          <SmsTemplates />
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
