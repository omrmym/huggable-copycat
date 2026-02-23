import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { 
  BookOpen, 
  ChevronDown, 
  Copy, 
  Check,
  Terminal,
  Shield,
  Wifi,
  Lock,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';

interface CommandBlockProps {
  title: string;
  description: string;
  commands: string[];
  warning?: string;
}

function CommandBlock({ title, description, commands, warning }: CommandBlockProps) {
  const [copied, setCopied] = useState(false);
  
  const allCommands = commands.join('\n');
  
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(allCommands);
      setCopied(true);
      toast.success('Commands copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-start justify-between">
        <div>
          <h4 className="font-medium text-sm">{title}</h4>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      {warning && (
        <div className="flex items-start gap-2 p-2 rounded bg-warning/10 border border-warning/30">
          <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
          <p className="text-xs text-warning">{warning}</p>
        </div>
      )}
      <div className="relative">
        <pre className="bg-secondary/80 border border-border rounded-lg p-3 text-xs font-mono overflow-x-auto">
          {commands.map((cmd, idx) => (
            <div key={idx} className="text-foreground">
              <span className="text-primary select-none">&gt; </span>
              {cmd}
            </div>
          ))}
        </pre>
        <Button
          size="sm"
          variant="ghost"
          className="absolute top-2 right-2 h-7 w-7 p-0"
          onClick={copyToClipboard}
        >
          {copied ? (
            <Check className="w-3.5 h-3.5 text-success" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
        </Button>
      </div>
    </div>
  );
}

export function MikrotikSetupGuide() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Card className="bg-card border-border">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                <div>
                  <CardTitle className="text-base">Setup Guide</CardTitle>
                  <CardDescription className="text-xs">
                    Step-by-step RouterOS commands for API configuration
                  </CardDescription>
                </div>
              </div>
              <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="space-y-6 pt-0">
            {/* Step 1: Enable API Service */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                  Step 1
                </Badge>
                <div className="flex items-center gap-1.5">
                  <Terminal className="w-4 h-4" />
                  <span className="font-medium text-sm">Enable API Service</span>
                </div>
              </div>
              
              <CommandBlock
                title="Enable API (Port 8728)"
                description="Enable the standard MikroTik API service"
                commands={[
                  '/ip service enable api',
                  '/ip service set api port=8728'
                ]}
              />
              
              <CommandBlock
                title="Enable API-SSL (Port 8729)"
                description="Enable encrypted API service (recommended for remote access)"
                commands={[
                  '/ip service enable api-ssl',
                  '/ip service set api-ssl port=8729'
                ]}
              />
            </div>

            {/* Step 2: REST API (RouterOS v7+) */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                  Step 2
                </Badge>
                <div className="flex items-center gap-1.5">
                  <Wifi className="w-4 h-4" />
                  <span className="font-medium text-sm">REST API (RouterOS v7+ only)</span>
                </div>
              </div>
              
              <CommandBlock
                title="Enable REST API via WWW"
                description="The REST API uses the www or www-ssl service on ports 80/443"
                commands={[
                  '/ip service enable www',
                  '/ip service set www port=80',
                  '/ip service enable www-ssl',
                  '/ip service set www-ssl port=443'
                ]}
              />
            </div>

            {/* Step 3: Firewall Rules */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                  Step 3
                </Badge>
                <div className="flex items-center gap-1.5">
                  <Shield className="w-4 h-4" />
                  <span className="font-medium text-sm">Configure Firewall Rules</span>
                </div>
              </div>
              
              <CommandBlock
                title="Allow API Access (All IPs)"
                description="Allow incoming connections to API ports from any IP"
                commands={[
                  '/ip firewall filter add chain=input protocol=tcp dst-port=8728,8729 action=accept comment="Allow MikroTik API"',
                  '/ip firewall filter add chain=input protocol=tcp dst-port=80,443 action=accept comment="Allow REST API"'
                ]}
                warning="This allows access from any IP. For production, restrict to specific IPs."
              />
              
              <CommandBlock
                title="Allow API Access (Specific IP)"
                description="Restrict API access to a specific server IP (recommended)"
                commands={[
                  '/ip firewall filter add chain=input protocol=tcp dst-port=8728,8729 src-address=YOUR_SERVER_IP action=accept comment="Allow API from server"',
                  '/ip firewall filter add chain=input protocol=tcp dst-port=80,443 src-address=YOUR_SERVER_IP action=accept comment="Allow REST from server"'
                ]}
              />
            </div>

            {/* Step 4: Create API User */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                  Step 4
                </Badge>
                <div className="flex items-center gap-1.5">
                  <Lock className="w-4 h-4" />
                  <span className="font-medium text-sm">Create Dedicated API User</span>
                </div>
              </div>
              
              <CommandBlock
                title="Create API User with Full Access"
                description="Create a dedicated user for API access (replace PASSWORD)"
                commands={[
                  '/user add name=api-user password=YOUR_SECURE_PASSWORD group=full comment="API Access User"'
                ]}
              />
              
              <CommandBlock
                title="Create API User with Limited Access"
                description="Create a user with read/write but no sensitive access"
                commands={[
                  '/user group add name=api-group policy=read,write,api,!ftp,!ssh,!telnet,!winbox,!web,!policy,!password,!sensitive',
                  '/user add name=api-user password=YOUR_SECURE_PASSWORD group=api-group comment="Limited API User"'
                ]}
              />
            </div>

            {/* Step 5: Verify Configuration */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-success/20 text-success border-success/30">
                  Verify
                </Badge>
                <span className="font-medium text-sm">Check Your Configuration</span>
              </div>
              
              <CommandBlock
                title="View Service Status"
                description="Check which services are enabled and their ports"
                commands={[
                  '/ip service print'
                ]}
              />
              
              <CommandBlock
                title="View Firewall Rules"
                description="Check firewall filter rules"
                commands={[
                  '/ip firewall filter print where dst-port~"8728|8729|80|443"'
                ]}
              />
              
              <CommandBlock
                title="View Users"
                description="List all system users"
                commands={[
                  '/user print'
                ]}
              />
            </div>

            {/* Tips */}
            <div className="bg-muted/30 rounded-lg p-4 border border-border">
              <h4 className="font-medium text-sm mb-2">💡 Tips</h4>
              <ul className="text-xs text-muted-foreground space-y-1.5">
                <li>• <strong>Port Forwarding:</strong> If your router is behind NAT, forward ports 8728/8729 to it.</li>
                <li>• <strong>SSL Certificates:</strong> RouterOS uses self-signed certs by default. Our system handles this.</li>
                <li>• <strong>RouterOS v7+:</strong> REST API is available on v7+. For v6.x, use the API protocol.</li>
                <li>• <strong>Firewall Order:</strong> Place allow rules before any drop rules in your filter chain.</li>
              </ul>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
