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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
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
    </div>
  );
}
