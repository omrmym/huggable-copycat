import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, Send, Search, Loader2, CheckCircle, XCircle, Filter } from 'lucide-react';
import { useRadiusUsers } from '@/hooks/useRadiusUsers';
import { useAreas } from '@/hooks/useAreas';
import { useBillingPlans } from '@/hooks/useBillingPlans';
import { sendSms } from '@/hooks/useSendSms';
import { toast } from 'sonner';

export default function GroupSmsSend() {
  const [statusFilter, setStatusFilter] = useState('all');
  const [areaFilter, setAreaFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ sent: number; failed: number } | null>(null);

  const { data: users = [], isLoading: usersLoading } = useRadiusUsers();
  const { data: areas = [] } = useAreas();
  const { data: plans = [] } = useBillingPlans();

  // Filter users with phone numbers
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (!u.phone) return false;
      const matchStatus = statusFilter === 'all' || u.status === statusFilter;
      const matchArea = areaFilter === 'all' || u.area_id === areaFilter;
      const matchPlan = planFilter === 'all' || u.plan_id === planFilter;
      const matchSearch =
        !search ||
        (u.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
        u.username.toLowerCase().includes(search.toLowerCase()) ||
        (u.phone || '').includes(search);
      return matchStatus && matchArea && matchPlan && matchSearch;
    });
  }, [users, statusFilter, areaFilter, planFilter, search]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredUsers.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredUsers.map((u) => u.id)));
    }
  };

  const handleSend = async () => {
    if (!message.trim()) {
      toast.error('Please enter a message');
      return;
    }
    if (selectedIds.size === 0) {
      toast.error('Please select at least one user');
      return;
    }

    setSending(true);
    setSendResult(null);
    let sent = 0;
    let failed = 0;

    const selectedUsers = filteredUsers.filter((u) => selectedIds.has(u.id));

    for (const user of selectedUsers) {
      if (!user.phone) {
        failed++;
        continue;
      }
      const success = await sendSms({
        phone: user.phone,
        message: message.trim(),
        recipientName: user.full_name || user.username,
        radiusUserId: user.id,
      });
      if (success) sent++;
      else failed++;
    }

    setSendResult({ sent, failed });
    setSending(false);
    toast.success(`Group SMS complete: ${sent} sent, ${failed} failed`);
    setSelectedIds(new Set());
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <Filter className="w-4 h-4 text-primary" />
            Filter Users
          </CardTitle>
          <CardDescription>Select users to send SMS to</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Name, username, phone..."
                  className="pl-9 bg-secondary border-border"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="disabled">Disabled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Area</Label>
              <Select value={areaFilter} onValueChange={setAreaFilter}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Areas</SelectItem>
                  {areas.filter(a => a.is_active).map((a) => (
                    <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Plan</Label>
              <Select value={planFilter} onValueChange={setPlanFilter}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Plans</SelectItem>
                  {plans.filter(p => p.is_active).map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Message Compose */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <Send className="w-4 h-4 text-primary" />
            Compose Message
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Type your message here... (max 500 characters)"
            value={message}
            onChange={(e) => setMessage(e.target.value.slice(0, 500))}
            rows={4}
            className="bg-secondary border-border resize-none"
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{message.length}/500 characters</span>
            <div className="flex items-center gap-3">
              {sendResult && (
                <div className="flex items-center gap-3 text-sm">
                  <span className="flex items-center gap-1 text-emerald-500">
                    <CheckCircle className="w-4 h-4" /> {sendResult.sent} sent
                  </span>
                  {sendResult.failed > 0 && (
                    <span className="flex items-center gap-1 text-destructive">
                      <XCircle className="w-4 h-4" /> {sendResult.failed} failed
                    </span>
                  )}
                </div>
              )}
              <Button
                onClick={handleSend}
                disabled={sending || selectedIds.size === 0 || !message.trim()}
              >
                {sending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send to {selectedIds.size} Users
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User Selection Table */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="w-4 h-4 text-primary" />
                Select Recipients
              </CardTitle>
              <CardDescription>
                {filteredUsers.length} users found with phone numbers
              </CardDescription>
            </div>
            <Badge variant="secondary">{selectedIds.size} selected</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-border overflow-hidden max-h-[400px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="w-10">
                    <Checkbox
                      checked={filteredUsers.length > 0 && selectedIds.size === filteredUsers.length}
                      onCheckedChange={toggleSelectAll}
                      className="h-4 w-4"
                    />
                  </TableHead>
                  <TableHead className="text-xs">Name</TableHead>
                  <TableHead className="text-xs">Username</TableHead>
                  <TableHead className="text-xs">Phone</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs hidden md:table-cell">Plan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usersLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <Loader2 className="w-5 h-5 animate-spin mx-auto text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ) : filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No users found with phone numbers matching filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id} className="hover:bg-muted/20 cursor-pointer" onClick={() => toggleSelect(user.id)}>
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.has(user.id)}
                          onCheckedChange={() => toggleSelect(user.id)}
                          className="h-4 w-4"
                        />
                      </TableCell>
                      <TableCell className="text-sm font-medium">{user.full_name || '-'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{user.username}</TableCell>
                      <TableCell className="text-sm">{user.phone}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            user.status === 'active'
                              ? 'border-emerald-500/30 text-emerald-500'
                              : user.status === 'expired'
                              ? 'border-amber-500/30 text-amber-500'
                              : 'border-destructive/30 text-destructive'
                          }
                        >
                          {user.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground hidden md:table-cell">
                        {user.plan?.name || '-'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
