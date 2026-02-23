import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'default' | 'primary' | 'success' | 'warning';
  href?: string;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = 'default',
  href,
}: StatCardProps) {
  const navigate = useNavigate();
  
  const iconColors = {
    default: 'bg-secondary text-primary',
    primary: 'bg-primary/20 text-primary',
    success: 'bg-success/20 text-success',
    warning: 'bg-warning/20 text-warning',
  };

  const handleClick = () => {
    if (href) {
      navigate(href);
    }
  };

  return (
    <div 
      className={cn(
        "stat-card animate-fade-in",
        href && "cursor-pointer hover:border-primary/50 hover:shadow-lg transition-all duration-200"
      )}
      onClick={handleClick}
    >
      <div className="flex items-start justify-between">
        <div className={cn('p-3 rounded-xl', iconColors[variant])}>
          <Icon className="w-6 h-6" />
        </div>
        {trend && (
          <span
            className={cn(
              'text-sm font-medium px-2 py-1 rounded-full',
              trend.isPositive
                ? 'bg-success/20 text-success'
                : 'bg-destructive/20 text-destructive'
            )}
          >
            {trend.isPositive ? '+' : ''}
            {trend.value}%
          </span>
        )}
      </div>
      <div className="mt-4">
        <p className="text-3xl font-bold text-foreground">{value}</p>
        <p className="text-sm text-muted-foreground mt-1">{title}</p>
        {subtitle && (
          <p className="text-xs text-muted-foreground/70 mt-0.5">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
