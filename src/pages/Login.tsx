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
import { useBrandingSettings } from '@/components/settings/BrandingSettings';
import { Network } from 'lucide-react';
import { GalaxyBackground } from '@/components/auth/GalaxyBackground';

export default function Login() {
  const [isLoading, setIsLoading] = useState(false);
  const [loginMethod, setLoginMethod] = useState<'email' | 'userid'>('email');
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: branding } = useBrandingSettings();

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
      
      if (loginUserId.includes('@')) {
        email = loginUserId;
      } else {
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
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <GalaxyBackground />

      {/* Login card */}
      <Card className="w-full max-w-md backdrop-blur-xl bg-[hsl(240,20%,8%,0.75)] border-[hsl(270,30%,30%,0.3)] shadow-2xl shadow-[hsl(270,50%,20%,0.2)] animate-fade-in">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center overflow-hidden shadow-lg shadow-primary/20">
                {branding?.logo_url ? (
                  <img src={branding.logo_url} alt="Logo" className="w-full h-full object-contain p-1" />
                ) : (
                  <Network className="w-7 h-7 text-primary-foreground" />
                )}
              </div>
              <span className="text-2xl font-bold text-foreground">{branding?.company_name || 'MikroBill'}</span>
            </div>
          </div>
          <CardTitle className="text-foreground">Admin Portal</CardTitle>
          <CardDescription>Sign in to manage your hotspot and billing system</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="flex gap-2 p-1 bg-muted/50 rounded-lg backdrop-blur-sm">
              <Button type="button" variant={loginMethod === 'email' ? 'default' : 'ghost'} size="sm" className="flex-1" onClick={() => setLoginMethod('email')}>
                <Mail className="w-4 h-4 mr-2" />Email
              </Button>
              <Button type="button" variant={loginMethod === 'userid' ? 'default' : 'ghost'} size="sm" className="flex-1" onClick={() => setLoginMethod('userid')}>
                <User className="w-4 h-4 mr-2" />User ID
              </Button>
            </div>

            {loginMethod === 'email' ? (
              <div className="space-y-2">
                <Label htmlFor="signin-email">Email</Label>
                <Input id="signin-email" name="email" type="email" placeholder="admin@example.com" required className="bg-secondary/50 border-border/50" />
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="signin-userid">User ID</Label>
                <Input id="signin-userid" name="userid" type="text" placeholder="Enter your User ID" required className="bg-secondary/50 border-border/50" />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="signin-password">Password</Label>
              <Input id="signin-password" name="password" type="password" placeholder="••••••••" required className="bg-secondary/50 border-border/50" />
            </div>
            <Button type="submit" className="w-full bg-gradient-primary text-primary-foreground shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-shadow" disabled={isLoading}>
              {isLoading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Signing in...</>) : 'Sign In'}
            </Button>
          </form>

          <div className="mt-4 text-center space-y-2">
            <a href="/portal/login" className="inline-flex items-center gap-2 text-sm text-primary hover:underline font-medium">
              <Wifi className="w-4 h-4" />Client Portal Login
            </a>
            <br />
            <a href="/request" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary hover:underline text-xs">
              New Connection Request →
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
