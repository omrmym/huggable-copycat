import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Wifi, Mail, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export default function Login() {
  const [isLoading, setIsLoading] = useState(false);
  const [loginMethod, setLoginMethod] = useState<'email' | 'userid'>('email');
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const password = formData.get('password') as string;
    let email = '';

    if (loginMethod === 'email') {
      email = formData.get('email') as string;
    } else {
      const loginUserId = formData.get('userid') as string;
      
      // If user entered an email in the User ID field, use it directly
      if (loginUserId.includes('@')) {
        email = loginUserId;
      } else {
        // Use edge function for secure login lookup (no public RLS needed)
        const { data: lookupData, error: lookupError } = await supabase.functions.invoke('login-lookup', {
          body: { login_user_id: loginUserId },
        });

        if (lookupError || !lookupData?.success) {
          toast({
            title: 'Login Failed',
            description: 'User ID not found or account is inactive.',
            variant: 'destructive',
          });
          setIsLoading(false);
          return;
        }

        email = lookupData.email;
      }
    }

    const { error } = await signIn(email, password, loginMethod);

    if (error) {
      toast({
        title: 'Login Failed',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Welcome back!',
        description: 'You have successfully logged in.',
      });
      navigate('/');
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="flex items-center gap-2 text-primary">
              <Wifi className="h-8 w-8" />
              <span className="text-2xl font-bold">RadiusBuddy</span>
            </div>
          </div>
          <CardTitle>Admin Portal</CardTitle>
          <CardDescription>
            Sign in to manage your hotspot and billing system
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="flex gap-2 p-1 bg-muted rounded-lg">
              <Button
                type="button"
                variant={loginMethod === 'email' ? 'default' : 'ghost'}
                size="sm"
                className="flex-1"
                onClick={() => setLoginMethod('email')}
              >
                <Mail className="w-4 h-4 mr-2" />
                Email
              </Button>
              <Button
                type="button"
                variant={loginMethod === 'userid' ? 'default' : 'ghost'}
                size="sm"
                className="flex-1"
                onClick={() => setLoginMethod('userid')}
              >
                <User className="w-4 h-4 mr-2" />
                User ID
              </Button>
            </div>

            {loginMethod === 'email' ? (
              <div className="space-y-2">
                <Label htmlFor="signin-email">Email</Label>
                <Input
                  id="signin-email"
                  name="email"
                  type="email"
                  placeholder="admin@example.com"
                  required
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="signin-userid">User ID</Label>
                <Input
                  id="signin-userid"
                  name="userid"
                  type="text"
                  placeholder="Enter your User ID"
                  required
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="signin-password">Password</Label>
              <Input
                id="signin-password"
                name="password"
                type="password"
                placeholder="••••••••"
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <a href="/request" className="inline-flex items-center gap-2 text-sm text-primary hover:underline font-medium">
              New Connection Request →
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
