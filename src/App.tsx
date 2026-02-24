// Radius Bill Manager v2
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { CustomerAuthProvider } from "@/contexts/CustomerAuthContext";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { SessionTimeoutProvider } from "@/components/auth/SessionTimeoutProvider";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Users from "./pages/Users";
import CreateUser from "./pages/users/CreateUser";
import UserProfile from "./pages/users/UserProfile";
import Area from "./pages/users/Area";
import PoliceStation from "./pages/users/PoliceStation";
import District from "./pages/users/District";
import OnlineOfflineUsers from "./pages/OnlineOfflineUsers";
import CustomerRecharge from "./pages/recharge/CustomerRecharge";
import ManageRecharge from "./pages/recharge/ManageRecharge";
import ApprovedBillCollection from "./pages/recharge/ApprovedBillCollection";
import PendingBillCollection from "./pages/recharge/PendingBillCollection";
import BillingStatistics from "./pages/recharge/BillingStatistics";
import Plans from "./pages/Plans";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import CustomerLogin from "./pages/portal/CustomerLogin";
import CustomerAutoLogin from "./pages/portal/CustomerAutoLogin";
import CustomerDashboard from "./pages/portal/CustomerDashboard";



import PaymentCallback from "./pages/PaymentCallback";
import HRAdmin from "./pages/HRAdmin";
import FinanceOverview from "./pages/finance/FinanceOverview";
import Income from "./pages/finance/Income";
import Expense from "./pages/finance/Expense";


import BillingReport from "./pages/reports/BillingReport";
import ConnectionFeeReport from "./pages/reports/ConnectionFeeReport";
import ExtraIncomeReport from "./pages/reports/ExtraIncomeReport";
import ExpenseReport from "./pages/reports/ExpenseReport";

import EmployeeSalaryReport from "./pages/reports/EmployeeSalaryReport";
import LeaveReport from "./pages/reports/LeaveReport";
import FinalReport from "./pages/reports/FinalReport";
import ManWiseCollectionReport from "./pages/reports/ManWiseCollectionReport";
import MonthlyNewLineReport from "./pages/reports/MonthlyNewLineReport";
import MonthlyExpireReport from "./pages/reports/MonthlyExpireReport";
import BTRCReport from "./pages/reports/BTRCReport";
import Activity from "./pages/Activity";
import RoleEdit from "./pages/settings/RoleEdit";
import DeviceList from "./pages/device-inventory/DeviceList";
import PendingApproval from "./pages/device-inventory/PendingApproval";
import DeviceReport from "./pages/reports/DeviceReport";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <SessionTimeoutProvider>
            <CustomerAuthProvider>
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route path="/portal" element={<CustomerDashboard />} />
                  <Route path="/portal/login" element={<CustomerLogin />} />
                  <Route path="/portal/u/:userId" element={<CustomerAutoLogin />} />
              <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Index />
                </ProtectedRoute>
              }
            />
            <Route
              path="/hr-admin"
              element={
                <ProtectedRoute>
                  <HRAdmin />
                </ProtectedRoute>
              }
            />
            <Route
              path="/users"
              element={
                <ProtectedRoute>
                  <Users />
                </ProtectedRoute>
              }
            />
            <Route
              path="/users/create"
              element={
                <ProtectedRoute>
                  <CreateUser />
                </ProtectedRoute>
              }
            />
            <Route
              path="/users/:userId"
              element={
                <ProtectedRoute>
                  <UserProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/users/area"
              element={
                <ProtectedRoute>
                  <Area />
                </ProtectedRoute>
              }
            />
            <Route
              path="/users/police-station"
              element={
                <ProtectedRoute>
                  <PoliceStation />
                </ProtectedRoute>
              }
            />
            <Route
              path="/users/district"
              element={
                <ProtectedRoute>
                  <District />
                </ProtectedRoute>
              }
            />
            <Route
              path="/users/online-offline"
              element={
                <ProtectedRoute>
                  <OnlineOfflineUsers />
                </ProtectedRoute>
              }
            />
            <Route
              path="/recharge/statistics"
              element={
                <ProtectedRoute>
                  <BillingStatistics />
                </ProtectedRoute>
              }
            />
            <Route
              path="/recharge/customer"
              element={
                <ProtectedRoute>
                  <CustomerRecharge />
                </ProtectedRoute>
              }
            />
            <Route
              path="/recharge/manage"
              element={
                <ProtectedRoute>
                  <ManageRecharge />
                </ProtectedRoute>
              }
            />
            <Route
              path="/recharge/approved"
              element={
                <ProtectedRoute>
                  <ApprovedBillCollection />
                </ProtectedRoute>
              }
            />
            <Route
              path="/recharge/pending"
              element={
                <ProtectedRoute>
                  <PendingBillCollection />
                </ProtectedRoute>
              }
            />
            <Route
              path="/plans"
              element={
                <ProtectedRoute>
                  <Plans />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports"
              element={
                <ProtectedRoute>
                  <Reports />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports/billing"
              element={
                <ProtectedRoute>
                  <BillingReport />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports/connection-fee"
              element={
                <ProtectedRoute>
                  <ConnectionFeeReport />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports/extra-income"
              element={
                <ProtectedRoute>
                  <ExtraIncomeReport />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports/expense"
              element={
                <ProtectedRoute>
                  <ExpenseReport />
                </ProtectedRoute>
              }
            />


            <Route
              path="/reports/employee-salary"
              element={
                <ProtectedRoute>
                  <EmployeeSalaryReport />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports/leave"
              element={
                <ProtectedRoute>
                  <LeaveReport />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports/final"
              element={
                <ProtectedRoute>
                  <FinalReport />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports/man-wise-collection"
              element={
                <ProtectedRoute>
                  <ManWiseCollectionReport />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports/monthly-new-line"
              element={
                <ProtectedRoute>
                  <MonthlyNewLineReport />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports/monthly-expire"
              element={
                <ProtectedRoute>
                  <MonthlyExpireReport />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports/btrc"
              element={
                <ProtectedRoute>
                  <BTRCReport />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings/roles/:roleId"
              element={
                <ProtectedRoute>
                  <RoleEdit />
                </ProtectedRoute>
              }
            />
            <Route
              path="/activity"
              element={
                <ProtectedRoute>
                  <Activity />
                </ProtectedRoute>
              }
            />
            <Route path="/payment/callback" element={<PaymentCallback />} />
            <Route
              path="/finance/overview"
              element={
                <ProtectedRoute>
                  <FinanceOverview />
                </ProtectedRoute>
              }
            />
            <Route
              path="/finance/income"
              element={
                <ProtectedRoute>
                  <Income />
                </ProtectedRoute>
              }
            />
            <Route
              path="/finance/expense"
              element={
                <ProtectedRoute>
                  <Expense />
                </ProtectedRoute>
              }
            />


            <Route
              path="/device-inventory/list"
              element={
                <ProtectedRoute>
                  <DeviceList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/device-inventory/pending"
              element={
                <ProtectedRoute>
                  <PendingApproval />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports/device"
              element={
                <ProtectedRoute>
                  <DeviceReport />
                </ProtectedRoute>
              }
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
              
            </CustomerAuthProvider>
          </SessionTimeoutProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
