import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useCreateRadiusUser } from "@/hooks/useRadiusUsers";
import { useBillingPlans } from "@/hooks/useBillingPlans";
import { useDistricts } from "@/hooks/useDistricts";
import { usePoliceStations } from "@/hooks/usePoliceStations";
import { useAreas } from "@/hooks/useAreas";
import { useMikrotikRouters } from "@/hooks/useMikrotikRouters";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, UserPlus, User, MapPin, Router, Receipt, Wifi, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BulkUserImport } from "@/components/users/BulkUserImport";

export default function CreateUserPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: plans = [] } = useBillingPlans();
  const { data: districts = [] } = useDistricts();
  const { data: policeStations = [] } = usePoliceStations();
  const { data: areas = [] } = useAreas();
  const { data: routers = [] } = useMikrotikRouters();
  const createUser = useCreateRadiusUser();

  // reseller_office will be set to "Main-User" for admin panel users

  // Default IDs for location
  const DEFAULT_DISTRICT_ID = "fa8c6591-13d1-4369-8f99-2acbb567f247"; // Mymensingh
  const DEFAULT_POLICE_STATION_ID = "69ca6f19-d373-420c-a098-e638fca8d844"; // Mymensingh Sadar

  // Default expire date: today at 9:00 AM
  const getDefaultExpireDate = () => {
    const today = new Date();
    today.setHours(9, 0, 0, 0);
    return today;
  };

  const [formData, setFormData] = useState({
    // Personal Information
    full_name: "",
    father_name: "",
    nid_number: "",
    phone: "",
    gender: "male", // Default: Male

    // Billing Address
    district_id: DEFAULT_DISTRICT_ID, // Default: Mymensingh
    police_station_id: DEFAULT_POLICE_STATION_ID, // Default: Mymensingh Sadar
    area_id: "",
    customer_type: "student", // Default: Student
    address_details: "",

    // Mikrotik
    mikrotik_router_id: "",
    username: "",
    password: "",
    connection_date: new Date(), // Default: Running Date (current date)
    expires_at: getDefaultExpireDate() as Date | null, // Default: Running Date at 9:00 AM

    // Bill
    monthly_bill: "",
    connection_fee: "0", // Default: 0
    billing_type: "prepaid", // Fixed default
    plan_id: "",

    // Connectivity Details
    connection_type: "wireless", // Fixed: Wireless
    connectivity_type: "shared", // Fixed: Shared
    service_type: "hotspot" as "hotspot", // Hotspot only
  });

  // Calculate expiration date based on plan duration
  const calculateExpirationDate = (connectionDate: Date): Date => {
    const expireDate = new Date(connectionDate);
    // Monthly: same day next month at 9:00 AM
    expireDate.setMonth(expireDate.getMonth() + 1);
    expireDate.setHours(9, 0, 0, 0);
    return expireDate;
  };

  const handleConnectionDateChange = (date: Date) => {
    const newExpireDate = calculateExpirationDate(date);
    setFormData({ ...formData, connection_date: date, expires_at: newExpireDate });
  };

  // All active locations are shown independently (no cascading)

  // Calculate total amount
  const totalAmount = (parseFloat(formData.monthly_bill) || 0) + (parseFloat(formData.connection_fee) || 0);

  // Auto-set username and password to phone number
  const effectiveUsername = formData.phone;
  const effectivePassword = formData.phone;

  const handleCreateUser = async () => {
    const requiredFields = [
      { field: formData.full_name, name: 'Customer Name' },
      { field: formData.phone, name: 'Mobile Number' },
      { field: formData.district_id, name: 'District' },
      { field: formData.police_station_id, name: 'Police Station' },
      { field: formData.area_id, name: 'Area' },
      { field: formData.address_details, name: 'Address Details' },
      { field: formData.mikrotik_router_id, name: 'Select MikroTik' },
      { field: formData.plan_id, name: 'Plan' },
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

    if (!formData.phone) {
      toast({
        title: "Validation Error",
        description: "Mobile number is required (used as User ID & Password).",
        variant: "destructive",
      });
      return;
    }

    try {
      await createUser.mutateAsync({
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
        username: effectiveUsername,
        password_hash: effectivePassword,
        connection_date: formData.connection_date?.toISOString() || null,
        expires_at: formData.expires_at?.toISOString() || null,
        monthly_bill: parseFloat(formData.monthly_bill) || 0,
        connection_fee: parseFloat(formData.connection_fee) || 0,
        billing_type: formData.billing_type || null,
        billing_cycle: 'monthly',
        plan_id: formData.plan_id || null,
        connectivity_type: formData.connectivity_type || null,
        reseller_office: "Main-User",
        service_type: "hotspot",
      });

      toast({
        title: "User Created",
        description: `User ${formData.username} has been created successfully.`,
      });

      navigate("/users");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create user. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <DashboardLayout title="Create User" subtitle="Add a new Hotspot user">
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
                  required
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
                  required
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
              <div className="space-y-2">
                <Label>Client Type</Label>
                <Select
                  value={formData.customer_type}
                  onValueChange={(value) => setFormData({ ...formData, customer_type: value })}
                >
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue placeholder="Select client type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="home">Home</SelectItem>
                    <SelectItem value="corporate">Corporate</SelectItem>
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
                  required
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
                  required
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
                  required
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
              <div className="space-y-2 md:col-span-2">
                <Label>Address Details *</Label>
                <Textarea
                  placeholder="Enter full address details"
                  className="bg-secondary border-border"
                  value={formData.address_details}
                  onChange={(e) => setFormData({ ...formData, address_details: e.target.value })}
                  required
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Service Type</Label>
                <Input
                  className="bg-muted border-border cursor-not-allowed"
                  value="Hotspot"
                  disabled
                  readOnly
                />
              </div>
              <div className="space-y-2">
                <Label>Connection Type</Label>
                <Input
                  className="bg-muted border-border cursor-not-allowed"
                  value="Wireless"
                  disabled
                  readOnly
                />
              </div>
              <div className="space-y-2">
                <Label>Connectivity Type</Label>
                <Input
                  className="bg-muted border-border cursor-not-allowed"
                  value="Shared"
                  disabled
                  readOnly
                />
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
                  required
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
                <Label>User ID (Mobile Number)</Label>
                <Input
                  className="bg-muted border-border cursor-not-allowed"
                  value={formData.phone || '(Enter mobile number above)'}
                  disabled
                  readOnly
                />
              </div>
              <div className="space-y-2">
                <Label>Password (Mobile Number)</Label>
                <Input
                  className="bg-muted border-border cursor-not-allowed"
                  value={formData.phone || '(Enter mobile number above)'}
                  disabled
                  readOnly
                />
              </div>
              <div className="space-y-2">
                <Label>Connection Date</Label>
                <Input
                  className="bg-muted border-border cursor-not-allowed"
                  value={formData.connection_date ? format(formData.connection_date, "PPP") : ""}
                  disabled
                  readOnly
                />
              </div>
              <div className="space-y-2">
                <Label>Expire Date</Label>
                <Input
                  className="bg-muted border-border cursor-not-allowed"
                  value={formData.expires_at ? format(formData.expires_at, "PPP") : ""}
                  disabled
                  readOnly
                />
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
                <Label>Billing Type</Label>
                <Input
                  className="bg-muted border-border cursor-not-allowed"
                  value="Prepaid"
                  disabled
                  readOnly
                />
              </div>
              <div className="space-y-2">
                <Label>Plan *</Label>
                <Select
                  value={formData.plan_id}
                  onValueChange={(value) => {
                    const selectedPlan = plans.find((p) => p.id === value);
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
                    {plans
                      .filter((plan) => !formData.service_type || plan.service_type === formData.service_type)
                      .map((plan) => (
                        <SelectItem key={plan.id} value={plan.id}>
                          {plan.name} - ৳{plan.price}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button variant="outline" className="border-border" onClick={() => navigate("/users")}>
            Cancel
          </Button>
          <Button
            className="bg-gradient-primary text-primary-foreground"
            onClick={handleCreateUser}
            disabled={createUser.isPending || !formData.phone}
          >
            {createUser.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            <UserPlus className="w-4 h-4 mr-2" />
            Create User
          </Button>
        </div>
          </div>
        </TabsContent>

        <TabsContent value="bulk">
          <BulkUserImport />
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
