import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Ticket, CreditCard, Settings, Wifi, Network, BarChart3, LogOut, Wallet, ChevronDown, UserPlus, UserCheck, MapPin, Building2, Map, CheckCircle, Clock, UserCog, DollarSign, TrendingUp, TrendingDown, Store, GitBranch, PieChart, Calendar, Activity, HardDrive, List, ClipboardCheck, MessageSquare } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { useBrandingSettings } from '@/components/settings/BrandingSettings';
import { useHasPermission } from '@/hooks/useHasPermission';

const userSubItems = [
  { icon: UserPlus, label: 'Create User', path: '/users/create', permissions: ['users.create.service_type', 'users.create.connection_date', 'users.create.expire_date', 'users.create.monthly_bill'], menuKey: 'menu.users.create_user' },
  { icon: UserCheck, label: 'All Users', path: '/users', permissions: ['users.all.view'], menuKey: 'menu.users.all_users' },
  { icon: ClipboardCheck, label: 'Requests', path: '/users/requests', permissions: ['users.requests.view'], menuKey: 'menu.users.requests' },
  { icon: MapPin, label: 'Area', path: '/users/area', permissions: ['users.area.manage'], menuKey: 'menu.users.area' },
  { icon: Building2, label: 'Police Station', path: '/users/police-station', permissions: ['users.police_station.manage'], menuKey: 'menu.users.police_station' },
  { icon: Map, label: 'District', path: '/users/district', permissions: ['users.district.manage'], menuKey: 'menu.users.district' },
];

const rechargeSubItems = [
  { icon: PieChart, label: 'Billing Statistics', path: '/recharge/statistics', permissions: ['recharge.statistics'], menuKey: 'menu.recharge.statistics' },
  { icon: Wallet, label: 'Customer Recharge', path: '/recharge/customer', permissions: ['recharge.customer'], menuKey: 'menu.recharge.customer' },
  { icon: Ticket, label: 'Manage Recharge', path: '/recharge/manage', permissions: ['recharge.manage'], menuKey: 'menu.recharge.manage' },
  { icon: Clock, label: 'Pending Bill Collection', path: '/recharge/pending', permissions: ['recharge.pending'], menuKey: 'menu.recharge.pending' },
  { icon: CheckCircle, label: 'Approved Bill Collection', path: '/recharge/approved', permissions: ['recharge.approved'], menuKey: 'menu.recharge.approved' },
];

const financeSubItems = [
  { icon: DollarSign, label: 'Overview', path: '/finance/overview', permissions: ['finance.overview'], menuKey: 'menu.finance.overview' },
  { icon: TrendingUp, label: 'Income', path: '/finance/income', permissions: ['finance.income.view'], menuKey: 'menu.finance.income' },
  { icon: TrendingDown, label: 'Expense', path: '/finance/expense', permissions: ['finance.expense.view'], menuKey: 'menu.finance.expense' },
];

const reportSubItems = [
  { icon: BarChart3, label: 'Billing Report', path: '/reports/billing', permissions: ['reports.billing'], menuKey: 'menu.reports.billing' },
  { icon: Wallet, label: 'Connection Fee', path: '/reports/connection-fee', permissions: ['reports.connection'], menuKey: 'menu.reports.connection_fee' },
  { icon: TrendingUp, label: 'Extra Income', path: '/reports/extra-income', permissions: ['reports.income'], menuKey: 'menu.reports.extra_income' },
  { icon: TrendingDown, label: 'Expense', path: '/reports/expense', permissions: ['reports.expense'], menuKey: 'menu.reports.expense' },
  { icon: UserCog, label: 'Employee Salary', path: '/reports/employee-salary', permissions: ['reports.salary'], menuKey: 'menu.reports.employee_salary' },
  { icon: Calendar, label: 'Leave Report', path: '/reports/leave', permissions: ['reports.leave'], menuKey: 'menu.reports.leave' },
  { icon: DollarSign, label: 'Final Report', path: '/reports/final', permissions: ['reports.final'], menuKey: 'menu.reports.final' },
  { icon: Users, label: 'Man Wise Bill Collection', path: '/reports/man-wise-collection', permissions: ['reports.manwise'], menuKey: 'menu.reports.manwise' },
  { icon: UserPlus, label: 'Monthly New Line', path: '/reports/monthly-new-line', permissions: ['reports.newline'], menuKey: 'menu.reports.new_line' },
  { icon: Clock, label: 'Monthly Expire User', path: '/reports/monthly-expire', permissions: ['reports.expire'], menuKey: 'menu.reports.expire' },
  { icon: Building2, label: 'BTRC Report', path: '/reports/btrc', permissions: ['reports.btrc'], menuKey: 'menu.reports.btrc' },
];

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

  // Filter sub-items by both feature permission AND menu visibility permission
  const filterItems = (items: typeof userSubItems) =>
    items.filter(item => hasAnyPermission(item.permissions) && hasPermission(item.menuKey));

  const filteredUserItems = filterItems(userSubItems);
  const filteredRechargeItems = filterItems(rechargeSubItems);
  const filteredFinanceItems = filterItems(financeSubItems);
  const filteredReportItems = filterItems(reportSubItems);

  // Menu-level visibility: parent menu permission + at least one visible sub-item or feature permission
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
        {/* Dashboard */}
        {showDashboard && (
          <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>
            <LayoutDashboard className="w-5 h-5" />
            <span>Dashboard</span>
          </Link>
        )}

        {/* HR Admin */}
        {showHR && (
          <Link to="/hr-admin" className={`nav-link ${location.pathname === '/hr-admin' ? 'active' : ''}`}>
            <UserCog className="w-5 h-5" />
            <span>HR Admin</span>
          </Link>
        )}

        {/* Users with Submenu */}
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

        {/* Recharge with Submenu */}
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

        {/* Finance with Submenu */}
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

        {/* Reports with Submenu */}
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

        {/* Plans */}
        {showPlans && (
          <Link to="/plans" className={`nav-link ${location.pathname === '/plans' ? 'active' : ''}`}>
            <CreditCard className="w-5 h-5" />
            <span>Plans</span>
          </Link>
        )}

        {/* SMS History */}
        {showSMS && (
          <Link to="/sms-history" className={`nav-link ${location.pathname === '/sms-history' ? 'active' : ''}`}>
            <MessageSquare className="w-5 h-5" />
            <span>SMS History</span>
          </Link>
        )}

        {/* Activity */}
        {showActivity && (
          <Link to="/activity" className={`nav-link ${location.pathname === '/activity' ? 'active' : ''}`}>
            <Activity className="w-5 h-5" />
            <span>Activity</span>
          </Link>
        )}

        {/* Settings */}
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
