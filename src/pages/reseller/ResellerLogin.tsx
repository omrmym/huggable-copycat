import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useResellerAuth } from '@/contexts/ResellerAuthContext';
import { Loader2, User, Lock, Store } from 'lucide-react';

export default function ResellerLogin() {
  const [loginUserId, setLoginUserId] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, reseller } = useResellerAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Redirect if already logged in
  if (reseller) {
    navigate('/reseller', { replace: true });
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const result = await login(loginUserId, password);
    
    if (result.success) {
      toast({ title: 'Login Successful', description: 'Welcome to the Reseller Portal' });
      navigate('/reseller', { replace: true });
    } else {
      toast({ 
        title: 'Login Failed', 
        description: result.error || 'Invalid credentials',
        variant: 'destructive' 
      });
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(220,60%,8%)] via-[hsl(230,50%,12%)] to-[hsl(250,45%,10%)]" />
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-[hsl(210,100%,50%,0.08)] blur-[120px] animate-[float1_20s_ease-in-out_infinite]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-[hsl(260,100%,60%,0.08)] blur-[120px] animate-[float2_25s_ease-in-out_infinite]" />
        <div className="absolute top-[40%] left-[50%] w-[400px] h-[400px] rounded-full bg-[hsl(180,100%,50%,0.05)] blur-[100px] animate-[float3_18s_ease-in-out_infinite]" />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `linear-gradient(hsl(210,50%,50%) 1px, transparent 1px), linear-gradient(90deg, hsl(210,50%,50%) 1px, transparent 1px)`, backgroundSize: '60px 60px' }} />
        {Array.from({ length: 30 }).map((_, i) => (
          <div key={i} className="absolute w-1 h-1 rounded-full bg-[hsl(210,100%,70%,0.3)]" style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`, animation: `particle${i % 3} ${8 + Math.random() * 12}s ease-in-out infinite`, animationDelay: `${Math.random() * 5}s` }} />
        ))}
      </div>

      <Card className="w-full max-w-md backdrop-blur-xl bg-card/80 border-border/50 shadow-2xl shadow-black/20 animate-fade-in">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Store className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Reseller Portal</CardTitle>
          <CardDescription>Sign in with your reseller credentials</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="loginUserId">User ID</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="loginUserId"
                  type="text"
                  placeholder="Enter your User ID"
                  value={loginUserId}
                  onChange={(e) => setLoginUserId(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Sign In
            </Button>
          </form>
          <div className="mt-6 text-center text-sm text-muted-foreground">
            <a href="/login" className="hover:text-primary">
              Admin Login →
            </a>
          </div>
        </CardContent>
      </Card>

      <style>{`
        @keyframes float1 { 0%, 100% { transform: translate(0, 0) scale(1); } 33% { transform: translate(80px, -60px) scale(1.1); } 66% { transform: translate(-40px, 40px) scale(0.95); } }
        @keyframes float2 { 0%, 100% { transform: translate(0, 0) scale(1); } 33% { transform: translate(-70px, 50px) scale(1.05); } 66% { transform: translate(50px, -70px) scale(0.9); } }
        @keyframes float3 { 0%, 100% { transform: translate(-50%, -50%) scale(1); } 50% { transform: translate(-40%, -60%) scale(1.15); } }
        @keyframes particle0 { 0%, 100% { transform: translate(0, 0); opacity: 0.3; } 50% { transform: translate(30px, -40px); opacity: 0.8; } }
        @keyframes particle1 { 0%, 100% { transform: translate(0, 0); opacity: 0.2; } 50% { transform: translate(-20px, 50px); opacity: 0.7; } }
        @keyframes particle2 { 0%, 100% { transform: translate(0, 0); opacity: 0.4; } 50% { transform: translate(40px, 20px); opacity: 0.6; } }
      `}</style>
    </div>
  );
}
