import { useResellerAuth } from '@/contexts/ResellerAuthContext';
import { Badge } from '@/components/ui/badge';

interface ResellerHeaderProps {
  title: string;
  subtitle?: string;
}

export function ResellerHeader({ title, subtitle }: ResellerHeaderProps) {
  const { reseller } = useResellerAuth();

  return (
    <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm font-medium">{reseller?.contact_person || reseller?.name}</p>
          <p className="text-xs text-muted-foreground">{reseller?.phone}</p>
        </div>
        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
          {reseller?.commission_rate || 0}% Commission
        </Badge>
      </div>
    </header>
  );
}
