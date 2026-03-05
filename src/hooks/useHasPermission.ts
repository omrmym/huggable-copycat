import { useCurrentUserRole } from '@/hooks/useCurrentUserRole';

/**
 * Hook to check if the current user has a specific permission.
 * Only super_admin and admin roles bypass permission checks.
 */
export function useHasPermission() {
  const { data: userRole, isLoading } = useCurrentUserRole();

  const hasPermission = (permission: string): boolean => {
    if (userRole?.isSuperAdmin || userRole?.isAdmin) return true;
    return userRole?.permissions?.includes(permission) ?? false;
  };

  const hasAnyPermission = (permissions: string[]): boolean => {
    if (userRole?.isSuperAdmin || userRole?.isAdmin) return true;
    return permissions.some(p => userRole?.permissions?.includes(p) ?? false);
  };

  return { hasPermission, hasAnyPermission, isLoading, userRole };
}

// Map routes to required permissions
export const ROUTE_PERMISSIONS: Record<string, string[]> = {
  '/': ['dashboard.total_users', 'dashboard.active_users', 'dashboard.free_users', 'dashboard.expired_users', 'dashboard.disabled_users', 'dashboard.already_paid', 'dashboard.total_bill', 'dashboard.active_users_bill', 'dashboard.expired_users_bill', 'dashboard.already_paid_bill', 'dashboard.connection_fee', 'dashboard.extra_income', 'dashboard.monthly_bill_collection', 'dashboard.daily_bill_collection', 'dashboard.monthly_paid_users', 'dashboard.day_wise_new_line', 'dashboard.online_offline_status', 'dashboard.recent_users'], // Dashboard accessible if user has any dashboard widget permission
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
