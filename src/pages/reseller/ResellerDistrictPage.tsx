import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useResellerAuth } from '@/contexts/ResellerAuthContext';
import { ResellerLayout } from '@/components/reseller/ResellerLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Map, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useDistricts } from '@/hooks/useDistricts';

export default function ResellerDistrictPage() {
  const { reseller, isLoading: authLoading } = useResellerAuth();
  const navigate = useNavigate();
  const { data: districts = [], isLoading } = useDistricts();

  useEffect(() => {
    if (!authLoading && !reseller) {
      navigate('/reseller/login', { replace: true });
    }
  }, [reseller, authLoading, navigate]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!reseller) return null;

  return (
    <ResellerLayout title="District" subtitle="View district assignments">
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Map className="w-5 h-5 text-primary" />
            Districts
          </CardTitle>
          <CardDescription>
            View available district coverage areas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : districts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Map className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No districts defined yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Name</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {districts.map((district) => (
                    <tr key={district.id} className="border-b border-border hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium">{district.name}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          district.is_active ? 'bg-online/20 text-online' : 'bg-muted text-muted-foreground'
                        }`}>
                          {district.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </ResellerLayout>
  );
}
