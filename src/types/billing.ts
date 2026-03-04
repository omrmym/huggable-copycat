export type UserStatus = 'online' | 'offline' | 'expired' | 'suspended';
export type ServiceType = 'hotspot' | 'pppoe';
export type PlanType = 'voucher' | 'monthly';

export interface User {
  id: string;
  username: string;
  fullName: string;
  email: string;
  phone: string;
  serviceType: ServiceType;
  planId: string;
  status: UserStatus;
  dataUsed: number; // in MB
  dataLimit: number | null; // null = unlimited
  expiresAt: string | null;
  createdAt: string;
  lastLogin: string | null;
  macAddress?: string;
  ipAddress?: string;
}

export interface Plan {
  id: string;
  name: string;
  description: string;
  type: PlanType;
  serviceType: ServiceType;
  price: number;
  duration: number; // in days for vouchers, months for subscriptions
  dataLimit: number | null; // in MB, null = unlimited
  speedLimit: {
    download: number; // in Mbps
    upload: number; // in Mbps
  };
  isActive: boolean;
}

export interface Voucher {
  id: string;
  code: string;
  planId: string;
  status: 'unused' | 'active' | 'expired' | 'used';
  createdAt: string;
  activatedAt: string | null;
  expiresAt: string | null;
  usedBy: string | null;
}

export interface Transaction {
  id: string;
  userId: string;
  type: 'payment' | 'renewal' | 'voucher_activation' | 'refund';
  amount: number;
  description: string;
  createdAt: string;
  status: 'completed' | 'pending' | 'failed';
}

export interface DashboardStats {
  totalUsers: number;
  onlineUsers: number;
  activeVouchers: number;
  monthlyRevenue: number;
  totalDataUsed: number;
  newUsersToday: number;
}
