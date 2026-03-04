import { useCurrentUserRole } from '@/hooks/useCurrentUserRole';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Hook to check if the current user has a specific permission.
 * Super admins and admins (from admin_users table) bypass permission checks.
 */
export function useHasPermission() {
  const { isAdmin } = useAuth();
  const { data: userRole, isLoading } = useCurrentUserRole();

  const hasPermission = (permission: string): boolean => {
    // Admin users (from admin_users table) have full access
    if (isAdmin) return true;
    // Super admin and admin roles have full access
    if (userRole?.isSuperAdmin || userRole?.isAdmin) return true;
    // Check specific permission
    return userRole?.permissions?.includes(permission) ?? false;
  };

  const hasAnyPermission = (permissions: string[]): boolean => {
    if (isAdmin) return true;
    if (userRole?.isSuperAdmin || userRole?.isAdmin) return true;
    return permissions.some(p => userRole?.permissions?.includes(p) ?? false);
  };

  return { hasPermission, hasAnyPermission, isLoading, userRole };
}

// Map routes to required permissions
export const ROUTE_PERMISSIONS: Record<string, string[]> = {
  '/': ['dashboard.total_users'], // Dashboard - at least one dashboard permission
  '/hr-admin': ['hr.employees.view', 'hr.departments.view', 'hr.leave.view', 'hr.payroll.view'],
  '/users': ['users.all.view'],
  '/users/create': ['users.create.service_type'],
  '/users/area': ['users.area.manage'],
  '/users/police-station': ['users.police_station.manage'],
  '/users/district': ['users.district.manage'],
  '/users/requests': ['users.requests.view'],
  '/users/online-offline': ['users.online_offline.view'],
  '/recharge/statistics': ['recharge.statistics'],
  '/recharge/customer': ['recharge.customer'],
  '/recharge/manage': ['recharge.manage'],
  '/recharge/pending': ['recharge.pending'],
  '/recharge/approved': ['recharge.approved'],
  '/plans': ['plans.view'],
  '/finance/overview': ['finance.overview'],
  '/finance/income': ['finance.income.view'],
  '/finance/expense': ['finance.expense.view'],
  '/reports/billing': ['reports.billing'],
  '/reports/connection-fee': ['reports.connection'],
  '/reports/extra-income': ['reports.income'],
  '/reports/expense': ['reports.expense'],
  '/reports/employee-salary': ['reports.salary'],
  '/reports/leave': ['reports.leave'],
  '/reports/final': ['reports.final'],
  '/reports/man-wise-collection': ['reports.manwise'],
  '/reports/monthly-new-line': ['reports.newline'],
  '/reports/monthly-expire': ['reports.expire'],
  '/reports/btrc': ['reports.btrc'],
  '/sms-history': ['sms.history'],
  '/activity': ['activity.system', 'activity.login', 'activity.user'],
  '/settings': ['settings.users', 'settings.roles', 'settings.branding', 'settings.mikrotik'],
};
