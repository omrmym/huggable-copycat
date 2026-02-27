import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, UserPlus, User, MapPin, Router, Receipt, Wifi, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

export default function UserRequestPage() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Fetch request success note from app_settings
  const { data: successNoteSettings } = useQuery({
    queryKey: ['app-settings', 'request_success_note'],
    queryFn: async () => {
      const { data } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'request_success_note')
        .maybeSingle();
      return data?.value as { title?: string; message?: string; note?: string } | null;
    },
  });

  const successTitle = successNoteSettings?.title || "Request Submitted!";
  const successMessage = successNoteSettings?.message || "Your connection request has been submitted successfully. An admin will review and approve your request soon.";
  const successNote = successNoteSettings?.note || "Note: Requests not approved within 48 hours will be automatically removed.";

  // Fetch reference data (public access via RLS)
  const { data: plans = [] } = useQuery({
    queryKey: ['public-plans'],
    queryFn: async () => {
      const { data } = await supabase.from('billing_plans').select('*').eq('is_active', true).eq('service_type', 'hotspot');
      return data || [];
    },
  });

  const { data: districts = [] } = useQuery({
    queryKey: ['public-districts'],
    queryFn: async () => {
      const { data } = await supabase.from('districts').select('*').eq('is_active', true);
      return data || [];
    },
  });

  const { data: policeStations = [] } = useQuery({
    queryKey: ['public-police-stations'],
    queryFn: async () => {
      const { data } = await supabase.from('police_stations').select('*').eq('is_active', true);
      return data || [];
    },
  });

  const { data: areas = [] } = useQuery({
    queryKey: ['public-areas'],
    queryFn: async () => {
      const { data } = await supabase.from('areas').select('*').eq('is_active', true);
      return data || [];
    },
  });

  const { data: routers = [] } = useQuery({
    queryKey: ['public-routers'],
    queryFn: async () => {
      const { data } = await supabase.from('mikrotik_routers').select('id, name').eq('is_active', true);
      return data || [];
    },
  });

  const DEFAULT_DISTRICT_ID = "7e03f7da-5d0f-428d-82a6-cfd065a7de4e";
  const DEFAULT_POLICE_STATION_ID = "0d648b93-11bb-4a88-ab14-dc2aee539968";
  const DEFAULT_MIKROTIK_ROUTER_ID = "48563996-0dcb-4ca7-a3d6-d63da4e88909";

  const [formData, setFormData] = useState({
    full_name: "",
    father_name: "",
    nid_number: "",
    phone: "",
    gender: "male",
    district_id: DEFAULT_DISTRICT_ID,
    police_station_id: DEFAULT_POLICE_STATION_ID,
    area_id: "",
    customer_type: "student",
    address_details: "",
    mikrotik_router_id: DEFAULT_MIKROTIK_ROUTER_ID,
    monthly_bill: "",
    connection_fee: "0",
    plan_id: "",
  });

  const totalAmount = (parseFloat(formData.monthly_bill) || 0) + (parseFloat(formData.connection_fee) || 0);

  const handleSubmit = async () => {
    const requiredFields = [
      { field: formData.full_name, name: 'Customer Name' },
      { field: formData.phone, name: 'Mobile Number' },
      { field: formData.district_id, name: 'District' },
      { field: formData.police_station_id, name: 'Police Station' },
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

    setIsSubmitting(true);

    try {
      // Check if username (phone) already exists in radius_users
      const { data: existingUser } = await supabase
        .from('radius_users')
        .select('id, username')
        .eq('username', formData.phone)
        .maybeSingle();

      if (existingUser) {
        toast({
          title: "Request Rejected",
          description: `A user with this number (${formData.phone}) already exists in the panel. New request cannot be submitted.`,
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      // Check if a pending request already exists for this phone
      const { data: existingRequests } = await supabase
        .from('user_requests')
        .select('id')
        .eq('mikrotik_username', formData.phone)
        .eq('status', 'pending')
        .limit(1);

      if (existingRequests && existingRequests.length > 0) {
        toast({
          title: "Request Rejected",
          description: `A pending request for this number (${formData.phone}) already exists.`,
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      // Insert request into database
      const { error } = await supabase.from('user_requests').insert({
        full_name: formData.full_name,
        father_name: formData.father_name || null,
        nid_number: formData.nid_number || null,
        phone: formData.phone,
        gender: formData.gender,
        customer_type: formData.customer_type,
        district_id: formData.district_id || null,
        police_station_id: formData.police_station_id || null,
        area_id: formData.area_id || null,
        address_details: formData.address_details || null,
        plan_id: formData.plan_id || null,
        mikrotik_router_id: formData.mikrotik_router_id || null,
        monthly_bill: parseFloat(formData.monthly_bill) || 0,
        connection_fee: parseFloat(formData.connection_fee) || 0,
        mikrotik_username: formData.phone,
        status: 'pending',
      } as any);

      if (error) throw error;

      // Create disabled user in MikroTik via edge function (public call with anon key)
      const selectedPlan = plans.find((p: any) => p.id === formData.plan_id);
      try {
        await supabase.functions.invoke('request-mikrotik', {
          body: {
            action: 'create-disabled',
            username: formData.phone,
            password: formData.phone,
            mikrotik_router_id: formData.mikrotik_router_id,
            profile: selectedPlan?.name || undefined,
          },
        });
      } catch (syncError) {
        console.warn('MikroTik disabled user creation failed:', syncError);
      }

      setIsSubmitted(true);
      toast({
        title: "Request Submitted!",
        description: "Your connection request has been submitted. Please wait for admin approval.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-8 pb-8 space-y-4">
            <div className="mx-auto w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold">{successTitle}</h2>
            <p className="text-muted-foreground">
              {successMessage}
            </p>
            <p className="text-sm text-muted-foreground">
              {successNote}
            </p>
            <Button onClick={() => { setIsSubmitted(false); setFormData({ full_name: "", father_name: "", nid_number: "", phone: "", gender: "male", district_id: DEFAULT_DISTRICT_ID, police_station_id: DEFAULT_POLICE_STATION_ID, area_id: "", customer_type: "student", address_details: "", mikrotik_router_id: DEFAULT_MIKROTIK_ROUTER_ID, monthly_bill: "", connection_fee: "0", plan_id: "" }); }} variant="outline">
              Submit Another Request
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center py-6">
          <h1 className="text-3xl font-bold text-foreground">New Connection Request</h1>
          <p className="text-muted-foreground mt-2">Fill in your details to request a new internet connection</p>
        </div>

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
                <Input placeholder="Enter customer name" className="bg-secondary border-border" value={formData.full_name} onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Father Name</Label>
                <Input placeholder="Enter father name" className="bg-secondary border-border" value={formData.father_name} onChange={(e) => setFormData({ ...formData, father_name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>NID Number</Label>
                <Input placeholder="Enter NID number" className="bg-secondary border-border" value={formData.nid_number} onChange={(e) => setFormData({ ...formData, nid_number: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Mobile Number *</Label>
                <Input placeholder="+880 1XXX XXXXXX" className="bg-secondary border-border" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Gender</Label>
                <Select value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value })}>
                  <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Select gender" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Client Type</Label>
                <Select value={formData.customer_type} onValueChange={(value) => setFormData({ ...formData, customer_type: value })}>
                  <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Select client type" /></SelectTrigger>
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
                <Select value={formData.district_id} onValueChange={(value) => setFormData({ ...formData, district_id: value })}>
                  <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Select district" /></SelectTrigger>
                  <SelectContent>
                    {districts.map((d) => (<SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Police Station *</Label>
                <Select value={formData.police_station_id} onValueChange={(value) => setFormData({ ...formData, police_station_id: value })}>
                  <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Select police station" /></SelectTrigger>
                  <SelectContent>
                    {policeStations.map((ps) => (<SelectItem key={ps.id} value={ps.id}>{ps.name}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Area</Label>
                <Select value={formData.area_id} onValueChange={(value) => setFormData({ ...formData, area_id: value })}>
                  <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Select area" /></SelectTrigger>
                  <SelectContent>
                    {areas.map((a) => (<SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Address Details *</Label>
                <Textarea placeholder="Enter full address details" className="bg-secondary border-border" value={formData.address_details} onChange={(e) => setFormData({ ...formData, address_details: e.target.value })} required />
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
                <Input className="bg-muted border-border cursor-not-allowed" value="Hotspot" disabled readOnly />
              </div>
              <div className="space-y-2">
                <Label>Connection Type</Label>
                <Input className="bg-muted border-border cursor-not-allowed" value="Wireless" disabled readOnly />
              </div>
              <div className="space-y-2">
                <Label>Connectivity Type</Label>
                <Input className="bg-muted border-border cursor-not-allowed" value="Shared" disabled readOnly />
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
                <Select value={formData.mikrotik_router_id} onValueChange={(value) => setFormData({ ...formData, mikrotik_router_id: value })}>
                  <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Select router" /></SelectTrigger>
                  <SelectContent>
                    {routers.map((r) => (<SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>User ID (Mobile Number)</Label>
                <Input className="bg-muted border-border cursor-not-allowed" value={formData.phone || '(Enter mobile number above)'} disabled readOnly />
              </div>
              <div className="space-y-2">
                <Label>Password (Mobile Number)</Label>
                <Input className="bg-muted border-border cursor-not-allowed" value={formData.phone || '(Enter mobile number above)'} disabled readOnly />
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
                <Input type="number" placeholder="0.00" className="bg-secondary border-border" value={formData.monthly_bill} readOnly disabled />
              </div>
              <div className="space-y-2">
                <Label>Connection Fee (৳)</Label>
                <Input type="number" placeholder="0.00" className="bg-secondary border-border" value={formData.connection_fee} onChange={(e) => setFormData({ ...formData, connection_fee: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Total Amount (৳)</Label>
                <Input type="number" placeholder="0.00" className="bg-secondary border-border" value={totalAmount.toFixed(2)} readOnly />
              </div>
              <div className="space-y-2">
                <Label>Plan *</Label>
                <Select value={formData.plan_id} onValueChange={(value) => {
                  const selectedPlan = plans.find((p) => p.id === value);
                  setFormData({ ...formData, plan_id: value, monthly_bill: selectedPlan ? String(selectedPlan.price) : formData.monthly_bill });
                }}>
                  <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Select plan" /></SelectTrigger>
                  <SelectContent>
                    {plans.map((plan) => (<SelectItem key={plan.id} value={plan.id}>{plan.name} - ৳{plan.price}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-between items-center">
          <div />
          <Button className="bg-gradient-primary text-primary-foreground" onClick={handleSubmit} disabled={isSubmitting || !formData.phone}>
            {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            <UserPlus className="w-4 h-4 mr-2" />
            Submit Request
          </Button>
        </div>
      </div>
    </div>
  );
}
