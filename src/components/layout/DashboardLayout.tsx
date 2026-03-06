import { ReactNode, useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export function DashboardLayout({ children, title, subtitle }: DashboardLayoutProps) {
  const isMobile = useIsMobile();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Auto-collapse sidebar on mobile
  useEffect(() => {
    if (isMobile) {
      setIsSidebarCollapsed(true);
    }
  }, [isMobile]);

  const handleToggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const handleCloseSidebar = () => {
    if (isMobile) {
      setIsSidebarCollapsed(true);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile overlay */}
      {isMobile && !isSidebarCollapsed && (
        <div 
          className="fixed inset-0 bg-black/50 z-40"
          onClick={handleCloseSidebar}
        />
      )}
      <Sidebar isCollapsed={isSidebarCollapsed} onNavClick={handleCloseSidebar} />
      <div className={cn(
        "transition-all duration-300",
        isMobile ? "ml-0" : (isSidebarCollapsed ? "ml-0" : "ml-64")
      )}>
        <Header 
          title={title} 
          subtitle={subtitle} 
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleSidebar={handleToggleSidebar}
        />
        <main className={cn("p-4 md:p-6")}>
          {children}
        </main>
      </div>
    </div>
  );
}
