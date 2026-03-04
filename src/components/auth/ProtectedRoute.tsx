import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, ShieldX } from 'lucide-react';
import { useHasPermission, ROUTE_PERMISSIONS } from '@/hooks/useHasPermission';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const location = useLocation();
  const { hasAnyPermission, isLoading: permLoading } = useHasPermission();

  // Check if user is a software user (any role)
  const { data: softwareUser, isLoading: softwareUserLoading } = useQuery({
    queryKey: ['software-user-check', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('software_users')
        .select('id, role, is_active')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();
      
      if (error) {
        console.error('Error checking software user:', error);
        return null;
      }
      return data;
    },
    enabled: !!user?.id,
  });

  const isLoading = authLoading || softwareUserLoading || permLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // User must be either an admin (from admin_users table) OR an active software user
  const hasAccess = isAdmin || !!softwareUser;

  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-2">Access Denied</h1>
          <p className="text-muted-foreground">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  // If requireAdmin is true, check for admin/super_admin role
  if (requireAdmin && !isAdmin) {
    const isSoftwareAdmin = softwareUser?.role === 'super_admin' || softwareUser?.role === 'admin';
    if (!isSoftwareAdmin) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-destructive mb-2">Admin Access Required</h1>
            <p className="text-muted-foreground">This page requires administrator privileges.</p>
          </div>
        </div>
      );
    }
  }

  // Check route-level permissions (skip for admin users and user profile routes)
  const routePath = location.pathname;
  const requiredPermissions = ROUTE_PERMISSIONS[routePath];
  
  if (requiredPermissions && !routePath.startsWith('/users/') || (requiredPermissions && routePath === '/users')) {
    if (!hasAnyPermission(requiredPermissions)) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center">
            <ShieldX className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-destructive mb-2">Permission Denied</h1>
            <p className="text-muted-foreground">Your role does not have permission to access this page.</p>
          </div>
        </div>
      );
    }
  }

  // For user sub-routes (area, district, etc.) check permissions
  if (routePath !== '/users' && routePath.startsWith('/users/') && !routePath.match(/^\/users\/[0-9a-f-]+$/)) {
    const subRoutePerms = ROUTE_PERMISSIONS[routePath];
    if (subRoutePerms && !hasAnyPermission(subRoutePerms)) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center">
            <ShieldX className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-destructive mb-2">Permission Denied</h1>
            <p className="text-muted-foreground">Your role does not have permission to access this page.</p>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
}
