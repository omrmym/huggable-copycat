import { ReactNode } from 'react';
import { ResellerSidebar } from './ResellerSidebar';
import { ResellerHeader } from './ResellerHeader';

interface ResellerLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export function ResellerLayout({ children, title, subtitle }: ResellerLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <ResellerSidebar />
      <div className="ml-64">
        <ResellerHeader title={title} subtitle={subtitle} />
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
