import { useState, useRef, useCallback } from 'react';
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

export default function Login() {
  const [isLoading, setIsLoading] = useState(false);
  const [loginMethod, setLoginMethod] = useState<'email' | 'userid'>('email');
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
  const bgRef = useRef<HTMLDivElement>(null);
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: branding } = useBrandingSettings();

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const x = e.clientX / window.innerWidth;
    const y = e.clientY / window.innerHeight;
    setMousePos({ x, y });
  }, []);

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
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" onMouseMove={handleMouseMove}>
      {/* Interactive animated background */}
      <div ref={bgRef} className="fixed inset-0 -z-10">
        {/* Base gradient that shifts with mouse */}
        <div 
          className="absolute inset-0 transition-all duration-700 ease-out"
          style={{
            background: `radial-gradient(ellipse at ${mousePos.x * 100}% ${mousePos.y * 100}%, hsl(210,80%,15%) 0%, hsl(230,50%,8%) 50%, hsl(250,45%,6%) 100%)`,
          }}
        />
        
        {/* Mouse-reactive orbs */}
        <div 
          className="absolute w-[700px] h-[700px] rounded-full blur-[150px] animate-[float1_20s_ease-in-out_infinite] transition-transform duration-1000 ease-out"
          style={{
            background: 'radial-gradient(circle, hsl(199,89%,48%,0.12) 0%, transparent 70%)',
            left: `${-10 + mousePos.x * 20}%`,
            top: `${-20 + mousePos.y * 15}%`,
          }}
        />
        <div 
          className="absolute w-[600px] h-[600px] rounded-full blur-[130px] animate-[float2_25s_ease-in-out_infinite] transition-transform duration-1200 ease-out"
          style={{
            background: 'radial-gradient(circle, hsl(260,100%,60%,0.1) 0%, transparent 70%)',
            right: `${-10 + (1 - mousePos.x) * 20}%`,
            bottom: `${-20 + (1 - mousePos.y) * 15}%`,
          }}
        />
        <div 
          className="absolute w-[500px] h-[500px] rounded-full blur-[120px] animate-[float3_18s_ease-in-out_infinite] transition-transform duration-1500 ease-out"
          style={{
            background: 'radial-gradient(circle, hsl(180,100%,50%,0.08) 0%, transparent 70%)',
            left: `${40 + (mousePos.x - 0.5) * 30}%`,
            top: `${30 + (mousePos.y - 0.5) * 30}%`,
          }}
        />

        {/* Mouse spotlight glow */}
        <div 
          className="absolute w-[400px] h-[400px] rounded-full pointer-events-none transition-all duration-300 ease-out"
          style={{
            background: 'radial-gradient(circle, hsl(199,89%,48%,0.06) 0%, transparent 70%)',
            left: `${mousePos.x * 100}%`,
            top: `${mousePos.y * 100}%`,
            transform: 'translate(-50%, -50%)',
          }}
        />
        
        {/* Grid pattern that subtly shifts */}
        <div 
          className="absolute inset-0 opacity-[0.03] transition-transform duration-1000 ease-out"
          style={{
            backgroundImage: `linear-gradient(hsl(210,50%,50%) 1px, transparent 1px), linear-gradient(90deg, hsl(210,50%,50%) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
            transform: `translate(${(mousePos.x - 0.5) * 10}px, ${(mousePos.y - 0.5) * 10}px)`,
          }}
        />

        {/* Floating particles that react to mouse */}
        {Array.from({ length: 40 }).map((_, i) => {
          const baseLeft = (i * 17 + 7) % 100;
          const baseTop = (i * 23 + 13) % 100;
          const size = i % 3 === 0 ? 2 : 1;
          return (
            <div
              key={i}
              className="absolute rounded-full transition-transform duration-[2000ms] ease-out"
              style={{
                width: `${size}px`,
                height: `${size}px`,
                background: i % 4 === 0 
                  ? 'hsl(199,89%,60%,0.4)' 
                  : i % 4 === 1 
                  ? 'hsl(260,80%,70%,0.3)' 
                  : 'hsl(180,60%,60%,0.3)',
                left: `${baseLeft}%`,
                top: `${baseTop}%`,
                transform: `translate(${(mousePos.x - 0.5) * (i % 5 + 1) * 15}px, ${(mousePos.y - 0.5) * (i % 5 + 1) * 15}px)`,
                animation: `particle${i % 3} ${8 + (i % 7) * 2}s ease-in-out infinite`,
                animationDelay: `${(i * 0.3) % 5}s`,
              }}
            />
          );
        })}
      </div>

      {/* Login card */}
      <Card className="w-full max-w-md backdrop-blur-xl bg-card/80 border-border/50 shadow-2xl shadow-black/20 animate-fade-in">
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
          <CardDescription>
            Sign in to manage your hotspot and billing system
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="flex gap-2 p-1 bg-muted/50 rounded-lg backdrop-blur-sm">
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
                  className="bg-secondary/50 border-border/50"
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
                  className="bg-secondary/50 border-border/50"
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
                className="bg-secondary/50 border-border/50"
              />
            </div>
            <Button type="submit" className="w-full bg-gradient-primary text-primary-foreground shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-shadow" disabled={isLoading}>
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

          <div className="mt-4 text-center space-y-2">
            <a href="/portal/login" className="inline-flex items-center gap-2 text-sm text-primary hover:underline font-medium">
              <Wifi className="w-4 h-4" />
              Client Portal Login
            </a>
            <br />
            <a href="/request" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary hover:underline text-xs">
              New Connection Request →
            </a>
          </div>
        </CardContent>
      </Card>

      {/* CSS Animations */}
      <style>{`
        @keyframes float1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(80px, -60px) scale(1.1); }
          66% { transform: translate(-40px, 40px) scale(0.95); }
        }
        @keyframes float2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(-70px, 50px) scale(1.05); }
          66% { transform: translate(50px, -70px) scale(0.9); }
        }
        @keyframes float3 {
          0%, 100% { transform: translate(-50%, -50%) scale(1); }
          50% { transform: translate(-40%, -60%) scale(1.15); }
        }
        @keyframes particle0 {
          0%, 100% { transform: translate(0, 0); opacity: 0.3; }
          50% { transform: translate(30px, -40px); opacity: 0.8; }
        }
        @keyframes particle1 {
          0%, 100% { transform: translate(0, 0); opacity: 0.2; }
          50% { transform: translate(-20px, 50px); opacity: 0.7; }
        }
        @keyframes particle2 {
          0%, 100% { transform: translate(0, 0); opacity: 0.4; }
          50% { transform: translate(40px, 20px); opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}
