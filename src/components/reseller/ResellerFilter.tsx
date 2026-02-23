import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useResellers } from '@/hooks/useResellers';
import { Building2 } from 'lucide-react';

interface ResellerFilterProps {
  selectedResellerId: string | null;
  onResellerChange: (resellerId: string | null) => void;
  showAllOption?: boolean;
  className?: string;
}

export function ResellerFilter({ 
  selectedResellerId, 
  onResellerChange, 
  showAllOption = true,
  className = ''
}: ResellerFilterProps) {
  const { data: resellers = [], isLoading } = useResellers();

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Building2 className="w-4 h-4 text-muted-foreground" />
      <Select
        value={selectedResellerId || 'all'}
        onValueChange={(value) => onResellerChange(value === 'all' ? null : value)}
        disabled={isLoading}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder={isLoading ? "Loading..." : "Select Reseller"} />
        </SelectTrigger>
        <SelectContent>
          {showAllOption && (
            <SelectItem value="all">All Resellers</SelectItem>
          )}
          {resellers.map((reseller) => (
            <SelectItem key={reseller.id} value={reseller.id}>
              {reseller.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
