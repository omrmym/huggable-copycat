import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  FileText, 
  Settings, 
  UserCheck, 
  DollarSign, 
  BarChart3,
  Ticket
} from 'lucide-react';

// Define all available permissions with hierarchical structure
export const PERMISSION_DEFINITIONS = {
  dashboard: {
    label: 'Dashboard',
    icon: LayoutDashboard,
    subcategories: {
      user_statistics: {
        label: 'User Statistics',
        permissions: [
          { key: 'dashboard.total_users', label: 'Total Users' },
          { key: 'dashboard.active_users', label: 'Active Users' },
          { key: 'dashboard.free_users', label: 'Free Users' },
          { key: 'dashboard.expired_users', label: 'Expired Users' },
          { key: 'dashboard.disabled_users', label: 'Disabled Users' },
          { key: 'dashboard.already_paid', label: 'Already Paid' },
        ],
      },
      billing_statistics: {
        label: 'Billing Statistics',
        permissions: [
          { key: 'dashboard.total_bill', label: 'Total Bill' },
          { key: 'dashboard.active_users_bill', label: 'Active Users Bill' },
          { key: 'dashboard.expired_users_bill', label: 'Expired Users Bill' },
          { key: 'dashboard.already_paid_bill', label: 'Already Paid Bill' },
          { key: 'dashboard.connection_fee', label: 'Connection Fee' },
          { key: 'dashboard.extra_income', label: 'Extra Income' },
        ],
      },
    },
    permissions: [
      { key: 'dashboard.monthly_bill_collection', label: 'Monthly Bill Collection' },
      { key: 'dashboard.daily_bill_collection', label: 'Daily Bill Collection' },
      { key: 'dashboard.monthly_paid_users', label: 'Monthly Paid Users' },
      { key: 'dashboard.day_wise_new_line', label: 'Day Wise New Line' },
      { key: 'dashboard.online_offline_status', label: 'Online / Offline Status' },
      { key: 'dashboard.recent_users', label: 'Recent Users' },
    ],
  },
  hr: {
    label: 'HR Administration',
    icon: UserCheck,
    subcategories: {
      employees: {
        label: 'Employee',
        permissions: [
          { key: 'hr.employees.view', label: 'View' },
          { key: 'hr.employees.add', label: 'Add Employee' },
          { key: 'hr.employees.edit', label: 'Edit' },
          { key: 'hr.employees.delete', label: 'Delete' },
        ],
      },
      departments: {
        label: 'Department',
        permissions: [
          { key: 'hr.departments.view', label: 'View' },
          { key: 'hr.departments.add', label: 'Add Department' },
          { key: 'hr.departments.edit', label: 'Edit' },
          { key: 'hr.departments.delete', label: 'Delete' },
        ],
      },
      leave_requests: {
        label: 'Leave Request',
        permissions: [
          { key: 'hr.leave.view', label: 'View' },
          { key: 'hr.leave.add', label: 'Add Request' },
          { key: 'hr.leave.approve', label: 'Approve' },
          { key: 'hr.leave.reject', label: 'Reject' },
          { key: 'hr.leave.delete', label: 'Delete' },
        ],
      },
      payroll: {
        label: 'Payroll',
        permissions: [
          { key: 'hr.payroll.view', label: 'View' },
          { key: 'hr.payroll.add', label: 'Add Payment' },
          { key: 'hr.payroll.mark_paid', label: 'Mark as Paid' },
          { key: 'hr.payroll.edit', label: 'Edit' },
          { key: 'hr.payroll.delete', label: 'Delete' },
        ],
      },
    },
    permissions: [],
  },
  users: {
    label: 'User Management',
    icon: Users,
    subcategories: {
      create_user: {
        label: 'Create User',
        permissions: [
          { key: 'users.create.service_type', label: 'Service Type' },
          { key: 'users.create.connection_date', label: 'Connection Date' },
          { key: 'users.create.billing_cycle', label: 'Billing Cycle' },
          { key: 'users.create.expire_date', label: 'Expire Date' },
          { key: 'users.create.monthly_bill', label: 'Monthly Bill' },
        ],
      },
      all_user: {
        label: 'All User',
        permissions: [
          { key: 'users.all.view', label: 'View' },
          { key: 'users.all.change_status', label: 'Change Status' },
          { key: 'users.all.change_expire', label: 'Change Expire' },
          { key: 'users.all.edit', label: 'Edit User' },
        ],
      },
      user_profile: {
        label: 'User Profile',
        permissions: [
          { key: 'users.profile.view', label: 'View' },
          { key: 'users.profile.quick_recharge', label: 'Quick Recharge' },
          { key: 'users.profile.change_password', label: 'Change Password' },
          { key: 'users.profile.change_plan', label: 'Change Plan' },
          { key: 'users.profile.edit', label: 'Edit User' },
        ],
      },
      edit_user: {
        label: 'Edit User',
        permissions: [
          { key: 'users.edit.personal', label: 'Personal' },
          { key: 'users.edit.address', label: 'Address' },
          { key: 'users.edit.connection', label: 'Connection' },
      { key: 'users.edit.billing', label: 'Billing' },
        ],
      },
      auto_renew: {
        label: 'Auto Renew',
        permissions: [
          { key: 'users.auto_renew.toggle', label: 'Toggle Auto Renew' },
        ],
      },
    },
    permissions: [],
  },
  plans: {
    label: 'Billing Plans',
    icon: CreditCard,
    permissions: [
      { key: 'plans.view', label: 'View Plans' },
      { key: 'plans.create', label: 'Create Plans' },
      { key: 'plans.edit', label: 'Edit Plans' },
      { key: 'plans.delete', label: 'Delete Plans' },
    ],
  },
  vouchers: {
    label: 'Vouchers',
    icon: Ticket,
    permissions: [
      { key: 'vouchers.view', label: 'View Vouchers' },
      { key: 'vouchers.create', label: 'Create Vouchers' },
      { key: 'vouchers.delete', label: 'Delete Vouchers' },
    ],
  },
  recharge: {
    label: 'Recharge & Billing',
    icon: DollarSign,
    permissions: [
      { key: 'recharge.customer', label: 'Customer Recharge' },
      { key: 'recharge.manage', label: 'Manage Recharge' },
      { key: 'recharge.pending', label: 'View Pending Bills' },
      { key: 'recharge.approved', label: 'View Approved Bills' },
      { key: 'recharge.statistics', label: 'View Billing Statistics' },
    ],
  },
  finance: {
    label: 'Finance',
    icon: BarChart3,
    subcategories: {
      income: {
        label: 'Income',
        permissions: [
          { key: 'finance.income.view', label: 'View' },
          { key: 'finance.income.add', label: 'Add Income' },
          { key: 'finance.income.edit', label: 'Edit' },
          { key: 'finance.income.delete', label: 'Delete' },
        ],
      },
      expense: {
        label: 'Expense',
        permissions: [
          { key: 'finance.expense.view', label: 'View' },
          { key: 'finance.expense.add', label: 'Add Expense' },
          { key: 'finance.expense.edit', label: 'Edit' },
          { key: 'finance.expense.delete', label: 'Delete' },
        ],
      },
    },
    permissions: [
      { key: 'finance.overview', label: 'View Overview' },
    ],
  },
  reports: {
    label: 'Reports',
    icon: FileText,
    subcategories: {
      billing: {
        label: 'Billing Reports',
        permissions: [
          { key: 'reports.billing', label: 'Billing Report' },
          { key: 'reports.connection', label: 'Connection Fee Report' },
          { key: 'reports.newline', label: 'Monthly New Line Report' },
          { key: 'reports.expire', label: 'Monthly Expire Report' },
          { key: 'reports.manwise', label: 'Man-Wise Collection Report' },
        ],
      },
      financial: {
        label: 'Financial Reports',
        permissions: [
          { key: 'reports.expense', label: 'Expense Report' },
          { key: 'reports.income', label: 'Extra Income Report' },
          { key: 'reports.final', label: 'Final Report' },
        ],
      },
      hr: {
        label: 'HR Reports',
        permissions: [
          { key: 'reports.salary', label: 'Employee Salary Report' },
          { key: 'reports.leave', label: 'Leave Report' },
        ],
      },
      regulatory: {
        label: 'Regulatory Reports',
        permissions: [
          { key: 'reports.btrc', label: 'BTRC Report' },
        ],
      },
    },
    permissions: [],
  },
  settings: {
    label: 'Settings',
    icon: Settings,
    permissions: [
      { key: 'settings.users', label: 'Manage Software Users' },
      { key: 'settings.roles', label: 'Manage Roles' },
      { key: 'settings.mikrotik', label: 'Manage MikroTik Routers' },
      { key: 'settings.categories', label: 'Manage Categories' },
      { key: 'settings.payment', label: 'Manage Payment Methods' },
      { key: 'settings.session', label: 'Session Timeout Settings' },
      { key: 'settings.activity', label: 'View Activity Logs' },
    ],
  },
};

// Helper to get all permissions from a category (including subcategories)
function getAllCategoryPermissions(category: typeof PERMISSION_DEFINITIONS[keyof typeof PERMISSION_DEFINITIONS]): string[] {
  const permissions: string[] = [];
  
  if (category.permissions) {
    permissions.push(...category.permissions.map(p => p.key));
  }
  
  if ('subcategories' in category && category.subcategories) {
    Object.values(category.subcategories).forEach(sub => {
      permissions.push(...sub.permissions.map(p => p.key));
    });
  }
  
  return permissions;
}

// Flatten all permissions for easy access
export const ALL_PERMISSIONS = Object.values(PERMISSION_DEFINITIONS).flatMap(
  (category) => getAllCategoryPermissions(category)
);

interface PermissionsEditorProps {
  selectedPermissions: string[];
  onChange: (permissions: string[]) => void;
  disabled?: boolean;
}

export function PermissionsEditor({
  selectedPermissions,
  onChange,
  disabled = false,
}: PermissionsEditorProps) {
  const handleToggle = (permissionKey: string) => {
    if (selectedPermissions.includes(permissionKey)) {
      onChange(selectedPermissions.filter((p) => p !== permissionKey));
    } else {
      onChange([...selectedPermissions, permissionKey]);
    }
  };

  const handleToggleCategory = (categoryKey: string) => {
    const category = PERMISSION_DEFINITIONS[categoryKey as keyof typeof PERMISSION_DEFINITIONS];
    const categoryPermissions = getAllCategoryPermissions(category);
    const allSelected = categoryPermissions.every((p) => selectedPermissions.includes(p));

    if (allSelected) {
      onChange(selectedPermissions.filter((p) => !categoryPermissions.includes(p)));
    } else {
      const newPermissions = [...selectedPermissions];
      categoryPermissions.forEach((p) => {
        if (!newPermissions.includes(p)) {
          newPermissions.push(p);
        }
      });
      onChange(newPermissions);
    }
  };

  const handleToggleSubcategory = (subcategoryPermissions: string[]) => {
    const allSelected = subcategoryPermissions.every((p) => selectedPermissions.includes(p));

    if (allSelected) {
      onChange(selectedPermissions.filter((p) => !subcategoryPermissions.includes(p)));
    } else {
      const newPermissions = [...selectedPermissions];
      subcategoryPermissions.forEach((p) => {
        if (!newPermissions.includes(p)) {
          newPermissions.push(p);
        }
      });
      onChange(newPermissions);
    }
  };

  const handleSelectAll = () => {
    if (selectedPermissions.length === ALL_PERMISSIONS.length) {
      onChange([]);
    } else {
      onChange([...ALL_PERMISSIONS]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-border">
        <div>
          <h3 className="text-lg font-semibold">Permissions</h3>
          <p className="text-sm text-muted-foreground">
            {selectedPermissions.length} of {ALL_PERMISSIONS.length} permissions selected
          </p>
        </div>
        <button
          type="button"
          onClick={handleSelectAll}
          disabled={disabled}
          className="px-4 py-2 text-sm font-medium rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors disabled:opacity-50"
        >
          {selectedPermissions.length === ALL_PERMISSIONS.length ? 'Deselect All' : 'Select All'}
        </button>
      </div>

      {/* Permission Categories Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {Object.entries(PERMISSION_DEFINITIONS).map(([categoryKey, category]) => {
          const categoryPermissions = getAllCategoryPermissions(category);
          const selectedCount = categoryPermissions.filter((p) =>
            selectedPermissions.includes(p)
          ).length;
          const allSelected = selectedCount === categoryPermissions.length;
          const someSelected = selectedCount > 0 && !allSelected;
          const IconComponent = category.icon;

          return (
            <div
              key={categoryKey}
              className={cn(
                "rounded-xl border bg-card p-5 transition-all",
                allSelected ? "border-primary/50 bg-primary/5" : "border-border",
                someSelected && "border-primary/30"
              )}
            >
              {/* Category Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Checkbox
                    id={`category-${categoryKey}`}
                    checked={allSelected}
                    data-state={someSelected ? 'indeterminate' : allSelected ? 'checked' : 'unchecked'}
                    onCheckedChange={() => handleToggleCategory(categoryKey)}
                    disabled={disabled}
                    className={cn("h-5 w-5", someSelected && "opacity-70")}
                  />
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "p-2 rounded-lg",
                      allSelected ? "bg-primary/20" : "bg-muted"
                    )}>
                      <IconComponent className={cn(
                        "h-4 w-4",
                        allSelected ? "text-primary" : "text-muted-foreground"
                      )} />
                    </div>
                    <Label
                      htmlFor={`category-${categoryKey}`}
                      className="text-base font-semibold cursor-pointer"
                    >
                      {category.label}
                    </Label>
                  </div>
                </div>
                <Badge variant={allSelected ? "default" : "secondary"} className="text-xs">
                  {selectedCount}/{categoryPermissions.length}
                </Badge>
              </div>

              {/* Subcategories */}
              {'subcategories' in category && category.subcategories && (
                <div className="space-y-4 mb-4">
                  {Object.entries(category.subcategories).map(([subKey, subcategory]) => {
                    const subPermissions = subcategory.permissions.map(p => p.key);
                    const subSelectedCount = subPermissions.filter(p => selectedPermissions.includes(p)).length;
                    const subAllSelected = subSelectedCount === subPermissions.length;
                    const subSomeSelected = subSelectedCount > 0 && !subAllSelected;

                    return (
                      <div key={subKey} className="rounded-lg bg-muted/50 p-4">
                        {/* Subcategory Header */}
                        <div className="flex items-center gap-2 mb-3">
                          <Checkbox
                            id={`sub-${categoryKey}-${subKey}`}
                            checked={subAllSelected}
                            data-state={subSomeSelected ? 'indeterminate' : subAllSelected ? 'checked' : 'unchecked'}
                            onCheckedChange={() => handleToggleSubcategory(subPermissions)}
                            disabled={disabled}
                            className={cn("h-4 w-4", subSomeSelected && "opacity-70")}
                          />
                          <Label
                            htmlFor={`sub-${categoryKey}-${subKey}`}
                            className="text-sm font-medium cursor-pointer"
                          >
                            {subcategory.label}
                          </Label>
                          <span className="text-xs text-muted-foreground ml-auto">
                            {subSelectedCount}/{subPermissions.length}
                          </span>
                        </div>

                        {/* Subcategory Permissions */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {subcategory.permissions.map((permission) => (
                            <div
                              key={permission.key}
                              className={cn(
                                "flex items-center gap-2 p-2 rounded-md transition-colors",
                                selectedPermissions.includes(permission.key)
                                  ? "bg-primary/10"
                                  : "hover:bg-muted"
                              )}
                            >
                              <Checkbox
                                id={permission.key}
                                checked={selectedPermissions.includes(permission.key)}
                                onCheckedChange={() => handleToggle(permission.key)}
                                disabled={disabled}
                                className="h-4 w-4"
                              />
                              <Label
                                htmlFor={permission.key}
                                className="text-sm cursor-pointer text-muted-foreground hover:text-foreground truncate"
                              >
                                {permission.label}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Direct Permissions */}
              {category.permissions && category.permissions.length > 0 && (
                <div className={cn(
                  "grid grid-cols-2 gap-2",
                  'subcategories' in category && category.subcategories && Object.keys(category.subcategories).length > 0 && "pt-3 border-t border-border"
                )}>
                  {category.permissions.map((permission) => (
                    <div
                      key={permission.key}
                      className={cn(
                        "flex items-center gap-2 p-2 rounded-md transition-colors",
                        selectedPermissions.includes(permission.key)
                          ? "bg-primary/10"
                          : "hover:bg-muted"
                      )}
                    >
                      <Checkbox
                        id={permission.key}
                        checked={selectedPermissions.includes(permission.key)}
                        onCheckedChange={() => handleToggle(permission.key)}
                        disabled={disabled}
                        className="h-4 w-4"
                      />
                      <Label
                        htmlFor={permission.key}
                        className="text-sm cursor-pointer text-muted-foreground hover:text-foreground truncate"
                      >
                        {permission.label}
                      </Label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
