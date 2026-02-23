import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserCog, Users, Plus, Search, Building2, Calendar, Wallet } from 'lucide-react';
import {
  useEmployees,
  useCreateEmployee,
  useUpdateEmployee,
  useDeleteEmployee,
  Employee,
  EmployeeInsert,
} from '@/hooks/useEmployees';
import {
  useDepartments,
  useCreateDepartment,
  useUpdateDepartment,
  useDeleteDepartment,
  Department,
  DepartmentInsert,
} from '@/hooks/useDepartments';
import {
  useLeaveRequests,
  useCreateLeaveRequest,
  useApproveLeaveRequest,
  useRejectLeaveRequest,
  useDeleteLeaveRequest,
  LeaveRequestInsert,
} from '@/hooks/useLeaveRequests';
import {
  useSalaryPayments,
  useCreateSalaryPayment,
  useUpdateSalaryPayment,
  useDeleteSalaryPayment,
  useMarkPaymentPaid,
  SalaryPayment,
  SalaryPaymentInsert,
} from '@/hooks/useSalaryPayments';
import { EmployeeTable } from '@/components/hr/EmployeeTable';
import { EmployeeFormDialog } from '@/components/hr/EmployeeFormDialog';
import { DepartmentTable } from '@/components/hr/DepartmentTable';
import { DepartmentFormDialog } from '@/components/hr/DepartmentFormDialog';
import { LeaveRequestTable } from '@/components/hr/LeaveRequestTable';
import { LeaveRequestFormDialog } from '@/components/hr/LeaveRequestFormDialog';
import { PayrollTable } from '@/components/hr/PayrollTable';
import { PayrollFormDialog } from '@/components/hr/PayrollFormDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function HRAdmin() {
  // Data hooks
  const { data: employees = [], isLoading: employeesLoading } = useEmployees();
  const { data: departments = [], isLoading: departmentsLoading } = useDepartments();
  const { data: leaveRequests = [], isLoading: leaveRequestsLoading } = useLeaveRequests();
  const { data: salaryPayments = [], isLoading: paymentsLoading } = useSalaryPayments();

  // Mutation hooks - Employees
  const createEmployee = useCreateEmployee();
  const updateEmployee = useUpdateEmployee();
  const deleteEmployee = useDeleteEmployee();

  // Mutation hooks - Departments
  const createDepartment = useCreateDepartment();
  const updateDepartment = useUpdateDepartment();
  const deleteDepartment = useDeleteDepartment();

  // Mutation hooks - Leave Requests
  const createLeaveRequest = useCreateLeaveRequest();
  const approveLeaveRequest = useApproveLeaveRequest();
  const rejectLeaveRequest = useRejectLeaveRequest();
  const deleteLeaveRequest = useDeleteLeaveRequest();

  // Mutation hooks - Payroll
  const createSalaryPayment = useCreateSalaryPayment();
  const updateSalaryPayment = useUpdateSalaryPayment();
  const deleteSalaryPayment = useDeleteSalaryPayment();
  const markPaymentPaid = useMarkPaymentPaid();

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('employees');

  // Employee state
  const [isEmployeeFormOpen, setIsEmployeeFormOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [deletingEmployee, setDeletingEmployee] = useState<Employee | null>(null);

  // Department state
  const [isDepartmentFormOpen, setIsDepartmentFormOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [deletingDepartment, setDeletingDepartment] = useState<Department | null>(null);

  // Leave Request state
  const [isLeaveFormOpen, setIsLeaveFormOpen] = useState(false);
  const [deletingLeaveRequest, setDeletingLeaveRequest] = useState<string | null>(null);

  // Payroll state
  const [isPayrollFormOpen, setIsPayrollFormOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<SalaryPayment | null>(null);
  const [deletingPayment, setDeletingPayment] = useState<SalaryPayment | null>(null);

  // Filtered data
  const filteredEmployees = employees.filter(
    (emp) =>
      emp.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.employee_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.department?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredDepartments = departments.filter(
    (dept) =>
      dept.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dept.code?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredLeaveRequests = leaveRequests.filter(
    (req) =>
      req.employee?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.leave_type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPayments = salaryPayments.filter(
    (payment) =>
      payment.employee?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.employee?.employee_id?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Stats
  const activeEmployees = employees.filter((e) => e.status === 'active').length;
  const activeDepartments = departments.filter((d) => d.is_active).length;
  const pendingLeaveRequests = leaveRequests.filter((r) => r.status === 'pending').length;
  const pendingPayments = salaryPayments.filter((p) => p.status === 'pending').length;
  const totalPaidThisMonth = salaryPayments
    .filter((p) => p.status === 'paid')
    .reduce((sum, p) => sum + p.net_salary, 0);

  // Employee handlers
  const handleCreateEmployee = () => {
    setEditingEmployee(null);
    setIsEmployeeFormOpen(true);
  };

  const handleEditEmployee = (employee: Employee) => {
    setEditingEmployee(employee);
    setIsEmployeeFormOpen(true);
  };

  const handleEmployeeSubmit = (data: EmployeeInsert) => {
    if (editingEmployee) {
      updateEmployee.mutate({ id: editingEmployee.id, ...data }, { onSuccess: () => setIsEmployeeFormOpen(false) });
    } else {
      createEmployee.mutate(data, { onSuccess: () => setIsEmployeeFormOpen(false) });
    }
  };

  const confirmDeleteEmployee = () => {
    if (deletingEmployee) {
      deleteEmployee.mutate(deletingEmployee.id, { onSuccess: () => setDeletingEmployee(null) });
    }
  };

  // Department handlers
  const handleCreateDepartment = () => {
    setEditingDepartment(null);
    setIsDepartmentFormOpen(true);
  };

  const handleEditDepartment = (department: Department) => {
    setEditingDepartment(department);
    setIsDepartmentFormOpen(true);
  };

  const handleDepartmentSubmit = (data: DepartmentInsert) => {
    if (editingDepartment) {
      updateDepartment.mutate({ id: editingDepartment.id, ...data }, { onSuccess: () => setIsDepartmentFormOpen(false) });
    } else {
      createDepartment.mutate(data, { onSuccess: () => setIsDepartmentFormOpen(false) });
    }
  };

  const confirmDeleteDepartment = () => {
    if (deletingDepartment) {
      deleteDepartment.mutate(deletingDepartment.id, { onSuccess: () => setDeletingDepartment(null) });
    }
  };

  // Leave Request handlers
  const handleCreateLeaveRequest = () => {
    setIsLeaveFormOpen(true);
  };

  const handleLeaveRequestSubmit = (data: LeaveRequestInsert) => {
    createLeaveRequest.mutate(data, { onSuccess: () => setIsLeaveFormOpen(false) });
  };

  const handleApproveLeave = (id: string) => {
    // For now, we'll use a placeholder approver ID
    approveLeaveRequest.mutate({ id, approved_by: employees[0]?.id || '' });
  };

  const handleRejectLeave = (id: string, reason: string) => {
    rejectLeaveRequest.mutate({ id, rejection_reason: reason });
  };

  const confirmDeleteLeaveRequest = () => {
    if (deletingLeaveRequest) {
      deleteLeaveRequest.mutate(deletingLeaveRequest, { onSuccess: () => setDeletingLeaveRequest(null) });
    }
  };

  // Payroll handlers
  const handleCreatePayment = () => {
    setEditingPayment(null);
    setIsPayrollFormOpen(true);
  };

  const handleEditPayment = (payment: SalaryPayment) => {
    setEditingPayment(payment);
    setIsPayrollFormOpen(true);
  };

  const handlePaymentSubmit = (data: SalaryPaymentInsert) => {
    if (editingPayment) {
      updateSalaryPayment.mutate({ id: editingPayment.id, ...data }, { onSuccess: () => setIsPayrollFormOpen(false) });
    } else {
      createSalaryPayment.mutate(data, { onSuccess: () => setIsPayrollFormOpen(false) });
    }
  };

  const handleMarkPaid = (id: string) => {
    markPaymentPaid.mutate(id);
  };

  const confirmDeletePayment = () => {
    if (deletingPayment) {
      deleteSalaryPayment.mutate(deletingPayment.id, { onSuccess: () => setDeletingPayment(null) });
    }
  };

  return (
    <DashboardLayout title="HR Admin" subtitle="Human Resources Management">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{employees.length}</div>
            <p className="text-xs text-muted-foreground">{activeEmployees} active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Departments</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{departments.length}</div>
            <p className="text-xs text-muted-foreground">{activeDepartments} active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Leave</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingLeaveRequests}</div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Payroll</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingPayments}</div>
            <p className="text-xs text-muted-foreground">Pending payments</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Card>
        <CardHeader>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <TabsList>
                <TabsTrigger value="employees">Employees</TabsTrigger>
                <TabsTrigger value="departments">Departments</TabsTrigger>
                <TabsTrigger value="leave">Leave Requests</TabsTrigger>
                <TabsTrigger value="payroll">Payroll</TabsTrigger>
              </TabsList>
              <div className="flex gap-2">
                {activeTab === 'employees' && (
                  <Button onClick={handleCreateEmployee}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Employee
                  </Button>
                )}
                {activeTab === 'departments' && (
                  <Button onClick={handleCreateDepartment}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Department
                  </Button>
                )}
                {activeTab === 'leave' && (
                  <Button onClick={handleCreateLeaveRequest}>
                    <Plus className="h-4 w-4 mr-2" />
                    New Request
                  </Button>
                )}
                {activeTab === 'payroll' && (
                  <Button onClick={handleCreatePayment}>
                    <Plus className="h-4 w-4 mr-2" />
                    New Payment
                  </Button>
                )}
              </div>
            </div>
          </Tabs>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 max-w-sm"
              />
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsContent value="employees" className="mt-0">
              <EmployeeTable
                employees={filteredEmployees}
                isLoading={employeesLoading}
                onEdit={handleEditEmployee}
                onDelete={setDeletingEmployee}
              />
            </TabsContent>

            <TabsContent value="departments" className="mt-0">
              <DepartmentTable
                departments={filteredDepartments}
                isLoading={departmentsLoading}
                onEdit={handleEditDepartment}
                onDelete={setDeletingDepartment}
              />
            </TabsContent>

            <TabsContent value="leave" className="mt-0">
              <LeaveRequestTable
                requests={filteredLeaveRequests}
                isLoading={leaveRequestsLoading}
                onApprove={handleApproveLeave}
                onReject={handleRejectLeave}
                onDelete={setDeletingLeaveRequest}
              />
            </TabsContent>

            <TabsContent value="payroll" className="mt-0">
              <PayrollTable
                payments={filteredPayments}
                isLoading={paymentsLoading}
                onEdit={handleEditPayment}
                onDelete={setDeletingPayment}
                onMarkPaid={handleMarkPaid}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <EmployeeFormDialog
        open={isEmployeeFormOpen}
        onOpenChange={setIsEmployeeFormOpen}
        employee={editingEmployee}
        onSubmit={handleEmployeeSubmit}
        isLoading={createEmployee.isPending || updateEmployee.isPending}
      />

      <DepartmentFormDialog
        open={isDepartmentFormOpen}
        onOpenChange={setIsDepartmentFormOpen}
        department={editingDepartment}
        employees={employees}
        onSubmit={handleDepartmentSubmit}
        isLoading={createDepartment.isPending || updateDepartment.isPending}
      />

      <LeaveRequestFormDialog
        open={isLeaveFormOpen}
        onOpenChange={setIsLeaveFormOpen}
        employees={employees}
        onSubmit={handleLeaveRequestSubmit}
        isLoading={createLeaveRequest.isPending}
      />

      <PayrollFormDialog
        open={isPayrollFormOpen}
        onOpenChange={setIsPayrollFormOpen}
        payment={editingPayment}
        employees={employees}
        onSubmit={handlePaymentSubmit}
        isLoading={createSalaryPayment.isPending || updateSalaryPayment.isPending}
      />

      {/* Delete Confirmations */}
      <AlertDialog open={!!deletingEmployee} onOpenChange={() => setDeletingEmployee(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Employee</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {deletingEmployee?.full_name}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteEmployee} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deletingDepartment} onOpenChange={() => setDeletingDepartment(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Department</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {deletingDepartment?.name}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteDepartment} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deletingLeaveRequest} onOpenChange={() => setDeletingLeaveRequest(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Leave Request</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this leave request? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteLeaveRequest} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deletingPayment} onOpenChange={() => setDeletingPayment(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Salary Payment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this salary payment for {deletingPayment?.employee?.full_name}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeletePayment} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
