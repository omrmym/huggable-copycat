import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Copy, Check, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

interface PortalLinkCardProps {
  userId: string;
  userName: string;
  username?: string;
}

export function PortalLinkCard({ userId, userName, username }: PortalLinkCardProps) {
  const [copied, setCopied] = useState(false);

  const portalLink = `${window.location.origin}/portal/u/${username || userId}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(portalLink);
      setCopied(true);
      toast.success('Portal link copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy link');
    }
  };

  const handleOpen = () => {
    window.open(portalLink, '_blank');
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <ExternalLink className="w-4 h-4" />
          Customer Portal Link
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground mb-2">
          Share this link with <span className="font-medium text-foreground">{userName}</span> for quick portal access without login.
        </p>
        <div className="flex gap-2">
          <Input
            value={portalLink}
            readOnly
            className="text-xs font-mono bg-secondary"
          />
          <Button variant="outline" size="icon" onClick={handleCopy} className="shrink-0">
            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
          </Button>
          <Button variant="outline" size="icon" onClick={handleOpen} className="shrink-0">
            <ExternalLink className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
