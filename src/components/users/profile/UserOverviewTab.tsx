import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MacLockControl } from './MacLockControl';
import { useHasPermission } from '@/hooks/useHasPermission';
import { useUserBandwidth } from '@/hooks/useUserBandwidth';
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  CreditCard, 
  Router 
} from 'lucide-react';

interface UserOverviewTabProps {
  user: {
    id: string;
    username: string;
    full_name: string | null;
    father_name: string | null;
    gender: string | null;
    nid_number: string | null;
    customer_type: string | null;
    phone: string | null;
    email: string | null;
    plan_id: string | null;
    billing_type: string | null;
    monthly_bill: number | null;
    connection_fee: number | null;
    expires_at: string | null;
    district_id: string | null;
    police_station_id: string | null;
    area_id: string | null;
    address_details: string | null;
    service_type: 'hotspot' | 'pppoe';
    connectivity_type: string | null;
    ip_address: string | null;
    mac_address: string | null;
    mac_locked: boolean;
    mikrotik_router_id: string | null;
    mikrotik_synced: boolean;
    connection_date: string | null;
  };
  getPlanName: (planId: string | null) => string;
  getAreaName: (areaId: string | null) => string;
  getDistrictName: (districtId: string | null) => string;
  getPoliceStationName: (psId: string | null) => string;
  getRouterName: (routerId: string | null) => string;
}

export function UserOverviewTab({
  user,
  getPlanName,
  getAreaName,
  getDistrictName,
  getPoliceStationName,
  getRouterName,
}: UserOverviewTabProps) {
  // Fetch bandwidth data to get detected MAC from active session
  const { data: bandwidthData } = useUserBandwidth(
    user.id,
    user.username,
    user.service_type,
    user.mikrotik_router_id
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <InfoRow label="Full Name" value={user.full_name || '-'} />
          <InfoRow label="Father's Name" value={user.father_name || '-'} />
          <InfoRow label="Gender" value={user.gender || '-'} />
          <InfoRow label="NID Number" value={user.nid_number || '-'} />
          <InfoRow label="Customer Type" value={user.customer_type || '-'} />
          <InfoRow 
            label="Phone" 
            value={user.phone || '-'} 
            icon={<Phone className="w-4 h-4" />} 
          />
          <InfoRow 
            label="Email" 
            value={user.email || '-'} 
            icon={<Mail className="w-4 h-4" />} 
          />
        </CardContent>
      </Card>

      {/* Billing Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Billing Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <InfoRow label="Plan" value={getPlanName(user.plan_id)} />
          <InfoRow label="Billing Type" value={user.billing_type || '-'} />
          <InfoRow label="Monthly Bill" value={`৳${user.monthly_bill?.toLocaleString() || 0}`} />
          <InfoRow label="Connection Fee" value={`৳${user.connection_fee?.toLocaleString() || 0}`} />
          <InfoRow 
            label="Expires At" 
            value={user.expires_at ? new Date(user.expires_at).toLocaleDateString() : '-'} 
          />
        </CardContent>
      </Card>

      {/* Address Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Address Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <InfoRow label="District" value={getDistrictName(user.district_id)} />
          <InfoRow label="Police Station" value={getPoliceStationName(user.police_station_id)} />
          <InfoRow label="Area" value={getAreaName(user.area_id)} />
          <InfoRow label="Address Details" value={user.address_details || '-'} />
        </CardContent>
      </Card>

      {/* Connection Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Router className="w-5 h-5" />
            Connection Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <InfoRow label="Service Type" value={user.service_type} />
          <InfoRow label="Connectivity Type" value={user.connectivity_type || '-'} />
          <InfoRow label="IP Address" value={user.ip_address || '-'} />
          <InfoRow label="MAC Address" value={user.mac_address || '-'} />
          <InfoRow label="Router" value={getRouterName(user.mikrotik_router_id)} />
          <InfoRow 
            label="MikroTik Synced" 
            value={user.mikrotik_synced ? 'Yes' : 'No'}
            valueClassName={user.mikrotik_synced ? 'text-primary' : 'text-muted-foreground'}
          />
          <InfoRow 
            label="Connection Date" 
            value={user.connection_date ? new Date(user.connection_date).toLocaleDateString() : '-'} 
          />
        </CardContent>
      </Card>

      {/* MAC Lock Control - permission gated */}
      {(() => {
        const { hasPermission: hasPerm } = useHasPermission();
        if (!hasPerm('users.profile.mac_lock')) return null;
        return (
          <MacLockControl
            userId={user.id}
            username={user.username}
            macAddress={user.mac_address}
            macLocked={user.mac_locked}
            serviceType={user.service_type}
            routerId={user.mikrotik_router_id}
            detectedMac={bandwidthData?.callerId}
            isOnline={bandwidthData?.isOnline}
          />
        );
      })()}
    </div>
  );
}

interface InfoRowProps {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  valueClassName?: string;
}

function InfoRow({ label, value, icon, valueClassName = '' }: InfoRowProps) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={`text-sm font-medium flex items-center gap-2 ${valueClassName}`}>
        {icon}
        {value}
      </span>
    </div>
  );
}
