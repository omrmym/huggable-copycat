import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Ticket, CreditCard, Settings, Wifi, Network, BarChart3, LogOut, Wallet, ChevronDown, UserPlus, UserCheck, MapPin, Building2, Map, CheckCircle, Clock, UserCog, DollarSign, TrendingUp, TrendingDown, Store, GitBranch, PieChart, Calendar, Activity, HardDrive, List, ClipboardCheck, MessageSquare } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { useBrandingSettings } from '@/components/settings/BrandingSettings';
import { useHasPermission } from '@/hooks/useHasPermission';

const userSubItems: SidebarSubItem[] = [
  { icon: UserPlus, label: 'Create User', path: '/users/create', subKey: 'sub.users.create', permissions: ['users.create.service_type', 'users.create.connection_date', 'users.create.expire_date', 'users.create.monthly_bill'] },
  { icon: UserCheck, label: 'All Users', path: '/users', subKey: 'sub.users.all', permissions: ['users.all.view'] },
  { icon: ClipboardCheck, label: 'Requests', path: '/users/requests', subKey: 'sub.users.requests', permissions: ['users.requests.view'] },
  { icon: MapPin, label: 'Area', path: '/users/area', subKey: 'sub.users.location', permissions: ['users.area.manage'] },
  { icon: Building2, label: 'Police Station', path: '/users/police-station', subKey: 'sub.users.location', permissions: ['users.police_station.manage'] },
  { icon: Map, label: 'District', path: '/users/district', subKey: 'sub.users.location', permissions: ['users.district.manage'] },
];

const rechargeSubItems: SidebarSubItem[] = [
  { icon: PieChart, label: 'Billing Statistics', path: '/recharge/statistics', subKey: 'sub.recharge.statistics', permissions: ['recharge.statistics'] },
  { icon: Wallet, label: 'Customer Recharge', path: '/recharge/customer', subKey: 'sub.recharge.customer', permissions: ['recharge.customer', 'recharge.customer.recharge'] },
  { icon: Ticket, label: 'Manage Recharge', path: '/recharge/manage', subKey: 'sub.recharge.manage', permissions: ['recharge.manage', 'recharge.manage.delete', 'recharge.manage.invoice'] },
  { icon: Clock, label: 'Pending Bill Collection', path: '/recharge/pending', subKey: 'sub.recharge.pending', permissions: ['recharge.pending', 'recharge.pending.approve', 'recharge.pending.reject'] },
  { icon: CheckCircle, label: 'Approved Bill Collection', path: '/recharge/approved', subKey: 'sub.recharge.approved', permissions: ['recharge.approved', 'recharge.approved.delete', 'recharge.approved.invoice'] },
];

const financeSubItems = [
  { icon: DollarSign, label: 'Overview', path: '/finance/overview', permissions: ['finance.overview'] },
  { icon: TrendingUp, label: 'Income', path: '/finance/income', permissions: ['finance.income.view'] },
  { icon: TrendingDown, label: 'Expense', path: '/finance/expense', permissions: ['finance.expense.view'] },
];

const reportSubItems = [
  { icon: BarChart3, label: 'Billing Report', path: '/reports/billing', permissions: ['reports.billing'] },
  { icon: Wallet, label: 'Connection Fee', path: '/reports/connection-fee', permissions: ['reports.connection'] },
  { icon: TrendingUp, label: 'Extra Income', path: '/reports/extra-income', permissions: ['reports.income'] },
  { icon: TrendingDown, label: 'Expense', path: '/reports/expense', permissions: ['reports.expense'] },
  { icon: UserCog, label: 'Employee Salary', path: '/reports/employee-salary', permissions: ['reports.salary'] },
  { icon: Calendar, label: 'Leave Report', path: '/reports/leave', permissions: ['reports.leave'] },
  { icon: DollarSign, label: 'Final Report', path: '/reports/final', permissions: ['reports.final'] },
  { icon: Users, label: 'Man Wise Bill Collection', path: '/reports/man-wise-collection', permissions: ['reports.manwise'] },
  { icon: UserPlus, label: 'Monthly New Line', path: '/reports/monthly-new-line', permissions: ['reports.newline'] },
  { icon: Clock, label: 'Monthly Expire User', path: '/reports/monthly-expire', permissions: ['reports.expire'] },
  { icon: Building2, label: 'BTRC Report', path: '/reports/btrc', permissions: ['reports.btrc'] },
];

type SidebarSubItem = {
  icon: any;
  label: string;
  path: string;
  subKey?: string;
  permissions: string[];
};

interface SidebarProps {
  isCollapsed?: boolean;
}

export function Sidebar({ isCollapsed = false }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const { toast } = useToast();
  const { data: branding } = useBrandingSettings();
  const { hasPermission, hasAnyPermission } = useHasPermission();

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
    toast({ title: 'Logged out', description: 'You have been successfully logged out.' });
    navigate('/login');
  };

  // Filter sub-items by feature permission or subKey permission
  const filterItems = (items: SidebarSubItem[]) =>
    items.filter(item => hasAnyPermission(item.permissions) || (item.subKey && hasPermission(item.subKey)));

  const filteredUserItems = filterItems(userSubItems);
  const filteredRechargeItems = filterItems(rechargeSubItems);
  const filteredFinanceItems = filterItems(financeSubItems);
  const filteredReportItems = filterItems(reportSubItems);

  // Menu-level visibility: requires menu.* permission + at least one feature permission
  const showDashboard = hasPermission('menu.dashboard');
  const showHR = hasPermission('menu.hr_admin') && hasAnyPermission(['hr.employees.view', 'hr.departments.view', 'hr.leave.view', 'hr.payroll.view']);
  const showUsers = hasPermission('menu.users') && filteredUserItems.length > 0;
  const showRecharge = hasPermission('menu.recharge') && filteredRechargeItems.length > 0;
  const showFinance = hasPermission('menu.finance') && filteredFinanceItems.length > 0;
  const showReports = hasPermission('menu.reports') && filteredReportItems.length > 0;
  const showPlans = hasPermission('menu.plans') && hasPermission('plans.view');
  const showSMS = hasPermission('menu.sms') && hasAnyPermission(['sms.send', 'sms.history', 'sms.templates']);
  const showActivity = hasPermission('menu.activity') && hasAnyPermission(['activity.system', 'activity.login', 'activity.user']);
  const showSettings = hasPermission('menu.settings') && hasAnyPermission(['settings.users', 'settings.roles', 'settings.branding', 'settings.mikrotik', 'settings.connectivity_types', 'settings.categories', 'settings.payment', 'settings.payment_gateway', 'settings.shareholders', 'settings.sms_gateway', 'settings.session', 'settings.timezone', 'settings.super_admin', 'settings.activity', 'settings.customer_portal']);

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
          <div className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden">
            {branding?.logo_url ? (
              <img src={branding.logo_url} alt="Logo" className="w-full h-full object-contain" />
            ) : (
              <div className="w-full h-full bg-gradient-primary flex items-center justify-center rounded-xl">
                <Network className="w-6 h-6 text-primary-foreground" />
              </div>
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
        {showDashboard && (
          <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>
            <LayoutDashboard className="w-5 h-5" />
            <span>Dashboard</span>
          </Link>
        )}

        {showHR && (
          <Link to="/hr-admin" className={`nav-link ${location.pathname === '/hr-admin' ? 'active' : ''}`}>
            <UserCog className="w-5 h-5" />
            <span>HR Admin</span>
          </Link>
        )}

        {showUsers && (
          <Collapsible open={isUsersOpen} onOpenChange={setIsUsersOpen}>
            <CollapsibleTrigger className="nav-link w-full justify-between">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5" />
                <span>My Users</span>
              </div>
              <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isUsersOpen ? 'rotate-180' : ''}`} />
            </CollapsibleTrigger>
            <CollapsibleContent className="pl-4 mt-1 space-y-1">
              {filteredUserItems.map(item => {
                const isActive = location.pathname === item.path;
                return (
                  <Link key={item.path} to={item.path} className={`nav-link text-sm ${isActive ? 'active' : ''}`}>
                    <item.icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </CollapsibleContent>
          </Collapsible>
        )}

        {showRecharge && (
          <Collapsible open={isRechargeOpen} onOpenChange={setIsRechargeOpen}>
            <CollapsibleTrigger className="nav-link w-full justify-between">
              <div className="flex items-center gap-3">
                <Ticket className="w-5 h-5" />
                <span>Recharge</span>
              </div>
              <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isRechargeOpen ? 'rotate-180' : ''}`} />
            </CollapsibleTrigger>
            <CollapsibleContent className="pl-4 mt-1 space-y-1">
              {filteredRechargeItems.map(item => {
                const isActive = location.pathname === item.path;
                return (
                  <Link key={item.path} to={item.path} className={`nav-link text-sm ${isActive ? 'active' : ''}`}>
                    <item.icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </CollapsibleContent>
          </Collapsible>
        )}

        {showFinance && (
          <Collapsible open={isFinanceOpen} onOpenChange={setIsFinanceOpen}>
            <CollapsibleTrigger className="nav-link w-full justify-between">
              <div className="flex items-center gap-3">
                <DollarSign className="w-5 h-5" />
                <span>Finance</span>
              </div>
              <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isFinanceOpen ? 'rotate-180' : ''}`} />
            </CollapsibleTrigger>
            <CollapsibleContent className="pl-4 mt-1 space-y-1">
              {filteredFinanceItems.map(item => {
                const isActive = location.pathname === item.path;
                return (
                  <Link key={item.path} to={item.path} className={`nav-link text-sm ${isActive ? 'active' : ''}`}>
                    <item.icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </CollapsibleContent>
          </Collapsible>
        )}

        {showReports && (
          <Collapsible open={isReportsOpen} onOpenChange={setIsReportsOpen}>
            <CollapsibleTrigger className="nav-link w-full justify-between">
              <div className="flex items-center gap-3">
                <BarChart3 className="w-5 h-5" />
                <span>Reports</span>
              </div>
              <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isReportsOpen ? 'rotate-180' : ''}`} />
            </CollapsibleTrigger>
            <CollapsibleContent className="pl-4 mt-1 space-y-1">
              {filteredReportItems.map(item => {
                const isActive = location.pathname === item.path;
                return (
                  <Link key={item.path} to={item.path} className={`nav-link text-sm ${isActive ? 'active' : ''}`}>
                    <item.icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </CollapsibleContent>
          </Collapsible>
        )}

        {showPlans && (
          <Link to="/plans" className={`nav-link ${location.pathname === '/plans' ? 'active' : ''}`}>
            <CreditCard className="w-5 h-5" />
            <span>Plans</span>
          </Link>
        )}

        {showSMS && (
          <Link to="/sms-history" className={`nav-link ${location.pathname === '/sms-history' ? 'active' : ''}`}>
            <MessageSquare className="w-5 h-5" />
            <span>SMS History</span>
          </Link>
        )}

        {showActivity && (
          <Link to="/activity" className={`nav-link ${location.pathname === '/activity' ? 'active' : ''}`}>
            <Activity className="w-5 h-5" />
            <span>Activity</span>
          </Link>
        )}

        {showSettings && (
          <Link to="/settings" className={`nav-link ${location.pathname === '/settings' ? 'active' : ''}`}>
            <Settings className="w-5 h-5" />
            <span>Settings</span>
          </Link>
        )}
      </nav>

      {/* User Info & Logout */}
      <div className="p-4 border-t border-sidebar-border space-y-2">
        {user && (
          <div className="text-xs text-muted-foreground truncate px-2">
            {user.email}
          </div>
        )}
        <button onClick={handleLogout} className="nav-link w-full text-destructive hover:text-destructive hover:bg-destructive/10">
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
