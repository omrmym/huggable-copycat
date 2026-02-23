import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useCustomerAuth } from '@/contexts/CustomerAuthContext';
import { Loader2, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function CustomerAutoLogin() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { autoLogin } = useCustomerAuth();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setError('Invalid link');
      setIsLoading(false);
      return;
    }

    const performAutoLogin = async () => {
      try {
        const { data, error: fnError } = await supabase.functions.invoke('customer-auto-login', {
          body: { userId },
        });

        if (fnError || !data?.success) {
          setError(data?.error || 'Failed to authenticate. This link may be invalid.');
          setIsLoading(false);
          return;
        }

        autoLogin(data.user);
        navigate('/portal', { replace: true });
      } catch {
        setError('An unexpected error occurred');
        setIsLoading(false);
      }
    };

    performAutoLogin();
  }, [userId, navigate, autoLogin]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Signing you in...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardContent className="pt-6 text-center">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2">Access Failed</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => navigate('/portal/login')}>
            Go to Login Page
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
