import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useResellerAuth } from "@/contexts/ResellerAuthContext";
import { ResellerLayout } from "@/components/reseller/ResellerLayout";
import { useResellerAssignedPlans } from "@/hooks/useResellerAssignedPlans";
import { useDistricts } from "@/hooks/useDistricts";
import { usePoliceStations } from "@/hooks/usePoliceStations";
import { useAreas } from "@/hooks/useAreas";
import { useMikrotikRouters } from "@/hooks/useMikrotikRouters";
import { useConnectivityTypes } from "@/hooks/useConnectivityTypes";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, UserPlus, User, MapPin, Router, Receipt, Wifi, CalendarIcon, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ResellerBulkUserImport } from "@/components/reseller/ResellerBulkUserImport";

export default function ResellerCreateUserPage() {
  const navigate = useNavigate();
  const { reseller, sessionToken, isLoading: authLoading } = useResellerAuth();
  const { toast } = useToast();
  // Fetch only plans assigned to this reseller via reseller_plan_commissions
  const { data: assignedPlans = [] } = useResellerAssignedPlans(reseller?.id);
  const { data: districts = [] } = useDistricts();
  const { data: policeStations = [] } = usePoliceStations();
  const { data: areas = [] } = useAreas();
  const { data: routers = [] } = useMikrotikRouters();
  const { data: connectivityTypes = [] } = useConnectivityTypes();
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (!authLoading && !reseller) {
      navigate('/reseller/login', { replace: true });
    }
  }, [reseller, authLoading, navigate]);

  const DEFAULT_DISTRICT_ID = "fa8c6591-13d1-4369-8f99-2acbb567f247";
  const DEFAULT_POLICE_STATION_ID = "69ca6f19-d373-420c-a098-e638fca8d844";

  const getDefaultExpireDate = () => {
    const today = new Date();
    today.setHours(9, 0, 0, 0);
    return today;
  };

  const [formData, setFormData] = useState({
    full_name: "",
    father_name: "",
    nid_number: "",
    phone: "",
    gender: "male",
    district_id: DEFAULT_DISTRICT_ID,
    police_station_id: DEFAULT_POLICE_STATION_ID,
    area_id: "",
    customer_type: "commercial",
    address_details: "",
    mikrotik_router_id: "",
    username: "",
    password: "",
    connection_date: new Date(),
    expires_at: getDefaultExpireDate() as Date | null,
    monthly_bill: "",
    connection_fee: "500",
    billing_type: "",
    billing_cycle: "monthly" as "30_day" | "monthly",
    plan_id: "",
    connectivity_type: "",
    mac_serial: "",
    service_type: "pppoe" as "pppoe" | "hotspot", // Fixed to PPPoE for resellers
  });

  const calculateExpirationDate = (connectionDate: Date, billingCycle: "30_day" | "monthly"): Date => {
    const expireDate = new Date(connectionDate);
    if (billingCycle === "30_day") {
      expireDate.setDate(expireDate.getDate() + 30);
    } else {
      expireDate.setMonth(expireDate.getMonth() + 1);
    }
    expireDate.setHours(9, 0, 0, 0);
    return expireDate;
  };

  const handleBillingCycleChange = (cycle: "30_day" | "monthly") => {
    const newExpireDate = calculateExpirationDate(formData.connection_date, cycle);
    setFormData({ ...formData, billing_cycle: cycle, expires_at: newExpireDate });
  };

  const handleConnectionDateChange = (date: Date) => {
    const newExpireDate = calculateExpirationDate(date, formData.billing_cycle);
    setFormData({ ...formData, connection_date: date, expires_at: newExpireDate });
  };

  const totalAmount = (parseFloat(formData.monthly_bill) || 0) + (parseFloat(formData.connection_fee) || 0);

  const handleCreateUser = async () => {
    if (!reseller) return;

    const deviceRequiresMacSerial = ['onu', 'fiber_onu', 'fiber+onu'].includes(formData.connectivity_type?.toLowerCase?.() || '');

    const requiredFields = [
      { field: formData.full_name, name: 'Customer Name' },
      { field: formData.phone, name: 'Mobile Number' },
      { field: formData.district_id, name: 'District' },
      { field: formData.police_station_id, name: 'Police Station' },
      { field: formData.area_id, name: 'Area' },
      { field: formData.address_details, name: 'Address Details' },
      { field: formData.service_type, name: 'Service Type' },
      { field: formData.connectivity_type, name: 'Connectivity Type' },
      { field: formData.mikrotik_router_id, name: 'Select MikroTik' },
      { field: formData.billing_type, name: 'Billing Type' },
      { field: formData.plan_id, name: 'Plan' },
      ...(deviceRequiresMacSerial ? [{ field: formData.mac_serial, name: 'Mac/Serial Number' }] : []),
    ];

    const missingFields = requiredFields.filter(f => !f.field).map(f => f.name);
    
    if (missingFields.length > 0) {
      toast({
        title: "Validation Error",
        description: `Please fill in: ${missingFields.join(', ')}`,
        variant: "destructive",
      });
      return;
    }

    if (!formData.username || !formData.password) {
      toast({
        title: "Validation Error",
        description: "Username and password are required for MikroTik configuration.",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);

    try {
      const userData = {
        full_name: formData.full_name || null,
        father_name: formData.father_name || null,
        nid_number: formData.nid_number || null,
        phone: formData.phone || null,
        gender: formData.gender || null,
        district_id: formData.district_id || null,
        police_station_id: formData.police_station_id || null,
        area_id: formData.area_id || null,
        customer_type: formData.customer_type || null,
        address_details: formData.address_details || null,
        mikrotik_router_id: formData.mikrotik_router_id || null,
        username: formData.username,
        password_hash: formData.password,
        connection_date: formData.connection_date?.toISOString() || null,
        expires_at: formData.expires_at?.toISOString() || null,
        monthly_bill: parseFloat(formData.monthly_bill) || 0,
        connection_fee: parseFloat(formData.connection_fee) || 0,
        billing_type: formData.billing_type || null,
        billing_cycle: formData.billing_cycle || 'monthly',
        plan_id: formData.plan_id || null,
        connectivity_type: formData.connectivity_type || null,
        mac_serial: formData.mac_serial || null,
        service_type: formData.service_type as "pppoe" | "hotspot",
        status: 'active',
        balance: 0,
        data_used_mb: 0,
      };

      const { data, error } = await supabase.functions.invoke('reseller-create-user', {
        body: {
          resellerId: reseller.id,
          userData,
          session_token: sessionToken,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({
        title: "User Created",
        description: `User ${formData.username} has been created successfully.`,
      });

      navigate("/reseller/users");
    } catch (error) {
      const err = error as Error;
      toast({
        title: "Error",
        description: err.message || "Failed to create user. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!reseller) return null;

  return (
    <ResellerLayout title="Create User" subtitle="Add a new PPPoE or Hotspot user">
      <Tabs defaultValue="single" className="max-w-4xl">
        <TabsList className="mb-6 bg-secondary">
          <TabsTrigger value="single" className="flex items-center gap-2">
            <UserPlus className="w-4 h-4" />
            Single User
          </TabsTrigger>
          <TabsTrigger value="bulk" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Bulk Import (Excel)
          </TabsTrigger>
        </TabsList>

        <TabsContent value="single">
          <div className="space-y-6">
            {/* Personal Information */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <User className="w-5 h-5 text-primary" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Customer Name *</Label>
                    <Input
                      placeholder="Enter customer name"
                      className="bg-secondary border-border"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Father Name</Label>
                    <Input
                      placeholder="Enter father name"
                      className="bg-secondary border-border"
                      value={formData.father_name}
                      onChange={(e) => setFormData({ ...formData, father_name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>NID Number</Label>
                    <Input
                      placeholder="Enter NID number"
                      className="bg-secondary border-border"
                      value={formData.nid_number}
                      onChange={(e) => setFormData({ ...formData, nid_number: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Mobile Number *</Label>
                    <Input
                      placeholder="+880 1XXX XXXXXX"
                      className="bg-secondary border-border"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Gender</Label>
                    <Select value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value })}>
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
                </div>
              </CardContent>
            </Card>

            {/* Billing Address */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MapPin className="w-5 h-5 text-primary" />
                  Billing Address
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>District *</Label>
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
                    <Label>Police Station *</Label>
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
                    <Label>Area *</Label>
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
                  <div className="space-y-2">
                    <Label>Customer Type</Label>
                    <Select
                      value={formData.customer_type}
                      onValueChange={(value) => setFormData({ ...formData, customer_type: value })}
                    >
                      <SelectTrigger className="bg-secondary border-border">
                        <SelectValue placeholder="Select customer type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="commercial">Share user</SelectItem>
                        <SelectItem value="corporate">Dedicated user</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Address Details *</Label>
                    <Textarea
                      placeholder="Enter full address details"
                      className="bg-secondary border-border"
                      value={formData.address_details}
                      onChange={(e) => setFormData({ ...formData, address_details: e.target.value })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Connectivity Details */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Wifi className="w-5 h-5 text-primary" />
                  Connectivity Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Service Type</Label>
                    <Input
                      className="bg-muted border-border cursor-not-allowed"
                      value="PPPoE"
                      disabled
                      readOnly
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Connectivity Type *</Label>
                    <Select
                      value={formData.connectivity_type}
                      onValueChange={(value) => setFormData({ ...formData, connectivity_type: value })}
                    >
                      <SelectTrigger className="bg-secondary border-border">
                        <SelectValue placeholder="Select connectivity type" />
                      </SelectTrigger>
                      <SelectContent>
                        {connectivityTypes.map((type) => (
                          <SelectItem key={type.id} value={type.code || type.id}>
                            {type.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Reseller/Branch</Label>
                    <Input
                      className="bg-muted border-border cursor-not-allowed"
                      value={reseller.name}
                      disabled
                      readOnly
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>
                      Mac/Serial Number {['onu', 'fiber_onu', 'fiber+onu'].includes(formData.connectivity_type?.toLowerCase?.() || '') ? '*' : ''}
                    </Label>
                    <Input
                      placeholder="Enter Mac or Serial number"
                      className="bg-secondary border-border"
                      value={formData.mac_serial}
                      onChange={(e) => setFormData({ ...formData, mac_serial: e.target.value })}
                      required={['onu', 'fiber_onu', 'fiber+onu'].includes(formData.connectivity_type?.toLowerCase?.() || '')}
                    />
                    {['onu', 'fiber_onu', 'fiber+onu'].includes(formData.connectivity_type?.toLowerCase?.() || '') && !formData.mac_serial && (
                      <p className="text-xs text-destructive">Required for ONU / Fiber+ONU devices</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* MikroTik Configuration */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Router className="w-5 h-5 text-primary" />
                  MikroTik Configuration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Select MikroTik *</Label>
                    <Select
                      value={formData.mikrotik_router_id}
                      onValueChange={(value) => setFormData({ ...formData, mikrotik_router_id: value })}
                    >
                      <SelectTrigger className="bg-secondary border-border">
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
                    <Label>User ID *</Label>
                    <Input
                      placeholder="Enter user ID"
                      className="bg-secondary border-border"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Password *</Label>
                    <Input
                      type="password"
                      placeholder="Enter password"
                      className="bg-secondary border-border"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Connection Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal bg-secondary border-border",
                            !formData.connection_date && "text-muted-foreground",
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.connection_date ? format(formData.connection_date, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={formData.connection_date}
                          onSelect={(date) => handleConnectionDateChange(date || new Date())}
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <Label>Billing Cycle *</Label>
                    <Select
                      value={formData.billing_cycle}
                      onValueChange={(value: "30_day" | "monthly") => handleBillingCycleChange(value)}
                    >
                      <SelectTrigger className="bg-secondary border-border">
                        <SelectValue placeholder="Select billing cycle" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30_day">30 Day Count (expires after 30 days)</SelectItem>
                        <SelectItem value="monthly">Monthly (same day next month at 9 AM)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Expire Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal bg-secondary border-border",
                            !formData.expires_at && "text-muted-foreground",
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.expires_at ? format(formData.expires_at, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={formData.expires_at || undefined}
                          onSelect={(date) => setFormData({ ...formData, expires_at: date || null })}
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Billing Information */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Receipt className="w-5 h-5 text-primary" />
                  Billing Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Monthly Bill (৳)</Label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      className="bg-secondary border-border"
                      value={formData.monthly_bill}
                      onChange={(e) => setFormData({ ...formData, monthly_bill: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Connection Fee (৳)</Label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      className="bg-secondary border-border"
                      value={formData.connection_fee}
                      onChange={(e) => setFormData({ ...formData, connection_fee: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Total Amount (৳)</Label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      className="bg-secondary border-border"
                      value={totalAmount.toFixed(2)}
                      readOnly
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Billing Type *</Label>
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
                    <Label>Plan *</Label>
                    <Select
                      value={formData.plan_id}
                      onValueChange={(value) => {
                        const selectedPlan = assignedPlans.find((p) => p.id === value);
                        setFormData({
                          ...formData,
                          plan_id: value,
                          monthly_bill: selectedPlan ? String(selectedPlan.price) : formData.monthly_bill,
                        });
                      }}
                    >
                      <SelectTrigger className="bg-secondary border-border">
                        <SelectValue placeholder="Select plan" />
                      </SelectTrigger>
                      <SelectContent>
                        {assignedPlans.length === 0 ? (
                          <SelectItem value="no-plans" disabled>
                            No plans assigned - contact admin
                          </SelectItem>
                        ) : (
                          assignedPlans.map((plan) => (
                            <SelectItem key={plan.id} value={plan.id}>
                              {plan.name} - ৳{plan.price}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <Button variant="outline" className="border-border" onClick={() => navigate("/reseller/users")}>
                Cancel
              </Button>
              <Button
                className="bg-gradient-primary text-primary-foreground"
                onClick={handleCreateUser}
                disabled={isCreating || !formData.username || !formData.password || !formData.service_type}
              >
                {isCreating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                <UserPlus className="w-4 h-4 mr-2" />
                Create User
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="bulk">
          <ResellerBulkUserImport resellerId={reseller.id} resellerName={reseller.name} />
        </TabsContent>
      </Tabs>
    </ResellerLayout>
  );
}
