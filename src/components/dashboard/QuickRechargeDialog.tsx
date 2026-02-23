import { useState, useMemo } from 'react';
import { useRadiusUsers, useUpdateRadiusUser } from '@/hooks/useRadiusUsers';
import { useBillingPlans } from '@/hooks/useBillingPlans';
import { useCreateTransaction } from '@/hooks/useTransactions';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, User, Wallet, Key, Package } from 'lucide-react';
import { RechargeDialog } from '@/components/recharge/RechargeDialog';
import { toast } from 'sonner';
import { calculateProratedPrice } from '@/lib/proratedPricing';
import type { Tables } from '@/integrations/supabase/types';

type RadiusUser = Tables<'radius_users'> & {
  plan?: Tables<'billing_plans'> | null;
};

type ActionType = 'recharge' | 'change-password' | 'change-plan';

interface QuickRechargeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QuickRechargeDialog({ open, onOpenChange }: QuickRechargeDialogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<RadiusUser | null>(null);
  const [selectedAction, setSelectedAction] = useState<ActionType | null>(null);
  const [rechargeDialogOpen, setRechargeDialogOpen] = useState(false);
  
  // Change Password state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Change Plan state
  const [selectedPlanId, setSelectedPlanId] = useState('');

  const { data: users = [], isLoading } = useRadiusUsers();
  const { data: plans = [] } = useBillingPlans();
  const updateUser = useUpdateRadiusUser();
  const createTransaction = useCreateTransaction();

  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users.slice(0, 20);
    const query = searchQuery.toLowerCase();
    return users.filter(
      (user) =>
        user.username.toLowerCase().includes(query) ||
        user.full_name?.toLowerCase().includes(query) ||
        user.phone?.includes(query)
    ).slice(0, 20);
  }, [users, searchQuery]);

  const filteredPlans = useMemo(() => {
    if (!selectedUser) return plans;
    return plans.filter(plan => plan.service_type === selectedUser.service_type && plan.is_active);
  }, [plans, selectedUser]);

  const handleUserSelect = (user: RadiusUser) => {
    setSelectedUser(user);
    setSelectedPlanId(user.plan_id || '');
  };

  const handleActionSelect = (action: ActionType) => {
    setSelectedAction(action);
    if (action === 'recharge') {
      setRechargeDialogOpen(true);
    }
  };

  const handleRechargeDialogClose = (isOpen: boolean) => {
    setRechargeDialogOpen(isOpen);
    if (!isOpen) {
      resetAndClose();
    }
  };

  const handleChangePassword = async () => {
    if (!selectedUser) return;
    
    if (!newPassword.trim()) {
      toast.error('Please enter a new password');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    if (newPassword.length < 4) {
      toast.error('Password must be at least 4 characters');
      return;
    }

    try {
      await updateUser.mutateAsync({
        id: selectedUser.id,
        password_hash: newPassword,
        mikrotik_synced: false,
      });
      toast.success('Password changed successfully');
      resetAndClose();
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleChangePlan = async () => {
    if (!selectedUser || !selectedPlanId) return;
    
    const selectedPlan = plans.find(p => p.id === selectedPlanId);
    if (!selectedPlan) return;

    const planPrice = Number(selectedPlan.price);
    const currentPlanPrice = Number(selectedUser.plan?.price || 0);
    const proratedResult = calculateProratedPrice(selectedUser.expires_at, planPrice, currentPlanPrice, selectedUser.billing_cycle || 'monthly');
    const isNotExpired = selectedUser.status !== 'expired';
    const amountToDeduct = isNotExpired && proratedResult.isValid ? proratedResult.proratedAmount : planPrice;

    try {
      if (isNotExpired) {
        // Deduct prorated amount from balance
        await updateUser.mutateAsync({
          id: selectedUser.id,
          plan_id: selectedPlanId,
          monthly_bill: selectedPlan.price,
          balance: selectedUser.balance - amountToDeduct,
          mikrotik_synced: false,
        });
        
        // Create a transaction record for the plan change deduction
        const description = proratedResult.isValid 
          ? `Plan changed to ${selectedPlan.name} - Prorated for ${proratedResult.remainingDays} days`
          : `Plan changed to ${selectedPlan.name} - Balance deducted`;
        
        await createTransaction.mutateAsync({
          radiusUserId: selectedUser.id,
          amount: -amountToDeduct,
          type: 'plan_change',
          description,
          status: 'completed',
        });
      } else {
        // User is expired - no balance deduction needed
        await updateUser.mutateAsync({
          id: selectedUser.id,
          plan_id: selectedPlanId,
          monthly_bill: selectedPlan.price,
          mikrotik_synced: false,
        });
      }
      toast.success('Plan changed successfully');
      resetAndClose();
    } catch (error) {
      // Error handled by mutation
    }
  };

  const resetAndClose = () => {
    setSelectedUser(null);
    setSelectedAction(null);
    setSearchQuery('');
    setNewPassword('');
    setConfirmPassword('');
    setSelectedPlanId('');
    onOpenChange(false);
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      resetAndClose();
    } else {
      onOpenChange(isOpen);
    }
  };

  const handleBack = () => {
    if (selectedAction) {
      setSelectedAction(null);
      setNewPassword('');
      setConfirmPassword('');
    } else if (selectedUser) {
      setSelectedUser(null);
      setSelectedPlanId('');
    }
  };

  // Determine which view to show
  const showUserList = !selectedUser;
  const showActionList = selectedUser && !selectedAction;
  const showPasswordForm = selectedAction === 'change-password';
  const showPlanForm = selectedAction === 'change-plan';

  return (
    <>
      <Dialog open={open && !rechargeDialogOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-primary" />
              {showUserList && 'Quick Actions - Select User'}
              {showActionList && 'Select Action'}
              {showPasswordForm && 'Change Password'}
              {showPlanForm && 'Change Plan'}
            </DialogTitle>
          </DialogHeader>

          {/* User List View */}
          {showUserList && (
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by username, name, or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                  autoFocus
                />
              </div>

              <ScrollArea className="h-[300px] rounded-md border">
                {isLoading ? (
                  <div className="p-4 text-center text-muted-foreground">Loading users...</div>
                ) : filteredUsers.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">No users found</div>
                ) : (
                  <div className="divide-y">
                    {filteredUsers.map((user) => (
                      <button
                        key={user.id}
                        onClick={() => handleUserSelect(user)}
                        className="w-full p-3 text-left hover:bg-muted/50 transition-colors flex items-center gap-3"
                      >
                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <User className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground truncate">
                            {user.full_name || user.username}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>@{user.username}</span>
                            {user.phone && <span>• {user.phone}</span>}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-medium">৳{(user.balance || 0).toLocaleString()}</p>
                          <span className={`text-xs px-1.5 py-0.5 rounded ${
                            user.status === 'active' 
                              ? 'bg-success/10 text-success' 
                              : 'bg-destructive/10 text-destructive'
                          }`}>
                            {user.status}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          )}

          {/* Action Selection View */}
          {showActionList && selectedUser && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-muted/50 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{selectedUser.full_name || selectedUser.username}</p>
                  <p className="text-sm text-muted-foreground">@{selectedUser.username}</p>
                </div>
              </div>

              <div className="grid gap-2">
                <Button
                  variant="outline"
                  className="h-auto py-4 flex items-center gap-3 justify-start"
                  onClick={() => handleActionSelect('recharge')}
                >
                  <Wallet className="w-5 h-5 text-primary" />
                  <div className="text-left">
                    <p className="font-medium">Quick Recharge</p>
                    <p className="text-xs text-muted-foreground">Recharge customer account</p>
                  </div>
                </Button>

                <Button
                  variant="outline"
                  className="h-auto py-4 flex items-center gap-3 justify-start"
                  onClick={() => handleActionSelect('change-password')}
                >
                  <Key className="w-5 h-5 text-warning" />
                  <div className="text-left">
                    <p className="font-medium">Change Password</p>
                    <p className="text-xs text-muted-foreground">Update user's login password</p>
                  </div>
                </Button>

                <Button
                  variant="outline"
                  className="h-auto py-4 flex items-center gap-3 justify-start"
                  onClick={() => handleActionSelect('change-plan')}
                >
                  <Package className="w-5 h-5 text-info" />
                  <div className="text-left">
                    <p className="font-medium">Change Plan</p>
                    <p className="text-xs text-muted-foreground">Switch to a different billing plan</p>
                  </div>
                </Button>
              </div>

              <Button variant="ghost" onClick={handleBack} className="w-full">
                ← Back to user search
              </Button>
            </div>
          )}

          {/* Change Password Form */}
          {showPasswordForm && selectedUser && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-muted/50 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{selectedUser.full_name || selectedUser.username}</p>
                  <p className="text-sm text-muted-foreground">@{selectedUser.username}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                  />
                </div>
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button variant="ghost" onClick={handleBack}>
                  ← Back
                </Button>
                <Button 
                  onClick={handleChangePassword}
                  disabled={updateUser.isPending}
                >
                  {updateUser.isPending ? 'Saving...' : 'Change Password'}
                </Button>
              </DialogFooter>
            </div>
          )}

          {/* Change Plan Form */}
          {showPlanForm && selectedUser && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-muted/50 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{selectedUser.full_name || selectedUser.username}</p>
                  <p className="text-sm text-muted-foreground">
                    Current: {selectedUser.plan?.name || 'No plan'} • {selectedUser.service_type.toUpperCase()}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="plan-select">Select New Plan</Label>
                <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a plan" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredPlans.map((plan) => (
                      <SelectItem key={plan.id} value={plan.id}>
                        {plan.name} - ৳{Number(plan.price).toLocaleString()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Only showing {selectedUser.service_type.toUpperCase()} plans
                </p>
              </div>

              {selectedPlanId && (() => {
                const selectedPlan = filteredPlans.find(p => p.id === selectedPlanId);
                const planPrice = Number(selectedPlan?.price || 0);
                const userBalance = Number(selectedUser.balance || 0);
                const currentPlanPrice = Number(selectedUser.plan?.price || 0);
                const isNotExpired = selectedUser.status !== 'expired';
                const proratedResult = calculateProratedPrice(selectedUser.expires_at, planPrice, currentPlanPrice, selectedUser.billing_cycle || 'monthly');
                const amountToDeduct = isNotExpired && proratedResult.isValid ? proratedResult.proratedAmount : planPrice;
                const hasInsufficientBalance = isNotExpired && userBalance < amountToDeduct;
                const isDowngrade = isNotExpired && planPrice < currentPlanPrice;
                
                return (
                  <div className="p-3 bg-muted/50 rounded-lg space-y-2">
                    {isNotExpired && proratedResult.isValid && (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Current Plan Price:</span>
                          <span className="font-semibold text-foreground">৳{currentPlanPrice.toLocaleString()}/month</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">New Plan Price:</span>
                          <span className="font-semibold text-foreground">৳{planPrice.toLocaleString()}/month</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Remaining Days:</span>
                          <span className="font-semibold text-info">{proratedResult.remainingDays} days</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">New Plan Cost:</span>
                          <span className="font-semibold text-foreground">৳{proratedResult.newPlanCost.toFixed(0)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Current Plan Credit:</span>
                          <span className="font-semibold text-success">-৳{proratedResult.currentPlanCredit.toFixed(0)}</span>
                        </div>
                        <div className="flex items-center justify-between border-t border-border pt-2">
                          <span className="text-sm font-medium text-muted-foreground">Prorated Amount:</span>
                          <span className="text-lg font-bold text-primary">৳{amountToDeduct.toLocaleString()}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          (৳{planPrice} ÷ 30 × {proratedResult.remainingDays}) - (৳{currentPlanPrice} ÷ 30 × {proratedResult.remainingDays}) = ৳{amountToDeduct}
                        </p>
                      </>
                    )}
                    {isNotExpired && !proratedResult.isValid && (
                      <div className="flex items-center justify-between border-b border-border pb-2">
                        <span className="text-sm font-medium text-muted-foreground">Required Balance:</span>
                        <span className="text-lg font-bold text-primary">৳{planPrice.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Your Balance:</span>
                      <span className={`font-semibold ${hasInsufficientBalance ? 'text-destructive' : 'text-success'}`}>
                        ৳{userBalance.toLocaleString()}
                      </span>
                    </div>
                    {isNotExpired && (
                      <div className="flex items-center justify-between pt-2 border-t border-border">
                        <span className="text-sm text-muted-foreground">Balance After Change:</span>
                        <span className={`font-semibold ${hasInsufficientBalance ? 'text-destructive' : 'text-foreground'}`}>
                          ৳{(userBalance - amountToDeduct).toLocaleString()}
                        </span>
                      </div>
                    )}
                    {hasInsufficientBalance && (
                      <p className="text-sm text-destructive font-medium pt-1">
                        ⚠️ Insufficient balance! Need ৳{(amountToDeduct - userBalance).toLocaleString()} more.
                      </p>
                    )}
                    {isDowngrade && (
                      <p className="text-sm text-destructive font-medium pt-1">
                        ⚠️ Plan downgrade not allowed for active users.
                      </p>
                    )}
                    {!isNotExpired && (
                      <p className="text-sm text-info font-medium pt-1">
                        ℹ️ No balance deduction for expired users
                      </p>
                    )}
                  </div>
                );
              })()}

              <DialogFooter className="gap-2 sm:gap-0">
                <Button variant="ghost" onClick={handleBack}>
                  ← Back
                </Button>
                <Button 
                  onClick={handleChangePlan}
                  disabled={
                    updateUser.isPending || 
                    !selectedPlanId || 
                    selectedPlanId === selectedUser.plan_id ||
                    (() => {
                      if (selectedUser.status === 'expired') return false;
                      const selectedPlan = filteredPlans.find(p => p.id === selectedPlanId);
                      const planPrice = Number(selectedPlan?.price || 0);
                      const currentPlanPrice = Number(selectedUser.plan?.price || 0);
                      const proratedResult = calculateProratedPrice(selectedUser.expires_at, planPrice, currentPlanPrice, selectedUser.billing_cycle || 'monthly');
                      const amountToDeduct = proratedResult.isValid ? proratedResult.proratedAmount : planPrice;
                      return selectedUser.balance < amountToDeduct || planPrice < currentPlanPrice;
                    })()
                  }
                >
                  {updateUser.isPending ? 'Saving...' : 'Change Plan'}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <RechargeDialog
        user={selectedUser}
        open={rechargeDialogOpen}
        onOpenChange={handleRechargeDialogClose}
      />
    </>
  );
}
