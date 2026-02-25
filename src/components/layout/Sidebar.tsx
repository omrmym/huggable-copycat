import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Ticket, CreditCard, Settings, Wifi, Network, BarChart3, LogOut, Wallet, ChevronDown, UserPlus, UserCheck, MapPin, Building2, Map, CheckCircle, Clock, UserCog, DollarSign, TrendingUp, TrendingDown, Store, GitBranch, PieChart, Calendar, Activity, HardDrive, List, ClipboardCheck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { useBrandingSettings } from '@/components/settings/BrandingSettings';
const userSubItems = [{
  icon: UserPlus,
  label: 'Create User',
  path: '/users/create'
}, {
  icon: UserCheck,
  label: 'All Users',
  path: '/users'
}, {
  icon: ClipboardCheck,
  label: 'Requests',
  path: '/users/requests'
}, {
  icon: MapPin,
  label: 'Area',
  path: '/users/area'
}, {
  icon: Building2,
  label: 'Police Station',
  path: '/users/police-station'
}, {
  icon: Map,
  label: 'District',
  path: '/users/district'
}];
const rechargeSubItems = [{
  icon: PieChart,
  label: 'Billing Statistics',
  path: '/recharge/statistics'
}, {
  icon: Wallet,
  label: 'Customer Recharge',
  path: '/recharge/customer'
}, {
  icon: Ticket,
  label: 'Manage Recharge',
  path: '/recharge/manage'
}, {
  icon: Clock,
  label: 'Pending Bill Collection',
  path: '/recharge/pending'
}, {
  icon: CheckCircle,
  label: 'Approved Bill Collection',
  path: '/recharge/approved'
}];
const financeSubItems = [{
  icon: DollarSign,
  label: 'Overview',
  path: '/finance/overview'
}, {
  icon: TrendingUp,
  label: 'Income',
  path: '/finance/income'
}, {
  icon: TrendingDown,
  label: 'Expense',
  path: '/finance/expense'
}];




const reportSubItems = [{
  icon: BarChart3,
  label: 'Billing Report',
  path: '/reports/billing'
}, {
  icon: Wallet,
  label: 'Connection Fee',
  path: '/reports/connection-fee'
}, {
  icon: TrendingUp,
  label: 'Extra Income',
  path: '/reports/extra-income'
}, {
  icon: TrendingDown,
  label: 'Expense',
  path: '/reports/expense'
}, {


  icon: UserCog,
  label: 'Employee Salary',
  path: '/reports/employee-salary'
}, {
  icon: Calendar,
  label: 'Leave Report',
  path: '/reports/leave'
}, {
  icon: DollarSign,
  label: 'Final Report',
  path: '/reports/final'
}, {
  icon: Users,
  label: 'Man Wise Bill Collection',
  path: '/reports/man-wise-collection'
}, {
  icon: UserPlus,
  label: 'Monthly New Line',
  path: '/reports/monthly-new-line'
}, {
  icon: Clock,
  label: 'Monthly Expire User',
  path: '/reports/monthly-expire'
}, {
  icon: Building2,
  label: 'BTRC Report',
  path: '/reports/btrc'
}];
const navItems = [{
  icon: LayoutDashboard,
  label: 'Dashboard',
  path: '/'
}, {
  icon: CreditCard,
  label: 'Plans',
  path: '/plans'
}, {
  icon: Activity,
  label: 'Activity',
  path: '/activity'
}, {
  icon: Settings,
  label: 'Settings',
  path: '/settings'
}];

interface SidebarProps {
  isCollapsed?: boolean;
}

export function Sidebar({ isCollapsed = false }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    signOut,
    user
  } = useAuth();
  const {
    toast
  } = useToast();
  const { data: branding } = useBrandingSettings();

  // Auto-expand menus if on their routes
  const isOnUsersRoute = location.pathname.startsWith('/users');
  const isOnRechargeRoute = location.pathname.startsWith('/recharge');
  const isOnFinanceRoute = location.pathname.startsWith('/finance');
  

  const isOnReportsRoute = location.pathname.startsWith('/reports');
  const [isUsersOpen, setIsUsersOpen] = useState(isOnUsersRoute);
  const [isRechargeOpen, setIsRechargeOpen] = useState(isOnRechargeRoute);
  const [isFinanceOpen, setIsFinanceOpen] = useState(isOnFinanceRoute);
  const [isReportsOpen, setIsReportsOpen] = useState(isOnReportsRoute);
  const handleLogout = async () => {
    await signOut();
    toast({
      title: 'Logged out',
      description: 'You have been successfully logged out.'
    });
    navigate('/login');
  };

  return (
    <aside 
      className={cn(
        "fixed left-0 top-0 h-screen bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300 z-50",
        isCollapsed ? "-translate-x-full w-64" : "translate-x-0 w-64"
      )}
    >
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center overflow-hidden">
            {branding?.logo_url ? (
              <img src={branding.logo_url} alt="Logo" className="w-full h-full object-contain p-1" />
            ) : (
              <Network className="w-6 h-6 text-primary-foreground" />
            )}
          </div>
          <div>
            <h1 className="font-bold text-foreground">{branding?.company_name || 'MikroBill'}</h1>
            <p className="text-xs text-muted-foreground">{branding?.company_subtitle || 'RADIUS Manager'}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {/* Dashboard */}
        <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>
          <LayoutDashboard className="w-5 h-5" />
          <span>Dashboard</span>
        </Link>

        {/* HR Admin */}
        <Link to="/hr-admin" className={`nav-link ${location.pathname === '/hr-admin' ? 'active' : ''}`}>
          <UserCog className="w-5 h-5" />
          <span>HR Admin</span>
        </Link>

        {/* Users with Submenu */}
        <Collapsible open={isUsersOpen} onOpenChange={setIsUsersOpen}>
          <CollapsibleTrigger className="nav-link w-full justify-between">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5" />
              <span>My Users</span>
            </div>
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isUsersOpen ? 'rotate-180' : ''}`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="pl-4 mt-1 space-y-1">
            {userSubItems.map(item => {
            const isActive = location.pathname === item.path;
            return <Link key={item.path} to={item.path} className={`nav-link text-sm ${isActive ? 'active' : ''}`}>
                  <item.icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>;
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
            {rechargeSubItems.map(item => {
            const isActive = location.pathname === item.path;
            return <Link key={item.path} to={item.path} className={`nav-link text-sm ${isActive ? 'active' : ''}`}>
                  <item.icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>;
          })}
          </CollapsibleContent>
        </Collapsible>

        {/* Finance with Submenu */}
        <Collapsible open={isFinanceOpen} onOpenChange={setIsFinanceOpen}>
          <CollapsibleTrigger className="nav-link w-full justify-between">
            <div className="flex items-center gap-3">
              <DollarSign className="w-5 h-5" />
              <span>Finance</span>
            </div>
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isFinanceOpen ? 'rotate-180' : ''}`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="pl-4 mt-1 space-y-1">
            {financeSubItems.map(item => {
            const isActive = location.pathname === item.path;
            return <Link key={item.path} to={item.path} className={`nav-link text-sm ${isActive ? 'active' : ''}`}>
                  <item.icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>;
          })}
          </CollapsibleContent>
        </Collapsible>




        {/* Reports with Submenu */}
        <Collapsible open={isReportsOpen} onOpenChange={setIsReportsOpen}>
          <CollapsibleTrigger className="nav-link w-full justify-between">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-5 h-5" />
              <span>Reports</span>
            </div>
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isReportsOpen ? 'rotate-180' : ''}`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="pl-4 mt-1 space-y-1">
            {reportSubItems.map(item => {
            const isActive = location.pathname === item.path;
            return <Link key={item.path} to={item.path} className={`nav-link text-sm ${isActive ? 'active' : ''}`}>
                  <item.icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>;
          })}
          </CollapsibleContent>
        </Collapsible>

        {/* Other Nav Items */}
        {navItems.slice(1).map(item => {
        const isActive = location.pathname === item.path;
        return <Link key={item.path} to={item.path} className={`nav-link ${isActive ? 'active' : ''}`}>
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>;
      })}
      </nav>

      {/* Service Status */}
      

      {/* User Info & Logout */}
      <div className="p-4 border-t border-sidebar-border space-y-2">
        {user && <div className="text-xs text-muted-foreground truncate px-2">
            {user.email}
          </div>}
        <button onClick={handleLogout} className="nav-link w-full text-destructive hover:text-destructive hover:bg-destructive/10">
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}