import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useBillingPlans } from '@/hooks/useBillingPlans';
import { useAreas } from '@/hooks/useAreas';
import { useDistricts } from '@/hooks/useDistricts';
import { usePoliceStations } from '@/hooks/usePoliceStations';
import { useConnectivityTypes } from '@/hooks/useConnectivityTypes';
import { useResellerAssignedPlans } from '@/hooks/useResellerAssignedPlans';
import { useResellers } from '@/hooks/useResellers';
import { useBranches } from '@/hooks/useBranches';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Loader2, Lock } from 'lucide-react';

interface RadiusUser {
  id: string;
  username: string;
  full_name: string | null;
  father_name: string | null;
  gender: string | null;
  nid_number: string | null;
  customer_type: string | null;
  phone: string | null;
  email: string | null;
  district_id: string | null;
  police_station_id: string | null;
  area_id: string | null;
  address_details: string | null;
  service_type: 'pppoe' | 'hotspot';
  connectivity_type: string | null;
  ip_address: string | null;
  mac_address: string | null;
  mikrotik_router_id: string | null;
  reseller_id: string | null;
  reseller_office: string | null;
  plan_id: string | null;
  billing_type: string | null;
  billing_cycle: string | null;
  monthly_bill: number | null;
  connection_fee: number | null;
  expires_at: string | null;
  connection_date: string | null;
  status: 'active' | 'disabled' | 'expired' | 'suspended';
  auto_renew?: boolean;
}

interface ResellerEditUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: RadiusUser;
  resellerId: string;
  isSuperAdmin?: boolean;
}

export function ResellerEditUserDialog({ 
  open, 
  onOpenChange, 
  user, 
  resellerId,
  isSuperAdmin = false 
}: ResellerEditUserDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: plans = [] } = useBillingPlans();
  const { data: areas = [] } = useAreas();
  const { data: districts = [] } = useDistricts();
  const { data: policeStations = [] } = usePoliceStations();
  const { data: connectivityTypes = [] } = useConnectivityTypes();
  const { data: assignedPlans = [] } = useResellerAssignedPlans(resellerId);
  const { data: resellers = [] } = useResellers();
  const { data: branches = [] } = useBranches();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Combine resellers and branches for dropdown with Main-User option
  const resellerBranchOptions = [
    { id: 'main_user', name: 'Main-User', type: 'Admin', resellerId: null },
    ...resellers.filter(r => r.is_active).map(r => ({ id: `reseller_${r.id}`, name: r.name, type: 'Reseller', resellerId: r.id })),
    ...branches.filter(b => b.is_active).map(b => ({ id: `branch_${b.id}`, name: b.name, type: 'Branch', resellerId: b.reseller_id })),
  ];

  // Get current reseller/branch value
  const getCurrentResellerBranchValue = () => {
    if (!user.reseller_id) return 'main_user';
    // Check if it's a branch first
    const branch = branches.find(b => b.reseller_id === user.reseller_id && b.name === user.reseller_office);
    if (branch) return `branch_${branch.id}`;
    return `reseller_${user.reseller_id}`;
  };

  // Filter plans to only those assigned to this reseller
  const filteredPlans = plans.filter(plan => {
    const assignedPlanIds = assignedPlans.map(ap => ap.id);
    return plan.service_type === user.service_type && assignedPlanIds.includes(plan.id);
  });

  const [formData, setFormData] = useState({
    full_name: '',
    father_name: '',
    gender: '',
    nid_number: '',
    customer_type: '',
    phone: '',
    email: '',
    district_id: '',
    police_station_id: '',
    area_id: '',
    address_details: '',
    connectivity_type: '',
    ip_address: '',
    mac_address: '',
    billing_type: '',
    connection_fee: '',
    status: 'active' as 'active' | 'disabled' | 'expired' | 'suspended',
    reseller_branch: '',
    auto_renew: false,
  });

  useEffect(() => {
    if (user && open) {
      setFormData({
        full_name: user.full_name || '',
        father_name: user.father_name || '',
        gender: user.gender || '',
        nid_number: user.nid_number || '',
        customer_type: user.customer_type || '',
        phone: user.phone || '',
        email: user.email || '',
        district_id: user.district_id || '',
        police_station_id: user.police_station_id || '',
        area_id: user.area_id || '',
        address_details: user.address_details || '',
        connectivity_type: user.connectivity_type || '',
        ip_address: user.ip_address || '',
        mac_address: user.mac_address || '',
        billing_type: user.billing_type || '',
        connection_fee: user.connection_fee?.toString() || '',
        status: user.status,
        reseller_branch: getCurrentResellerBranchValue(),
        auto_renew: user.auto_renew || false,
      });
    }
  }, [user, open, branches]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Parse reseller/branch selection (only if admin)
      let newResellerId: string | null = user.reseller_id;
      let newResellerOffice: string | null = user.reseller_office;

      if (isSuperAdmin && formData.reseller_branch) {
        if (formData.reseller_branch === 'main_user') {
          newResellerId = null;
          newResellerOffice = null;
        } else if (formData.reseller_branch.startsWith('reseller_')) {
          const selectedReseller = resellers.find(r => `reseller_${r.id}` === formData.reseller_branch);
          newResellerId = selectedReseller?.id || null;
          newResellerOffice = selectedReseller?.name || null;
        } else if (formData.reseller_branch.startsWith('branch_')) {
          const selectedBranch = branches.find(b => `branch_${b.id}` === formData.reseller_branch);
          newResellerId = selectedBranch?.reseller_id || null;
          newResellerOffice = selectedBranch?.name || null;
        }
      }

      const updates: Record<string, unknown> = {
        full_name: formData.full_name || null,
        father_name: formData.father_name || null,
        gender: formData.gender || null,
        nid_number: formData.nid_number || null,
        customer_type: formData.customer_type || null,
        phone: formData.phone || null,
        email: formData.email || null,
        district_id: formData.district_id || null,
        police_station_id: formData.police_station_id || null,
        area_id: formData.area_id || null,
        address_details: formData.address_details || null,
        connectivity_type: formData.connectivity_type || null,
        ip_address: formData.ip_address || null,
        mac_address: formData.mac_address || null,
        billing_type: formData.billing_type || null,
        connection_fee: formData.connection_fee ? parseFloat(formData.connection_fee) : null,
        auto_renew: formData.auto_renew,
      };

      // Only admin can change status and reseller/branch
      if (isSuperAdmin) {
        updates.status = formData.status;
        updates.reseller_id = newResellerId;
        updates.reseller_office = newResellerOffice;
      }

      const sessionToken = localStorage.getItem('reseller_session_token');
      const { error } = await supabase.functions.invoke('reseller-update-user', {
        body: {
          resellerId,
          isSuperAdmin,
          userId: user.id,
          updates,
          session_token: sessionToken,
        },
      });

      if (error) throw error;

      toast({ title: 'Success', description: 'User updated successfully' });
      queryClient.invalidateQueries({ queryKey: ['reseller-user-profile'] });
      queryClient.invalidateQueries({ queryKey: ['reseller-users'] });
      onOpenChange(false);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update user', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle>Edit User: {user.username}</DialogTitle>
          <DialogDescription>
            Update user information across all categories.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="personal" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="personal">Personal</TabsTrigger>
              <TabsTrigger value="address">Address</TabsTrigger>
              <TabsTrigger value="connection">Connection</TabsTrigger>
              <TabsTrigger value="billing">Billing</TabsTrigger>
            </TabsList>

            {/* Personal Information Tab */}
            <TabsContent value="personal" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    placeholder="Enter full name"
                    className="bg-secondary border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="father_name">Father's Name</Label>
                  <Input
                    id="father_name"
                    value={formData.father_name}
                    onChange={(e) => setFormData({ ...formData, father_name: e.target.value })}
                    placeholder="Enter father's name"
                    className="bg-secondary border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <Select
                    value={formData.gender}
                    onValueChange={(value) => setFormData({ ...formData, gender: value })}
                  >
                    <SelectTrigger className="bg-secondary border-border">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customer_type">Customer Type</Label>
                  <Select
                    value={formData.customer_type}
                    onValueChange={(value) => setFormData({ ...formData, customer_type: value })}
                  >
                    <SelectTrigger className="bg-secondary border-border">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="residential">Residential</SelectItem>
                      <SelectItem value="commercial">Commercial</SelectItem>
                      <SelectItem value="enterprise">Enterprise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nid_number">NID Number</Label>
                  <Input
                    id="nid_number"
                    value={formData.nid_number}
                    onChange={(e) => setFormData({ ...formData, nid_number: e.target.value })}
                    placeholder="Enter NID number"
                    className="bg-secondary border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="Enter phone number"
                    className="bg-secondary border-border"
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Enter email address"
                    className="bg-secondary border-border"
                  />
                </div>
              </div>
            </TabsContent>

            {/* Address Tab */}
            <TabsContent value="address" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="district">District</Label>
                  <Select
                    value={formData.district_id}
                    onValueChange={(value) => setFormData({ ...formData, district_id: value })}
                  >
                    <SelectTrigger className="bg-secondary border-border">
                      <SelectValue placeholder="Select district" />
                    </SelectTrigger>
                    <SelectContent>
                      {districts.map((district) => (
                        <SelectItem key={district.id} value={district.id}>
                          {district.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="police_station">Police Station</Label>
                  <Select
                    value={formData.police_station_id}
                    onValueChange={(value) => setFormData({ ...formData, police_station_id: value })}
                  >
                    <SelectTrigger className="bg-secondary border-border">
                      <SelectValue placeholder="Select police station" />
                    </SelectTrigger>
                    <SelectContent>
                      {policeStations.map((ps) => (
                        <SelectItem key={ps.id} value={ps.id}>
                          {ps.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="area">Area</Label>
                  <Select
                    value={formData.area_id}
                    onValueChange={(value) => setFormData({ ...formData, area_id: value })}
                  >
                    <SelectTrigger className="bg-secondary border-border">
                      <SelectValue placeholder="Select area" />
                    </SelectTrigger>
                    <SelectContent>
                      {areas.map((area) => (
                        <SelectItem key={area.id} value={area.id}>
                          {area.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="address_details">Address Details</Label>
                  <Textarea
                    id="address_details"
                    value={formData.address_details}
                    onChange={(e) => setFormData({ ...formData, address_details: e.target.value })}
                    placeholder="Enter detailed address"
                    rows={3}
                    className="bg-secondary border-border"
                  />
                </div>
              </div>
            </TabsContent>

            {/* Connection Tab */}
            <TabsContent value="connection" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="service_type" className="flex items-center gap-1">
                    Service Type
                    <Lock className="h-3 w-3 text-muted-foreground" />
                  </Label>
                  <Input
                    value="Hotspot"
                    disabled
                    className="bg-secondary border-border opacity-60"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="connectivity_type">Connectivity Type</Label>
                  <Select
                    value={formData.connectivity_type}
                    onValueChange={(value) => setFormData({ ...formData, connectivity_type: value })}
                  >
                    <SelectTrigger className="bg-secondary border-border">
                      <SelectValue placeholder="Select connectivity" />
                    </SelectTrigger>
                    <SelectContent>
                      {connectivityTypes.map((type) => (
                        <SelectItem key={type.id} value={type.name}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ip_address">IP Address</Label>
                  <Input
                    id="ip_address"
                    value={formData.ip_address}
                    onChange={(e) => setFormData({ ...formData, ip_address: e.target.value })}
                    placeholder="e.g., 192.168.1.100"
                    className="bg-secondary border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mac_address">MAC Address</Label>
                  <Input
                    id="mac_address"
                    value={formData.mac_address}
                    onChange={(e) => setFormData({ ...formData, mac_address: e.target.value })}
                    placeholder="e.g., AA:BB:CC:DD:EE:FF"
                    className="bg-secondary border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="router" className="flex items-center gap-1">
                    MikroTik Router
                    <Lock className="h-3 w-3 text-muted-foreground" />
                  </Label>
                  <Input
                    value={user.mikrotik_router_id ? 'Assigned' : 'Not assigned'}
                    disabled
                    className="bg-secondary border-border opacity-60"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status" className="flex items-center gap-1">
                    Status
                    {!isSuperAdmin && <Lock className="h-3 w-3 text-muted-foreground" />}
                  </Label>
                  {isSuperAdmin ? (
                    <Select
                      value={formData.status}
                      onValueChange={(value: 'active' | 'disabled' | 'expired' | 'suspended') => 
                        setFormData({ ...formData, status: value })
                      }
                    >
                      <SelectTrigger className="bg-secondary border-border">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="disabled">Disabled</SelectItem>
                        <SelectItem value="expired">Expired</SelectItem>
                        <SelectItem value="suspended">Suspended</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      value={formData.status.charAt(0).toUpperCase() + formData.status.slice(1)}
                      disabled
                      className="bg-secondary border-border opacity-60"
                    />
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reseller_branch" className="flex items-center gap-1">
                    Reseller/Branch
                    {!isSuperAdmin && <Lock className="h-3 w-3 text-muted-foreground" />}
                  </Label>
                  {isSuperAdmin ? (
                    <Select
                      value={formData.reseller_branch}
                      onValueChange={(value) => setFormData({ ...formData, reseller_branch: value })}
                    >
                      <SelectTrigger className="bg-secondary border-border">
                        <SelectValue placeholder="Select reseller/branch" />
                      </SelectTrigger>
                      <SelectContent>
                        {resellerBranchOptions.map((option) => (
                          <SelectItem key={option.id} value={option.id}>
                            <span className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">[{option.type}]</span>
                              {option.name}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      value={user.reseller_office || 'Main-User'}
                      disabled
                      className="bg-secondary border-border opacity-60"
                    />
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Billing Tab */}
            <TabsContent value="billing" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="plan" className="flex items-center gap-1">
                    Billing Plan
                    <Lock className="h-3 w-3 text-muted-foreground" />
                  </Label>
                  <Input
                    value={filteredPlans.find(p => p.id === user.plan_id)?.name || 'Not assigned'}
                    disabled
                    className="bg-secondary border-border opacity-60"
                  />
                  <p className="text-xs text-muted-foreground">
                    Use "Change Plan" button to modify plan
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="billing_type">Billing Type</Label>
                  <Select
                    value={formData.billing_type}
                    onValueChange={(value) => setFormData({ ...formData, billing_type: value })}
                  >
                    <SelectTrigger className="bg-secondary border-border">
                      <SelectValue placeholder="Select billing type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="prepaid">Prepaid</SelectItem>
                      <SelectItem value="postpaid">Postpaid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="monthly_bill" className="flex items-center gap-1">
                    Monthly Bill (৳)
                    <Lock className="h-3 w-3 text-muted-foreground" />
                  </Label>
                  <Input
                    value={`৳${user.monthly_bill?.toLocaleString() || 0}`}
                    disabled
                    className="bg-secondary border-border opacity-60"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="connection_fee">Connection Fee (৳)</Label>
                  <Input
                    id="connection_fee"
                    type="number"
                    value={formData.connection_fee}
                    onChange={(e) => setFormData({ ...formData, connection_fee: e.target.value })}
                    placeholder="Enter connection fee"
                    className="bg-secondary border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    Expiration Date
                    <Lock className="h-3 w-3 text-muted-foreground" />
                  </Label>
                  <Input
                    value={user.expires_at ? new Date(user.expires_at).toLocaleString() : 'N/A'}
                    disabled
                    className="bg-secondary border-border opacity-60"
                  />
                </div>
                <div className="col-span-2 flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border">
                  <div>
                    <Label htmlFor="auto_renew" className="text-sm font-medium">Auto Renew</Label>
                    <p className="text-xs text-muted-foreground">Monthly bill will be auto-generated when enabled</p>
                  </div>
                  <Switch
                    id="auto_renew"
                    checked={formData.auto_renew}
                    onCheckedChange={(checked) => setFormData({ ...formData, auto_renew: checked })}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="bg-gradient-primary text-primary-foreground"
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
