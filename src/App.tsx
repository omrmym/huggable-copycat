// Radius Bill Manager
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { CustomerAuthProvider } from "@/contexts/CustomerAuthContext";
import { ResellerAuthProvider } from "@/contexts/ResellerAuthContext";
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
import ResellerLogin from "./pages/reseller/ResellerLogin";
import ResellerDashboard from "./pages/reseller/ResellerDashboard";
import ResellerUsersPage from "./pages/reseller/ResellerUsersPage";
import ResellerCreateUserPage from "./pages/reseller/ResellerCreateUserPage";
import ResellerUserProfilePage from "./pages/reseller/ResellerUserProfilePage";
import ResellerCreditsPage from "./pages/reseller/ResellerCreditsPage";
import ResellerBranchesPage from "./pages/reseller/ResellerBranchesPage";
import ResellerRechargesPage from "./pages/reseller/ResellerRechargesPage";
import ResellerAreaPage from "./pages/reseller/ResellerAreaPage";
import ResellerPoliceStationPage from "./pages/reseller/ResellerPoliceStationPage";
import ResellerDistrictPage from "./pages/reseller/ResellerDistrictPage";
import ResellerBillingStatistics from "./pages/reseller/recharge/ResellerBillingStatistics";
import ResellerCustomerRecharge from "./pages/reseller/recharge/ResellerCustomerRecharge";
import ResellerManageRecharge from "./pages/reseller/recharge/ResellerManageRecharge";
import ResellerPendingBillCollection from "./pages/reseller/recharge/ResellerPendingBillCollection";
import ResellerApprovedBillCollection from "./pages/reseller/recharge/ResellerApprovedBillCollection";
import ResellerBillingReport from "./pages/reseller/reports/ResellerBillingReport";
import ResellerConnectionFeeReport from "./pages/reseller/reports/ResellerConnectionFeeReport";
import ResellerManWiseCollectionReport from "./pages/reseller/reports/ResellerManWiseCollectionReport";
import ResellerMonthlyNewLineReport from "./pages/reseller/reports/ResellerMonthlyNewLineReport";
import ResellerOnlineOfflineUsers from "./pages/reseller/ResellerOnlineOfflineUsers";

import PaymentCallback from "./pages/PaymentCallback";
import HRAdmin from "./pages/HRAdmin";
import FinanceOverview from "./pages/finance/FinanceOverview";
import Income from "./pages/finance/Income";
import Expense from "./pages/finance/Expense";
import Resellers from "./pages/management/Resellers";
import Branches from "./pages/management/Branches";
import ResellerUsers from "./pages/management/ResellerUsers";
import ResellerPlans from "./pages/management/ResellerPlans";
import CreditRecharge from "./pages/management/CreditRecharge";
import UserRechargeList from "./pages/management/UserRechargeList";
import BillingReport from "./pages/reports/BillingReport";
import ConnectionFeeReport from "./pages/reports/ConnectionFeeReport";
import ExtraIncomeReport from "./pages/reports/ExtraIncomeReport";
import ExpenseReport from "./pages/reports/ExpenseReport";
import ResellerCreditReport from "./pages/reports/ResellerCreditReport";
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
              <ResellerAuthProvider>
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route path="/portal" element={<CustomerDashboard />} />
                  <Route path="/portal/login" element={<CustomerLogin />} />
                  <Route path="/portal/u/:userId" element={<CustomerAutoLogin />} />
                  <Route path="/reseller" element={<ResellerDashboard />} />
                  <Route path="/reseller/login" element={<ResellerLogin />} />
                  <Route path="/reseller/users" element={<ResellerUsersPage />} />
                  <Route path="/reseller/users/create" element={<ResellerCreateUserPage />} />
                  <Route path="/reseller/users/:userId" element={<ResellerUserProfilePage />} />
                  <Route path="/reseller/users/area" element={<ResellerAreaPage />} />
                  <Route path="/reseller/users/police-station" element={<ResellerPoliceStationPage />} />
                  <Route path="/reseller/users/district" element={<ResellerDistrictPage />} />
                  <Route path="/reseller/credits" element={<ResellerCreditsPage />} />
                  <Route path="/reseller/branches" element={<ResellerBranchesPage />} />
                  <Route path="/reseller/recharges" element={<ResellerRechargesPage />} />
                  <Route path="/reseller/recharge/statistics" element={<ResellerBillingStatistics />} />
                  <Route path="/reseller/recharge/customer" element={<ResellerCustomerRecharge />} />
                  <Route path="/reseller/recharge/manage" element={<ResellerManageRecharge />} />
                  <Route path="/reseller/recharge/pending" element={<ResellerPendingBillCollection />} />
                  <Route path="/reseller/recharge/approved" element={<ResellerApprovedBillCollection />} />
                  <Route path="/reseller/reports/billing" element={<ResellerBillingReport />} />
                  <Route path="/reseller/reports/connection-fee" element={<ResellerConnectionFeeReport />} />
                  <Route path="/reseller/reports/man-wise-collection" element={<ResellerManWiseCollectionReport />} />
                  <Route path="/reseller/reports/monthly-new-line" element={<ResellerMonthlyNewLineReport />} />
                  <Route path="/reseller/users/online-offline" element={<ResellerOnlineOfflineUsers />} />
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
              path="/reports/reseller-credit"
              element={
                <ProtectedRoute>
                  <ResellerCreditReport />
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
              path="/management/resellers"
              element={
                <ProtectedRoute>
                  <Resellers />
                </ProtectedRoute>
              }
            />
            <Route
              path="/management/branches"
              element={
                <ProtectedRoute>
                  <Branches />
                </ProtectedRoute>
              }
            />
            <Route
              path="/management/reseller-users"
              element={
                <ProtectedRoute>
                  <ResellerUsers />
                </ProtectedRoute>
              }
            />
            <Route
              path="/management/reseller-plans"
              element={
                <ProtectedRoute>
                  <ResellerPlans />
                </ProtectedRoute>
              }
            />
            <Route
              path="/management/credit-recharge"
              element={
                <ProtectedRoute>
                  <CreditRecharge />
                </ProtectedRoute>
              }
            />
            <Route
              path="/management/user-recharges"
              element={
                <ProtectedRoute>
                  <UserRechargeList />
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
              </ResellerAuthProvider>
            </CustomerAuthProvider>
          </SessionTimeoutProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
