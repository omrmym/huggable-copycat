import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, History, Building2, LogOut, Wallet, Network, CreditCard, RefreshCw, ChevronDown, UserPlus, UserCheck, MapPin, Map, Ticket, PieChart, Clock, CheckCircle, FileText, DollarSign, UserPlus as NewLine } from 'lucide-react';
import { useResellerAuth } from '@/contexts/ResellerAuthContext';
import { useToast } from '@/hooks/use-toast';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const userSubItems = [
  { icon: UserPlus, label: 'Create User', path: '/reseller/users/create' },
  { icon: UserCheck, label: 'All Users', path: '/reseller/users' },
  { icon: MapPin, label: 'Area', path: '/reseller/users/area' },
  { icon: Building2, label: 'Police Station', path: '/reseller/users/police-station' },
  { icon: Map, label: 'District', path: '/reseller/users/district' },
];

const rechargeSubItems = [
  { icon: PieChart, label: 'Billing Statistics', path: '/reseller/recharge/statistics' },
  { icon: Wallet, label: 'Customer Recharge', path: '/reseller/recharge/customer' },
  { icon: Ticket, label: 'Manage Recharge', path: '/reseller/recharge/manage' },
  { icon: Clock, label: 'Pending Bill Collection', path: '/reseller/recharge/pending' },
  { icon: CheckCircle, label: 'Approved Bill Collection', path: '/reseller/recharge/approved' },
];

const reportSubItems = [
  { icon: DollarSign, label: 'Billing Report', path: '/reseller/reports/billing' },
  { icon: CreditCard, label: 'Connection Fee', path: '/reseller/reports/connection-fee' },
  { icon: Users, label: 'Man Wise Collection', path: '/reseller/reports/man-wise-collection' },
  { icon: NewLine, label: 'Monthly New Line', path: '/reseller/reports/monthly-new-line' },
];

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/reseller' },
  { icon: History, label: 'Credit History', path: '/reseller/credits' },
  { icon: Building2, label: 'My Branches', path: '/reseller/branches' },
];

export function ResellerSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { reseller, logout, refreshReseller } = useResellerAuth();
  const { toast } = useToast();

  // Auto-expand menus if on their routes
  const isOnUsersRoute = location.pathname.startsWith('/reseller/users');
  const isOnRechargeRoute = location.pathname.startsWith('/reseller/recharge');
  const isOnReportsRoute = location.pathname.startsWith('/reseller/reports');
  const [isUsersOpen, setIsUsersOpen] = useState(isOnUsersRoute);
  const [isRechargeOpen, setIsRechargeOpen] = useState(isOnRechargeRoute);
  const [isReportsOpen, setIsReportsOpen] = useState(isOnReportsRoute);

  const handleLogout = () => {
    logout();
    toast({
      title: 'Logged out',
      description: 'You have been successfully logged out.',
    });
    navigate('/reseller/login');
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
            <Network className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-bold text-foreground">MikroBill</h1>
            <p className="text-xs text-muted-foreground">Reseller Portal</p>
          </div>
        </div>
      </div>

      {/* Reseller Info */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <p className="font-medium text-foreground truncate">{reseller?.name}</p>
            <p className="text-xs text-muted-foreground">{reseller?.code || 'Reseller'}</p>
          </div>
          <button 
            onClick={refreshReseller}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
        <div className="mt-3 p-3 bg-primary/10 rounded-lg">
          <div className="flex items-center gap-2">
            <Wallet className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground">Balance</span>
          </div>
          <p className="text-xl font-bold text-primary mt-1">
            ৳{reseller?.balance?.toLocaleString() || 0}
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {/* Dashboard */}
        <Link
          to="/reseller"
          className={`nav-link ${location.pathname === '/reseller' ? 'active' : ''}`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span>Dashboard</span>
        </Link>

        {/* My Users with Submenu */}
        <Collapsible open={isUsersOpen} onOpenChange={setIsUsersOpen}>
          <CollapsibleTrigger className="nav-link w-full justify-between">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5" />
              <span>My Users</span>
            </div>
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isUsersOpen ? 'rotate-180' : ''}`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="pl-4 mt-1 space-y-1">
            {userSubItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`nav-link text-sm ${isActive ? 'active' : ''}`}
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </CollapsibleContent>
        </Collapsible>

        {/* Recharge with Submenu */}
        <Collapsible open={isRechargeOpen} onOpenChange={setIsRechargeOpen}>
          <CollapsibleTrigger className="nav-link w-full justify-between">
            <div className="flex items-center gap-3">
              <Ticket className="w-5 h-5" />
              <span>Recharge</span>
            </div>
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isRechargeOpen ? 'rotate-180' : ''}`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="pl-4 mt-1 space-y-1">
            {rechargeSubItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`nav-link text-sm ${isActive ? 'active' : ''}`}
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </CollapsibleContent>
        </Collapsible>

        {/* Reports with Submenu */}
        <Collapsible open={isReportsOpen} onOpenChange={setIsReportsOpen}>
          <CollapsibleTrigger className="nav-link w-full justify-between">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5" />
              <span>Reports</span>
            </div>
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isReportsOpen ? 'rotate-180' : ''}`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="pl-4 mt-1 space-y-1">
            {reportSubItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`nav-link text-sm ${isActive ? 'active' : ''}`}
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </CollapsibleContent>
        </Collapsible>

        {/* Other Nav Items */}
        {navItems.slice(1).map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-link ${isActive ? 'active' : ''}`}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-sidebar-border">
        <button
          onClick={handleLogout}
          className="nav-link w-full text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
