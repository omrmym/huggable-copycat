import { useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useResellerAuth } from '@/contexts/ResellerAuthContext';
import { ResellerLayout } from '@/components/reseller/ResellerLayout';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAreas } from '@/hooks/useAreas';
import { Search, ArrowLeft, Wifi, WifiOff, Eye, Loader2 } from 'lucide-react';

export default function ResellerOnlineOfflineUsers() {
  const { reseller, sessionToken, isLoading: authLoading } = useResellerAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('status') || 'online';
  
  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAreaId, setSelectedAreaId] = useState<string>('all');

  const isSuperAdmin = reseller?.is_super_admin || false;

  // Fetch all active users for this reseller
  const { data: allUsers = [], isLoading: usersLoading } = useQuery({
    queryKey: ['reseller-all-active-users', reseller?.id, isSuperAdmin],
    queryFn: async () => {
      if (!reseller?.id && !isSuperAdmin) return [];
      
      const { data, error } = await supabase.functions.invoke('reseller-get-users', {
        body: {
          resellerId: reseller?.id,
          isSuperAdmin,
          statusFilter: 'active',
          session_token: sessionToken,
        },
      });
      
      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Failed to fetch users');
      
      // Filter to only active users (in case edge function doesn't filter)
      return (data.users || []).filter((u: any) => u.status === 'active');
    },
    enabled: !!reseller?.id || isSuperAdmin,
  });

  // Fetch online usernames
  const { data: onlineData, isLoading: onlineLoading } = useQuery({
    queryKey: ['reseller-online-usernames', reseller?.id, isSuperAdmin],
    queryFn: async () => {
      if (!reseller?.id && !isSuperAdmin) return { onlineUsernames: [] };
      
      const { data, error } = await supabase.functions.invoke('reseller-get-charts', {
        body: {
          resellerId: reseller?.id,
          isSuperAdmin,
          chartType: 'online-users',
        },
      });
      
      if (error) throw error;
      return data.data || { onlineUsernames: [] };
    },
    enabled: !!reseller?.id || isSuperAdmin,
    refetchInterval: 30000,
  });

  const { data: areas = [], isLoading: areasLoading } = useAreas();

  const isLoading = authLoading || usersLoading || onlineLoading || areasLoading;

  const onlineUsernames = onlineData?.onlineUsernames || [];

  // Create a map for area names
  const areaMap = useMemo(() => {
    const map: Record<string, string> = {};
    areas.forEach(area => {
      map[area.id] = area.name;
    });
    return map;
  }, [areas]);

  // Get detailed user info for online users
  const onlineUsers = useMemo(() => {
    return allUsers.filter((user: any) => onlineUsernames.includes(user.username));
  }, [allUsers, onlineUsernames]);

  // Get detailed user info for offline users
  const offlineUsers = useMemo(() => {
    return allUsers.filter((user: any) => !onlineUsernames.includes(user.username));
  }, [allUsers, onlineUsernames]);

  // Filter based on search and area
  const filteredOnlineUsers = useMemo(() => {
    let filtered = onlineUsers;
    
    // Filter by area
    if (selectedAreaId !== 'all') {
      filtered = filtered.filter((user: any) => user.area_id === selectedAreaId);
    }
    
    // Filter by search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((user: any) => 
        user.username.toLowerCase().includes(query) ||
        (user.full_name?.toLowerCase() || '').includes(query) ||
        (user.phone?.toLowerCase() || '').includes(query)
      );
    }
    
    return filtered;
  }, [onlineUsers, searchQuery, selectedAreaId]);

  const filteredOfflineUsers = useMemo(() => {
    let filtered = offlineUsers;
    
    // Filter by area
    if (selectedAreaId !== 'all') {
      filtered = filtered.filter((user: any) => user.area_id === selectedAreaId);
    }
    
    // Filter by search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((user: any) => 
        user.username.toLowerCase().includes(query) ||
        (user.full_name?.toLowerCase() || '').includes(query) ||
        (user.phone?.toLowerCase() || '').includes(query)
      );
    }
    
    return filtered;
  }, [offlineUsers, searchQuery, selectedAreaId]);

  const currentUsers = activeTab === 'online' ? filteredOnlineUsers : filteredOfflineUsers;

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!reseller) {
    navigate('/reseller/login', { replace: true });
    return null;
  }

  if (isLoading) {
    return (
      <ResellerLayout title="Online / Offline Users" subtitle="View users by connection status">
        <div className="space-y-4">
          <Skeleton className="h-10 w-72" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      </ResellerLayout>
    );
  }

  return (
    <ResellerLayout title="Online / Offline Users" subtitle="View users by connection status">
      <div className="space-y-6">
        {/* Header with back button */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/reseller')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h2 className="text-lg font-semibold">User Connection Status</h2>
            <p className="text-sm text-muted-foreground">
              {onlineUsers.length} online, {offlineUsers.length} offline (active users only)
            </p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <TabsList>
              <TabsTrigger value="online" className="gap-2">
                <Wifi className="w-4 h-4" />
                Online ({onlineUsers.length})
              </TabsTrigger>
              <TabsTrigger value="offline" className="gap-2">
                <WifiOff className="w-4 h-4" />
                Offline ({offlineUsers.length})
              </TabsTrigger>
            </TabsList>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              {/* Area Filter */}
              <Select value={selectedAreaId} onValueChange={setSelectedAreaId}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="All Areas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Areas</SelectItem>
                  {areas.map((area) => (
                    <SelectItem key={area.id} value={area.id}>
                      {area.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Search */}
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by ID, name, mobile..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>

          <TabsContent value="online" className="mt-4">
            <UserTable users={currentUsers} type="online" areaMap={areaMap} onViewUser={(id) => navigate(`/reseller/users/${id}`)} />
          </TabsContent>

          <TabsContent value="offline" className="mt-4">
            <UserTable users={currentUsers} type="offline" areaMap={areaMap} onViewUser={(id) => navigate(`/reseller/users/${id}`)} />
          </TabsContent>
        </Tabs>
      </div>
    </ResellerLayout>
  );
}

interface UserTableProps {
  users: Array<{
    id: string;
    username: string;
    full_name: string | null;
    phone: string | null;
    status: string;
    area_id: string | null;
  }>;
  type: 'online' | 'offline';
  areaMap: Record<string, string>;
  onViewUser: (id: string) => void;
}

function UserTable({ users, type, areaMap, onViewUser }: UserTableProps) {
  if (users.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-8 text-center">
        <div className="flex flex-col items-center gap-2">
          {type === 'online' ? (
            <Wifi className="w-12 h-12 text-muted-foreground" />
          ) : (
            <WifiOff className="w-12 h-12 text-muted-foreground" />
          )}
          <p className="text-muted-foreground">No {type} users found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Username</TableHead>
            <TableHead>Full Name</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Area</TableHead>
            <TableHead>Connection</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-mono font-medium">{user.username}</TableCell>
              <TableCell>{user.full_name || '-'}</TableCell>
              <TableCell>{user.phone || '-'}</TableCell>
              <TableCell>{user.area_id ? areaMap[user.area_id] || '-' : '-'}</TableCell>
              <TableCell>
                <Badge variant={type === 'online' ? 'default' : 'secondary'} className={type === 'online' ? 'bg-online text-online-foreground' : ''}>
                  {type === 'online' ? 'Online' : 'Offline'}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="sm" onClick={() => onViewUser(user.id)}>
                  <Eye className="w-4 h-4 mr-1" />
                  View
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
