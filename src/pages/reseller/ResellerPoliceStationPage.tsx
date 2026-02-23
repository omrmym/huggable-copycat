import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useResellerAuth } from '@/contexts/ResellerAuthContext';
import { ResellerLayout } from '@/components/reseller/ResellerLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { usePoliceStations } from '@/hooks/usePoliceStations';

export default function ResellerPoliceStationPage() {
  const { reseller, isLoading: authLoading } = useResellerAuth();
  const navigate = useNavigate();
  const { data: stations = [], isLoading } = usePoliceStations();

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
    <ResellerLayout title="Police Station" subtitle="View police station assignments">
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            Police Stations
          </CardTitle>
          <CardDescription>
            View available police station coverage areas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : stations.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No police stations defined yet.</p>
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
                  {stations.map((station) => (
                    <tr key={station.id} className="border-b border-border hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium">{station.name}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          station.is_active ? 'bg-online/20 text-online' : 'bg-muted text-muted-foreground'
                        }`}>
                          {station.is_active ? 'Active' : 'Inactive'}
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
