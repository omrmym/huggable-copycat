import { useState, useEffect, useRef } from 'react';
import { Bell, Search, User, LogOut, Settings, UserCircle, Loader2, Activity, Menu, PanelLeftClose } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useSystemActivity, getActionLabel, getEntityLabel } from '@/hooks/useSystemActivity';
import { formatDistanceToNow } from 'date-fns';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface HeaderProps {
  title: string;
  subtitle?: string;
  isSidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
}

interface SearchResult {
  id: string;
  username: string;
  full_name: string | null;
  phone: string | null;
  status: string;
}

export function Header({ title, subtitle, isSidebarCollapsed, onToggleSidebar }: HeaderProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search users when query changes
  useEffect(() => {
    const searchUsers = async () => {
      if (searchQuery.trim().length < 2) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const { data, error } = await supabase
          .from('radius_users')
          .select('id, username, full_name, phone, status')
          .or(`username.ilike.%${searchQuery}%,full_name.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%`)
          .limit(10);

        if (error) throw error;
        setSearchResults(data || []);
        setShowResults(true);
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    const debounce = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  const handleResultClick = (userId: string) => {
    setShowResults(false);
    setSearchQuery('');
    navigate(`/users/${userId}`);
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (error) {
      toast.error('Failed to logout');
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'create': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'update': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'delete': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'recharge': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'status_change': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      default: return '';
    }
  };

  function SystemActivityPopover() {
    const { data: activities, isLoading } = useSystemActivity(20);
    const navigate = useNavigate();
    
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="relative">
            <Activity className="w-5 h-5" />
            {activities && activities.length > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-primary" />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-96 p-0" align="end">
          <div className="flex items-center justify-between p-3 border-b border-border">
            <h4 className="font-semibold text-sm">System Activity</h4>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs h-7"
              onClick={() => navigate('/activity')}
            >
              View All
            </Button>
          </div>
          <ScrollArea className="h-80">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : activities && activities.length > 0 ? (
              <div className="divide-y divide-border">
                {activities.map((activity) => (
                  <div key={activity.id} className="p-3 hover:bg-secondary/50 transition-colors">
                    <div className="flex items-start gap-2">
                      <Badge variant="outline" className={cn("text-xs shrink-0", getActionColor(activity.action))}>
                        {getActionLabel(activity.action)}
                      </Badge>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {activity.entity_name || getEntityLabel(activity.entity_type)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {activity.user_name || activity.user_email} • {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
                No recent activity
              </div>
            )}
          </ScrollArea>
        </PopoverContent>
      </Popover>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'expired': return 'bg-red-500';
      case 'suspended': return 'bg-yellow-500';
      case 'disabled': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <header className="h-16 border-b border-border bg-card/50 backdrop-blur-sm flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        {/* Sidebar Toggle Button */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggleSidebar}
                className="shrink-0"
              >
                {isSidebarCollapsed ? (
                  <Menu className="w-5 h-5" />
                ) : (
                  <PanelLeftClose className="w-5 h-5" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              {isSidebarCollapsed ? 'Show menu' : 'Hide menu'}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <div>
          <h1 className="text-xl font-semibold text-foreground">{title}</h1>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative" ref={searchRef}>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          {isSearching && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground animate-spin" />
          )}
          <Input
            placeholder="Search by ID, name, mobile..."
            className="w-72 pl-9 pr-9 bg-secondary border-none"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => searchResults.length > 0 && setShowResults(true)}
          />
          
          {/* Search Results Dropdown */}
          {showResults && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-md shadow-lg z-50 max-h-80 overflow-auto">
              {searchResults.map((result) => (
                <div
                  key={result.id}
                  className="px-4 py-3 hover:bg-secondary cursor-pointer border-b border-border last:border-b-0"
                  onClick={() => handleResultClick(result.id)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm text-foreground">{result.full_name || result.username}</p>
                      <p className="text-xs text-muted-foreground">
                        ID: {result.username} {result.phone && `• ${result.phone}`}
                      </p>
                    </div>
                    <div className={cn("w-2 h-2 rounded-full", getStatusColor(result.status))} />
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* No Results */}
          {showResults && searchQuery.length >= 2 && searchResults.length === 0 && !isSearching && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-md shadow-lg z-50 p-4">
              <p className="text-sm text-muted-foreground text-center">No users found</p>
            </div>
          )}
        </div>

        {/* System Activity */}
        <SystemActivityPopover />

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <User className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="text-sm">Admin</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-card border-border">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/settings')} className="cursor-pointer">
              <UserCircle className="w-4 h-4 mr-2" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/settings')} className="cursor-pointer">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive cursor-pointer focus:text-destructive">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
