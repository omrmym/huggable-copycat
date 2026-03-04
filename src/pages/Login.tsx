import { useState, useRef, useCallback, useMemo } from 'react';
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
      {/* Galaxy background */}
      <div ref={bgRef} className="fixed inset-0 -z-10">
        {/* Deep space base */}
        <div className="absolute inset-0 bg-[hsl(240,30%,3%)]" />

        {/* Galaxy core glow - follows mouse */}
        <div
          className="absolute w-[900px] h-[900px] rounded-full transition-all duration-[1500ms] ease-out"
          style={{
            background: 'radial-gradient(circle, hsl(270,60%,20%,0.4) 0%, hsl(240,50%,12%,0.2) 40%, transparent 70%)',
            left: `${mousePos.x * 100}%`,
            top: `${mousePos.y * 100}%`,
            transform: 'translate(-50%, -50%)',
          }}
        />

        {/* Nebula clouds */}
        <div
          className="absolute w-[800px] h-[500px] rounded-full blur-[100px] animate-[nebula1_30s_ease-in-out_infinite] transition-transform duration-[2000ms] ease-out"
          style={{
            background: 'radial-gradient(ellipse, hsl(280,80%,30%,0.15) 0%, hsl(320,60%,20%,0.08) 50%, transparent 80%)',
            left: `${10 + mousePos.x * 15}%`,
            top: `${5 + mousePos.y * 10}%`,
          }}
        />
        <div
          className="absolute w-[600px] h-[700px] rounded-full blur-[120px] animate-[nebula2_35s_ease-in-out_infinite] transition-transform duration-[2500ms] ease-out"
          style={{
            background: 'radial-gradient(ellipse, hsl(210,90%,35%,0.12) 0%, hsl(250,70%,25%,0.06) 50%, transparent 80%)',
            right: `${5 + (1 - mousePos.x) * 15}%`,
            bottom: `${10 + (1 - mousePos.y) * 10}%`,
          }}
        />
        <div
          className="absolute w-[500px] h-[400px] rounded-full blur-[90px] animate-[nebula3_25s_ease-in-out_infinite] transition-transform duration-[2000ms] ease-out"
          style={{
            background: 'radial-gradient(ellipse, hsl(190,80%,30%,0.1) 0%, hsl(220,60%,20%,0.05) 50%, transparent 80%)',
            left: `${50 + (mousePos.x - 0.5) * 25}%`,
            top: `${60 + (mousePos.y - 0.5) * 20}%`,
          }}
        />

        {/* Spiral arm dust lanes */}
        <div
          className="absolute inset-0 opacity-[0.04] transition-transform duration-[3000ms] ease-out"
          style={{
            backgroundImage: `
              radial-gradient(ellipse at 30% 40%, hsl(270,50%,50%) 0%, transparent 50%),
              radial-gradient(ellipse at 70% 60%, hsl(200,60%,40%) 0%, transparent 40%)
            `,
            transform: `rotate(${(mousePos.x - 0.5) * 8}deg) scale(1.2)`,
          }}
        />

        {/* Mouse spotlight - soft cosmic glow */}
        <div
          className="absolute w-[300px] h-[300px] rounded-full pointer-events-none transition-all duration-500 ease-out"
          style={{
            background: 'radial-gradient(circle, hsl(220,80%,70%,0.04) 0%, hsl(270,60%,50%,0.02) 50%, transparent 70%)',
            left: `${mousePos.x * 100}%`,
            top: `${mousePos.y * 100}%`,
            transform: 'translate(-50%, -50%)',
          }}
        />

        {/* Stars - different layers with parallax mouse response */}
        {Array.from({ length: 120 }).map((_, i) => {
          const baseLeft = (i * 13 + 7) % 100;
          const baseTop = (i * 19 + 11) % 100;
          const layer = i % 3; // 0=far, 1=mid, 2=near
          const size = layer === 2 ? (i % 7 === 0 ? 3 : 2) : layer === 1 ? 1.5 : 1;
          const parallax = (layer + 1) * 8;
          const brightness = layer === 2 ? 0.9 : layer === 1 ? 0.6 : 0.35;
          const colors = [
            'hsl(220,60%,85%)', // blue-white
            'hsl(40,80%,80%)',  // warm yellow
            'hsl(200,70%,75%)', // cyan
            'hsl(0,50%,80%)',   // red giant
            'hsl(270,40%,85%)', // purple
            'hsl(180,50%,80%)', // teal
          ];
          const color = colors[i % colors.length];
          const twinkleDelay = (i * 0.7) % 8;
          const twinkleDuration = 3 + (i % 5);

          return (
            <div
              key={i}
              className="absolute rounded-full transition-transform duration-[2000ms] ease-out"
              style={{
                width: `${size}px`,
                height: `${size}px`,
                backgroundColor: color,
                opacity: brightness,
                left: `${baseLeft}%`,
                top: `${baseTop}%`,
                transform: `translate(${(mousePos.x - 0.5) * parallax}px, ${(mousePos.y - 0.5) * parallax}px)`,
                animation: `twinkle ${twinkleDuration}s ease-in-out ${twinkleDelay}s infinite`,
                boxShadow: size >= 2 ? `0 0 ${size * 2}px ${color}` : 'none',
              }}
            />
          );
        })}

        {/* Shooting stars */}
        <div className="absolute w-[2px] h-[2px] bg-white rounded-full animate-[shootingStar1_8s_linear_infinite]" style={{ top: '15%', left: '-5%', boxShadow: '0 0 4px 1px hsl(210,80%,80%,0.6)' }} />
        <div className="absolute w-[1.5px] h-[1.5px] bg-white rounded-full animate-[shootingStar2_12s_linear_4s_infinite]" style={{ top: '35%', left: '-5%', boxShadow: '0 0 3px 1px hsl(270,60%,80%,0.5)' }} />
        <div className="absolute w-[2px] h-[2px] bg-white rounded-full animate-[shootingStar3_15s_linear_9s_infinite]" style={{ top: '65%', left: '-5%', boxShadow: '0 0 4px 1px hsl(190,70%,80%,0.6)' }} />
      </div>

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
          <CardDescription>
            Sign in to manage your hotspot and billing system
          </CardDescription>
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

      {/* Galaxy CSS Animations */}
      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: inherit; transform: inherit; }
          50% { opacity: 0.2; }
        }
        @keyframes nebula1 {
          0%, 100% { transform: translate(0, 0) rotate(0deg) scale(1); }
          33% { transform: translate(40px, -30px) rotate(3deg) scale(1.05); }
          66% { transform: translate(-20px, 20px) rotate(-2deg) scale(0.97); }
        }
        @keyframes nebula2 {
          0%, 100% { transform: translate(0, 0) rotate(0deg) scale(1); }
          33% { transform: translate(-50px, 30px) rotate(-4deg) scale(1.08); }
          66% { transform: translate(30px, -40px) rotate(2deg) scale(0.95); }
        }
        @keyframes nebula3 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(30px, -20px) scale(1.1); }
        }
        @keyframes shootingStar1 {
          0% { transform: translate(0, 0) rotate(-35deg); opacity: 0; }
          2% { opacity: 1; }
          8% { transform: translate(calc(100vw + 200px), calc(40vh)) rotate(-35deg); opacity: 0; }
          100% { transform: translate(calc(100vw + 200px), calc(40vh)) rotate(-35deg); opacity: 0; }
        }
        @keyframes shootingStar2 {
          0% { transform: translate(0, 0) rotate(-25deg); opacity: 0; }
          2% { opacity: 1; }
          6% { transform: translate(calc(80vw), calc(25vh)) rotate(-25deg); opacity: 0; }
          100% { transform: translate(calc(80vw), calc(25vh)) rotate(-25deg); opacity: 0; }
        }
        @keyframes shootingStar3 {
          0% { transform: translate(0, 0) rotate(-40deg); opacity: 0; }
          1.5% { opacity: 1; }
          5% { transform: translate(calc(90vw), calc(50vh)) rotate(-40deg); opacity: 0; }
          100% { transform: translate(calc(90vw), calc(50vh)) rotate(-40deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
