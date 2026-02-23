import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useResellerAuth } from '@/contexts/ResellerAuthContext';
import { ResellerLayout } from '@/components/reseller/ResellerLayout';
import { ResellerUserList } from '@/components/reseller/ResellerUserList';
import { Loader2 } from 'lucide-react';

export default function ResellerUsersPage() {
  const { reseller, isLoading } = useResellerAuth();
  const navigate = useNavigate();

  const isSuperAdmin = reseller?.is_super_admin || false;

  useEffect(() => {
    if (!isLoading && !reseller) {
      navigate('/reseller/login', { replace: true });
    }
  }, [reseller, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!reseller) return null;

  return (
    <ResellerLayout 
      title={isSuperAdmin ? "All Reseller Users" : "My Users"} 
      subtitle={isSuperAdmin ? "View and manage all reseller users" : "Manage and recharge your assigned users"}
    >
      <ResellerUserList resellerId={reseller.id} isSuperAdmin={isSuperAdmin} />
    </ResellerLayout>
  );
}
