import { useState, useCallback } from "react";
import { readExcelFile, writeExcelFile } from "@/lib/excelUtils";
import { useCreateRadiusUser } from "@/hooks/useRadiusUsers";
import { useBillingPlans } from "@/hooks/useBillingPlans";
import { useDistricts } from "@/hooks/useDistricts";
import { usePoliceStations } from "@/hooks/usePoliceStations";
import { useAreas } from "@/hooks/useAreas";
import { useMikrotikRouters } from "@/hooks/useMikrotikRouters";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileSpreadsheet, Download, Loader2, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ImportedUser {
  // Phone is used as username & password
  phone: string;
  full_name?: string;
  father_name?: string;
  nid_number?: string;
  gender?: string;
  // Billing Address
  district?: string;
  police_station?: string;
  area?: string;
  address_details?: string;
  // MikroTik Configuration
  mikrotik_router?: string;
  // Billing Information
  plan?: string;
  monthly_bill?: number;
  // Status tracking
  status?: "pending" | "success" | "error";
  error?: string;
}

export function BulkUserImport() {
  const { toast } = useToast();
  const createUser = useCreateRadiusUser();
  const { data: plans = [] } = useBillingPlans();
  const { data: districts = [] } = useDistricts();
  const { data: policeStations = [] } = usePoliceStations();
  const { data: areas = [] } = useAreas();
  const { data: routers = [] } = useMikrotikRouters();

  const [importedUsers, setImportedUsers] = useState<ImportedUser[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);

  // Default expire date: today + 1 month at 9:00 AM
  const getDefaultExpireDate = () => {
    const date = new Date();
    date.setMonth(date.getMonth() + 1);
    date.setHours(9, 0, 0, 0);
    return date;
  };

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const buffer = e.target?.result as ArrayBuffer;
        const jsonData = await readExcelFile(buffer);

        const users: ImportedUser[] = jsonData.map((row: any) => ({
          phone: String(row.phone || row.mobile || row.mobile_number || "").trim(),
          full_name: row.full_name || row.customer_name || row.name || undefined,
          father_name: row.father_name || undefined,
          nid_number: row.nid_number || row.nid || undefined,
          gender: row.gender?.toLowerCase() || undefined,
          district: row.district || undefined,
          police_station: row.police_station || undefined,
          area: row.area || undefined,
          address_details: row.address_details || row.address || undefined,
          mikrotik_router: row.mikrotik_router || row.router || undefined,
          plan: row.plan || row.plan_name || undefined,
          monthly_bill: parseFloat(row.monthly_bill) || 0,
          status: "pending",
        }));

        // Validate required fields
        const validatedUsers = users.map((user) => {
          if (!user.phone) {
            return { ...user, status: "error" as const, error: "Mobile number is required (used as User ID & Password)" };
          }
          return user;
        });

        setImportedUsers(validatedUsers);
        toast({
          title: "File Loaded",
          description: `Found ${validatedUsers.length} users in the Excel file.`,
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to parse Excel file. Please check the format.",
          variant: "destructive",
        });
      }
    };
    reader.readAsArrayBuffer(file);
    event.target.value = "";
  }, [toast]);

  const handleImportAll = async () => {
    const pendingUsers = importedUsers.filter((u) => u.status === "pending");
    if (pendingUsers.length === 0) {
      toast({
        title: "No Users to Import",
        description: "All users have already been processed.",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);
    setImportProgress(0);

    let successCount = 0;
    let errorCount = 0;
    const now = new Date();
    const expireDate = getDefaultExpireDate();

    for (let i = 0; i < importedUsers.length; i++) {
      const user = importedUsers[i];
      if (user.status !== "pending") continue;

      try {
        const districtMatch = districts.find(d => 
          d.name.toLowerCase() === user.district?.toLowerCase() || 
          d.code?.toLowerCase() === user.district?.toLowerCase()
        );
        const policeStationMatch = policeStations.find(ps => 
          ps.name.toLowerCase() === user.police_station?.toLowerCase() || 
          ps.code?.toLowerCase() === user.police_station?.toLowerCase()
        );
        const areaMatch = areas.find(a => 
          a.name.toLowerCase() === user.area?.toLowerCase() || 
          a.code?.toLowerCase() === user.area?.toLowerCase()
        );
        const routerMatch = routers.find(r => 
          r.name.toLowerCase() === user.mikrotik_router?.toLowerCase()
        );
        const planMatch = plans.find(p => 
          p.name.toLowerCase() === user.plan?.toLowerCase()
        );

        await createUser.mutateAsync({
          username: user.phone,
          password_hash: user.phone,
          service_type: "hotspot",
          full_name: user.full_name || null,
          father_name: user.father_name || null,
          phone: user.phone || null,
          nid_number: user.nid_number || null,
          gender: user.gender || null,
          district_id: districtMatch?.id || null,
          police_station_id: policeStationMatch?.id || null,
          area_id: areaMatch?.id || null,
          customer_type: "student",
          address_details: user.address_details || null,
          connectivity_type: "shared",
          reseller_office: "Main-User",
          mikrotik_router_id: routerMatch?.id || null,
          connection_date: now.toISOString(),
          expires_at: expireDate.toISOString(),
          plan_id: planMatch?.id || null,
          monthly_bill: planMatch ? planMatch.price : (user.monthly_bill || 0),
          connection_fee: 0,
          billing_type: "prepaid",
          billing_cycle: "monthly",
        });

        setImportedUsers((prev) =>
          prev.map((u, idx) => (idx === i ? { ...u, status: "success" } : u))
        );
        successCount++;
      } catch (error: any) {
        setImportedUsers((prev) =>
          prev.map((u, idx) =>
            idx === i ? { ...u, status: "error", error: error.message || "Failed to create user" } : u
          )
        );
        errorCount++;
      }

      setImportProgress(((i + 1) / importedUsers.length) * 100);
    }

    setIsImporting(false);
    toast({
      title: "Import Complete",
      description: `Successfully imported ${successCount} users. ${errorCount} failed.`,
      variant: errorCount > 0 ? "destructive" : "default",
    });
  };

  const downloadTemplate = async () => {
    const template = [
      {
        phone: "01712345678",
        full_name: "John Doe",
        father_name: "Richard Doe",
        nid_number: "1234567890",
        gender: "male",
        district: "Mymensingh",
        police_station: "Mymensingh Sadar",
        area: "Road 27",
        address_details: "123 Main Street",
        mikrotik_router: "Main Router",
        plan: "Home Fiber 20",
        monthly_bill: 1000,
      },
    ];

    await writeExcelFile(template, "user_import_template.xlsx", "Users");
  };

  const clearImport = () => {
    setImportedUsers([]);
    setImportProgress(0);
  };

  const getStatusBadge = (user: ImportedUser) => {
    switch (user.status) {
      case "success":
        return (
          <Badge variant="default" className="bg-green-500/20 text-green-400 border-green-500/30">
            <CheckCircle className="w-3 h-3 mr-1" /> Success
          </Badge>
        );
      case "error":
        return (
          <Badge variant="destructive" className="bg-red-500/20 text-red-400 border-red-500/30">
            <XCircle className="w-3 h-3 mr-1" /> {user.error || "Error"}
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
            <AlertCircle className="w-3 h-3 mr-1" /> Pending
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileSpreadsheet className="w-5 h-5 text-primary" />
            Bulk User Import from Excel
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
            <div className="flex-1">
              <label
                htmlFor="excel-upload"
                className="flex items-center justify-center gap-2 p-6 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 hover:bg-secondary/50 transition-colors"
              >
                <Upload className="w-6 h-6 text-muted-foreground" />
                <span className="text-muted-foreground">
                  Click to upload Excel file (.xlsx, .xls)
                </span>
                <input
                  id="excel-upload"
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
            <Button variant="outline" onClick={downloadTemplate} className="shrink-0">
              <Download className="w-4 h-4 mr-2" />
              Download Template
            </Button>
          </div>

          <div className="mt-4 text-sm text-muted-foreground">
            <p className="font-medium mb-2">Required column:</p>
            <ul className="list-disc list-inside space-y-1">
              <li><code className="bg-secondary px-1 rounded">phone</code> - Mobile number (used as User ID & Password)</li>
            </ul>
            <p className="mt-2 font-medium mb-2">Optional columns:</p>
            <ul className="list-disc list-inside space-y-1">
              <li><strong>Personal:</strong> <code className="bg-secondary px-1 rounded">full_name</code>, <code className="bg-secondary px-1 rounded">father_name</code>, <code className="bg-secondary px-1 rounded">nid_number</code>, <code className="bg-secondary px-1 rounded">gender</code></li>
              <li><strong>Address:</strong> <code className="bg-secondary px-1 rounded">district</code>, <code className="bg-secondary px-1 rounded">police_station</code>, <code className="bg-secondary px-1 rounded">area</code>, <code className="bg-secondary px-1 rounded">address_details</code></li>
              <li><strong>MikroTik:</strong> <code className="bg-secondary px-1 rounded">mikrotik_router</code></li>
              <li><strong>Billing:</strong> <code className="bg-secondary px-1 rounded">plan</code>, <code className="bg-secondary px-1 rounded">monthly_bill</code></li>
            </ul>
            <p className="mt-2 text-xs text-muted-foreground">
              Fixed values: Service=Hotspot, Connection Type=Wireless, Connectivity=Shared, Client Type=Student, Connection Fee=0, Billing Type=Prepaid
            </p>
          </div>
        </CardContent>
      </Card>

      {importedUsers.length > 0 && (
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">
              Preview ({importedUsers.length} users)
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" onClick={clearImport} disabled={isImporting}>
                Clear
              </Button>
              <Button
                onClick={handleImportAll}
                disabled={isImporting || importedUsers.every((u) => u.status !== "pending")}
                className="bg-gradient-primary"
              >
                {isImporting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Importing ({Math.round(importProgress)}%)
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Import All
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Phone (User ID)</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Monthly Bill</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {importedUsers.map((user, index) => (
                    <TableRow key={index}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell className="font-medium">{user.phone}</TableCell>
                      <TableCell>{user.full_name || "-"}</TableCell>
                      <TableCell>{user.plan || "-"}</TableCell>
                      <TableCell>৳{user.monthly_bill || 0}</TableCell>
                      <TableCell>{getStatusBadge(user)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
