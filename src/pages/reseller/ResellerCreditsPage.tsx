import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useResellerAuth } from '@/contexts/ResellerAuthContext';
import { ResellerLayout } from '@/components/reseller/ResellerLayout';
import { ResellerCreditHistory } from '@/components/reseller/ResellerCreditHistory';
import { Loader2 } from 'lucide-react';

export default function ResellerCreditsPage() {
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
      title={isSuperAdmin ? "All Credit History" : "Credit History"} 
      subtitle={isSuperAdmin ? "View credit transactions across all resellers" : "View your credit transactions and balance history"}
    >
      <ResellerCreditHistory 
        resellerId={reseller.id} 
        resellerName={reseller.name}
        currentBalance={reseller.balance}
        isSuperAdmin={isSuperAdmin} 
      />
    </ResellerLayout>
  );
}
