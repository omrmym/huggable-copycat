import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useResellerAuth } from '@/contexts/ResellerAuthContext';
import { ResellerLayout } from '@/components/reseller/ResellerLayout';
import { ResellerBranches } from '@/components/reseller/ResellerBranches';
import { Loader2 } from 'lucide-react';

export default function ResellerBranchesPage() {
  const { reseller, isLoading } = useResellerAuth();
  const navigate = useNavigate();

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
    <ResellerLayout title="My Branches" subtitle="View your branch offices">
      <ResellerBranches resellerId={reseller.id} />
    </ResellerLayout>
  );
}
