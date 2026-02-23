import { useState, useEffect } from 'react';
import { useUpdateRadiusUser } from '@/hooks/useRadiusUsers';
import { useBillingPlans } from '@/hooks/useBillingPlans';
import { useAreas } from '@/hooks/useAreas';
import { useDistricts } from '@/hooks/useDistricts';
import { usePoliceStations } from '@/hooks/usePoliceStations';
import { useMikrotikRouters } from '@/hooks/useMikrotikRouters';
import { useConnectivityTypes } from '@/hooks/useConnectivityTypes';
import { useResellers } from '@/hooks/useResellers';
import { useBranches } from '@/hooks/useBranches';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
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
import { toast } from 'sonner';

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
  mac_serial: string | null;
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

interface EditUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: RadiusUser;
}

export function EditUserDialog({ open, onOpenChange, user }: EditUserDialogProps) {
  const { isAdmin } = useAuth();
  const updateUser = useUpdateRadiusUser();
  const { data: plans = [] } = useBillingPlans();
  const { data: areas = [] } = useAreas();
  const { data: districts = [] } = useDistricts();
  const { data: policeStations = [] } = usePoliceStations();
  const { data: routers = [] } = useMikrotikRouters();
  const { data: connectivityTypes = [] } = useConnectivityTypes();
  const { data: resellers = [] } = useResellers();
  const { data: branches = [] } = useBranches();

  // Combine resellers and branches for dropdown with Main-User option
  const resellerBranchOptions = [
    { id: 'main_user', name: 'Main-User', type: 'Admin', resellerId: null },
    ...resellers.filter(r => r.is_active).map(r => ({ id: `reseller_${r.id}`, name: r.name, type: 'Reseller', resellerId: r.id })),
    ...branches.filter(b => b.is_active).map(b => ({ id: `branch_${b.id}`, name: b.name, type: 'Branch', resellerId: b.reseller_id })),
  ];

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
    service_type: 'pppoe' as 'pppoe' | 'hotspot',
    connectivity_type: '',
    ip_address: '',
    mac_address: '',
    mac_serial: '',
    mikrotik_router_id: '',
    reseller_id: null as string | null,
    reseller_office: '',
    plan_id: '',
    billing_type: '',
    billing_cycle: 'monthly' as '30_day' | 'monthly',
    monthly_bill: '',
    connection_fee: '',
    connection_date: new Date().toISOString(),
    expires_at: '',
    status: 'active' as 'active' | 'disabled' | 'expired' | 'suspended',
    auto_renew: false,
  });

  // Calculate expiration date based on billing cycle
  const calculateExpirationDate = (connectionDate: Date, billingCycle: '30_day' | 'monthly'): Date => {
    const expireDate = new Date(connectionDate);
    if (billingCycle === '30_day') {
      expireDate.setDate(expireDate.getDate() + 30);
    } else {
      expireDate.setMonth(expireDate.getMonth() + 1);
    }
    expireDate.setHours(9, 0, 0, 0);
    return expireDate;
  };

  const handleBillingCycleChange = (cycle: '30_day' | 'monthly') => {
    const connectionDate = new Date(formData.connection_date);
    const newExpireDate = calculateExpirationDate(connectionDate, cycle);
    setFormData({ ...formData, billing_cycle: cycle, expires_at: newExpireDate.toISOString() });
  };

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
        service_type: user.service_type,
        connectivity_type: user.connectivity_type || '',
        ip_address: user.ip_address || '',
        mac_address: user.mac_address || '',
        mac_serial: user.mac_serial || '',
        mikrotik_router_id: user.mikrotik_router_id || '',
        reseller_id: user.reseller_id,
        reseller_office: user.reseller_office || (user.reseller_id === null ? 'Main-User' : ''),
        plan_id: user.plan_id || '',
        billing_type: user.billing_type || '',
        billing_cycle: (user.billing_cycle as '30_day' | 'monthly') || 'monthly',
        monthly_bill: user.monthly_bill?.toString() || '',
        connection_fee: user.connection_fee?.toString() || '',
        connection_date: user.connection_date || new Date().toISOString(),
        expires_at: user.expires_at || '',
        status: user.status,
        auto_renew: user.auto_renew || false,
      });
    }
  }, [user, open]);

  const queryClient = useQueryClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Check if device or mac_serial changed
      const deviceChanged = (formData.connectivity_type || '') !== (user.connectivity_type || '');
      const macSerialChanged = (formData.mac_serial || '') !== (user.mac_serial || '');

      // If device or mac_serial changed, create a change request instead of updating directly
      if (deviceChanged || macSerialChanged) {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        const { error: requestError } = await supabase
          .from('device_change_requests')
          .insert({
            radius_user_id: user.id,
            requested_by: authUser?.id || null,
            old_device: user.connectivity_type || null,
            new_device: formData.connectivity_type || null,
            old_mac_serial: user.mac_serial || null,
            new_mac_serial: formData.mac_serial || null,
            status: 'pending',
          });

        if (requestError) throw requestError;
        queryClient.invalidateQueries({ queryKey: ['device-change-requests'] });
        toast.success('Device change request submitted for approval');
      }

      // Update all other fields (exclude connectivity_type and mac_serial if they changed)
      const updateData: any = {
        id: user.id,
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
        service_type: formData.service_type,
        connectivity_type: deviceChanged ? user.connectivity_type : (formData.connectivity_type || null),
        ip_address: formData.ip_address || null,
        mac_address: formData.mac_address || null,
        mac_serial: macSerialChanged ? user.mac_serial : (formData.mac_serial || null),
        mikrotik_router_id: formData.mikrotik_router_id || null,
        reseller_id: formData.reseller_id,
        reseller_office: formData.reseller_office || null,
        plan_id: formData.plan_id || null,
        billing_type: formData.billing_type || null,
        billing_cycle: formData.billing_cycle || 'monthly',
        monthly_bill: formData.monthly_bill ? parseFloat(formData.monthly_bill) : null,
        connection_fee: formData.connection_fee ? parseFloat(formData.connection_fee) : null,
        expires_at: formData.expires_at || null,
        status: formData.status,
        auto_renew: formData.auto_renew,
      };

      await updateUser.mutateAsync(updateData);

      if (!deviceChanged && !macSerialChanged) {
        toast.success('User updated successfully');
      }
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to update user');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
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
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="father_name">Father's Name</Label>
                  <Input
                    id="father_name"
                    value={formData.father_name}
                    onChange={(e) => setFormData({ ...formData, father_name: e.target.value })}
                    placeholder="Enter father's name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <Select
                    value={formData.gender}
                    onValueChange={(value) => setFormData({ ...formData, gender: value })}
                  >
                    <SelectTrigger>
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
                    <SelectTrigger>
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
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="Enter phone number"
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
                    <SelectTrigger>
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
                    <SelectTrigger>
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
                    <SelectTrigger>
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
                    {!isAdmin && <Lock className="h-3 w-3 text-muted-foreground" />}
                  </Label>
                  <Select
                    value={formData.service_type}
                    onValueChange={(value: 'pppoe' | 'hotspot') => setFormData({ ...formData, service_type: value, plan_id: '', monthly_bill: '' })}
                    disabled={!isAdmin}
                  >
                    <SelectTrigger className={!isAdmin ? 'opacity-60' : ''}>
                      <SelectValue placeholder="Select service type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pppoe">PPPoE</SelectItem>
                      <SelectItem value="hotspot">Hotspot</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="connectivity_type">Device</Label>
                  <Select
                    value={formData.connectivity_type}
                    onValueChange={(value) => setFormData({ ...formData, connectivity_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select device" />
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
                  <Label htmlFor="mac_serial">
                    Mac/Serial Number {['onu', 'fibre+onu'].includes(formData.connectivity_type?.toLowerCase() || '') ? '*' : ''}
                  </Label>
                  <Input
                    id="mac_serial"
                    value={formData.mac_serial}
                    onChange={(e) => setFormData({ ...formData, mac_serial: e.target.value })}
                    placeholder="Enter Mac or Serial number"
                    required={['onu', 'fibre+onu'].includes(formData.connectivity_type?.toLowerCase() || '')}
                  />
                  {['onu', 'fibre+onu'].includes(formData.connectivity_type?.toLowerCase() || '') && !formData.mac_serial && (
                    <p className="text-xs text-destructive">Required for ONU / Fibre+ONU devices</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ip_address">IP Address</Label>
                  <Input
                    id="ip_address"
                    value={formData.ip_address}
                    onChange={(e) => setFormData({ ...formData, ip_address: e.target.value })}
                    placeholder="e.g., 192.168.1.100"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mac_address">MAC Address</Label>
                  <Input
                    id="mac_address"
                    value={formData.mac_address}
                    onChange={(e) => setFormData({ ...formData, mac_address: e.target.value })}
                    placeholder="e.g., AA:BB:CC:DD:EE:FF"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="router" className="flex items-center gap-1">
                    MikroTik Router
                    {!isAdmin && <Lock className="h-3 w-3 text-muted-foreground" />}
                  </Label>
                  <Select
                    value={formData.mikrotik_router_id}
                    onValueChange={(value) => setFormData({ ...formData, mikrotik_router_id: value })}
                    disabled={!isAdmin}
                  >
                    <SelectTrigger className={!isAdmin ? 'opacity-60' : ''}>
                      <SelectValue placeholder="Select router" />
                    </SelectTrigger>
                    <SelectContent>
                      {routers.map((router) => (
                        <SelectItem key={router.id} value={router.id}>
                          {router.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: 'active' | 'disabled' | 'expired' | 'suspended') => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="disabled">Disabled</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reseller_office" className="flex items-center gap-1">
                    Reseller/Branch
                    {!isAdmin && <Lock className="h-3 w-3 text-muted-foreground" />}
                  </Label>
                  <Select
                    value={formData.reseller_office}
                    onValueChange={(value) => {
                      const selectedOption = resellerBranchOptions.find(o => o.name === value);
                      setFormData({ 
                        ...formData, 
                        reseller_office: value,
                        reseller_id: selectedOption?.resellerId || null
                      });
                    }}
                    disabled={!isAdmin}
                  >
                    <SelectTrigger className={!isAdmin ? 'opacity-60' : ''}>
                      <SelectValue placeholder="Select reseller or branch" />
                    </SelectTrigger>
                    <SelectContent>
                      {resellerBranchOptions.map((option) => (
                        <SelectItem key={option.id} value={option.name}>
                          {option.name} ({option.type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            {/* Billing Tab */}
            <TabsContent value="billing" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="plan" className="flex items-center gap-1">
                    Billing Plan
                    {!isAdmin && <Lock className="h-3 w-3 text-muted-foreground" />}
                  </Label>
                  <Select
                    value={formData.plan_id}
                    onValueChange={(value) => {
                      const selectedPlan = plans.find(p => p.id === value);
                      setFormData({ 
                        ...formData, 
                        plan_id: value,
                        monthly_bill: selectedPlan?.price?.toString() || formData.monthly_bill
                      });
                    }}
                    disabled={!isAdmin}
                  >
                    <SelectTrigger className={!isAdmin ? 'opacity-60' : ''}>
                      <SelectValue placeholder="Select plan" />
                    </SelectTrigger>
                    <SelectContent>
                      {plans
                        .filter((plan) => plan.service_type === formData.service_type)
                        .map((plan) => (
                          <SelectItem key={plan.id} value={plan.id}>
                            {plan.name} - ৳{plan.price}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="billing_type">Billing Type</Label>
                  <Select
                    value={formData.billing_type}
                    onValueChange={(value) => setFormData({ ...formData, billing_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select billing type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="prepaid">Prepaid</SelectItem>
                      <SelectItem value="postpaid">Postpaid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="billing_cycle" className="flex items-center gap-1">
                    Billing Cycle
                    {!isAdmin && <Lock className="h-3 w-3 text-muted-foreground" />}
                  </Label>
                  <Select
                    value={formData.billing_cycle}
                    onValueChange={(value: '30_day' | 'monthly') => handleBillingCycleChange(value)}
                    disabled={!isAdmin}
                  >
                    <SelectTrigger className={!isAdmin ? 'opacity-60' : ''}>
                      <SelectValue placeholder="Select billing cycle" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30_day">30 Day Count</SelectItem>
                      <SelectItem value="monthly">Monthly (same day next month at 9 AM)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="monthly_bill" className="flex items-center gap-1">
                    Monthly Bill (৳)
                    {!isAdmin && <Lock className="h-3 w-3 text-muted-foreground" />}
                  </Label>
                  <Input
                    id="monthly_bill"
                    type="number"
                    value={formData.monthly_bill}
                    onChange={(e) => setFormData({ ...formData, monthly_bill: e.target.value })}
                    placeholder="Enter monthly bill"
                    disabled={!isAdmin}
                    className={!isAdmin ? 'opacity-60' : ''}
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
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label className="flex items-center gap-1">
                    Expiration Date
                    {!isAdmin && <Lock className="h-3 w-3 text-muted-foreground" />}
                  </Label>
                  <Input
                    type="datetime-local"
                    value={formData.expires_at ? new Date(formData.expires_at).toISOString().slice(0, 16) : ''}
                    onChange={(e) => {
                      if (isAdmin && e.target.value) {
                        setFormData({ ...formData, expires_at: new Date(e.target.value).toISOString() });
                      }
                    }}
                    disabled={!isAdmin}
                    className={!isAdmin ? 'opacity-60' : ''}
                  />
                  {formData.expires_at && (
                    <p className="text-xs text-muted-foreground">
                      {new Date(formData.expires_at).toLocaleString('en-GB', { 
                        day: '2-digit', 
                        month: 'short', 
                        year: 'numeric', 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                  )}
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

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="bg-gradient-primary text-primary-foreground"
              disabled={updateUser.isPending}
            >
              {updateUser.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
