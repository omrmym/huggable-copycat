import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCustomerAuth } from '@/contexts/CustomerAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Network, User, Lock, Loader2, AlertCircle } from 'lucide-react';
import { GalaxyBackground } from '@/components/auth/GalaxyBackground';

export default function CustomerLogin() {
  const navigate = useNavigate();
  const { login, isLoading: authLoading } = useCustomerAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const result = await login(username, password);
    
    if (result.success) {
      navigate('/portal');
    } else {
      setError(result.error || 'Login failed');
    }
    
    setIsLoading(false);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <GalaxyBackground />

      <Card className="w-full max-w-md backdrop-blur-xl bg-[hsl(240,20%,8%,0.75)] border-[hsl(270,30%,30%,0.3)] shadow-2xl shadow-[hsl(270,50%,20%,0.2)] animate-fade-in">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center overflow-hidden shadow-lg shadow-primary/20">
                <Network className="w-7 h-7 text-primary-foreground" />
              </div>
              <span className="text-2xl font-bold text-foreground">MikroBill</span>
            </div>
          </div>
          <CardTitle className="text-foreground">Customer Portal</CardTitle>
          <CardDescription>Sign in to manage your account, view usage, and pay bills</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-10 bg-secondary/50 border-border/50"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 bg-secondary/50 border-border/50"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-primary text-primary-foreground shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-shadow"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center space-y-2">
            <p className="text-sm text-muted-foreground">Need help? Contact your ISP administrator.</p>
            <a href="/login" className="inline-flex items-center gap-2 text-sm text-primary hover:underline font-medium">
              Admin Login →
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
