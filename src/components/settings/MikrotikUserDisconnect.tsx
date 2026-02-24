import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useRadiusUsers, useDisconnectUser } from '@/hooks/useRadiusUsers';
import { Unplug, Search, Loader2, Wifi, Network, User } from 'lucide-react';

export function MikrotikUserDisconnect() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  
  const { data: users = [], isLoading } = useRadiusUsers();
  const disconnectUser = useDisconnectUser();

  // Filter users based on search query
  const filteredUsers = users.filter((user) => {
    const query = searchQuery.toLowerCase();
    return (
      user.username.toLowerCase().includes(query) ||
      user.full_name?.toLowerCase().includes(query) ||
      user.phone?.toLowerCase().includes(query)
    );
  });

  const selectedUser = users.find((u) => u.id === selectedUserId);

  const handleDisconnect = () => {
    if (!selectedUser) return;
    
    disconnectUser.mutate({
      username: selectedUser.username,
      service_type: selectedUser.service_type,
    });
  };

  const getServiceIcon = (serviceType: 'hotspot' | 'pppoe') => {
    return <Wifi className="w-4 h-4 text-primary" />;
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; className: string }> = {
      active: { label: 'Active', className: 'bg-success/20 text-success border-success/30' },
      disabled: { label: 'Disabled', className: 'bg-muted text-muted-foreground border-muted' },
      expired: { label: 'Expired', className: 'bg-destructive/20 text-destructive border-destructive/30' },
      suspended: { label: 'Suspended', className: 'bg-warning/20 text-warning border-warning/30' },
    };
    const statusConfig = config[status] || config.disabled;
    return (
      <Badge variant="outline" className={statusConfig.className}>
        {statusConfig.label}
      </Badge>
    );
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Unplug className="w-5 h-5 text-primary" />
          Disconnect User Session
        </CardTitle>
        <CardDescription>
          Force disconnect a user's active session from the MikroTik router.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search Input */}
        <div className="space-y-2">
          <Label>Search User</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by username, name, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-secondary border-border"
            />
          </div>
        </div>

        {/* User Selection */}
        <div className="space-y-2">
          <Label>Select User</Label>
          <Select value={selectedUserId} onValueChange={setSelectedUserId}>
            <SelectTrigger className="bg-secondary border-border">
              <SelectValue placeholder={isLoading ? 'Loading users...' : 'Choose a user to disconnect'} />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border max-h-60">
              {filteredUsers.length === 0 ? (
                <div className="p-2 text-sm text-muted-foreground text-center">
                  {searchQuery ? 'No users found' : 'No users available'}
                </div>
              ) : (
                filteredUsers.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    <div className="flex items-center gap-2">
                      {getServiceIcon(user.service_type)}
                      <span className="font-medium">{user.username}</span>
                      {user.full_name && (
                        <span className="text-muted-foreground">- {user.full_name}</span>
                      )}
                    </div>
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Selected User Details */}
        {selectedUser && (
          <div className="bg-muted/30 rounded-lg p-4 border border-border space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                <span className="font-medium">{selectedUser.full_name || selectedUser.username}</span>
              </div>
              {getStatusBadge(selectedUser.status)}
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Username:</span>
                <span className="ml-2 font-mono">{selectedUser.username}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground">Service:</span>
                <span className="ml-2 capitalize flex items-center gap-1">
                  {getServiceIcon(selectedUser.service_type)}
                  {selectedUser.service_type}
                </span>
              </div>
              {selectedUser.phone && (
                <div>
                  <span className="text-muted-foreground">Phone:</span>
                  <span className="ml-2">{selectedUser.phone}</span>
                </div>
              )}
              {selectedUser.ip_address && (
                <div>
                  <span className="text-muted-foreground">IP:</span>
                  <span className="ml-2 font-mono">{selectedUser.ip_address}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Disconnect Button */}
        <Button
          onClick={handleDisconnect}
          disabled={!selectedUserId || disconnectUser.isPending}
          variant="destructive"
          className="w-full"
        >
          {disconnectUser.isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Disconnecting...
            </>
          ) : (
            <>
              <Unplug className="w-4 h-4 mr-2" />
              Disconnect User Session
            </>
          )}
        </Button>

        {/* Info */}
        <p className="text-xs text-muted-foreground text-center">
          This will immediately terminate the user's active connection on the MikroTik router.
        </p>
      </CardContent>
    </Card>
  );
}
