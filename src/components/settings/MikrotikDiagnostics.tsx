import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { 
  Search, 
  Loader2, 
  Check, 
  X, 
  AlertCircle,
  Zap,
  Shield,
  Wifi
} from 'lucide-react';
import { toast } from 'sonner';

interface PortScanResult {
  port: number;
  useSsl: boolean;
  protocol: 'api' | 'rest';
  status: 'pending' | 'testing' | 'success' | 'failed';
  error?: string;
  responseTime?: number;
  routerInfo?: {
    version?: string;
    boardName?: string;
  };
}

interface MikrotikDiagnosticsProps {
  host: string;
  username: string;
  password: string;
  onApplyConfig?: (config: { port: string; useSsl: boolean; connectionMode: 'api' | 'rest' }) => void;
}

// Port configurations to test
const PORT_CONFIGS: Omit<PortScanResult, 'status'>[] = [
  { port: 8728, useSsl: false, protocol: 'api' },
  { port: 8729, useSsl: true, protocol: 'api' },
  { port: 80, useSsl: false, protocol: 'rest' },
  { port: 443, useSsl: true, protocol: 'rest' },
];

export function MikrotikDiagnostics({ host, username, password, onApplyConfig }: MikrotikDiagnosticsProps) {
  const [customHost, setCustomHost] = useState(host);
  const [customUsername, setCustomUsername] = useState(username);
  const [customPassword, setCustomPassword] = useState(password);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResults, setScanResults] = useState<PortScanResult[]>([]);
  const [recommendedConfig, setRecommendedConfig] = useState<PortScanResult | null>(null);

  const testPort = async (config: Omit<PortScanResult, 'status'>): Promise<PortScanResult> => {
    const startTime = Date.now();
    
    try {
      const { data, error } = await supabase.functions.invoke('mikrotik-sync', {
        body: {
          action: 'test-connection',
          router: {
            host: customHost,
            port: config.port.toString(),
            username: customUsername,
            password: customPassword,
            connectionMode: config.protocol,
            useSsl: config.useSsl,
          }
        },
      });

      const responseTime = Date.now() - startTime;

      if (error) {
        const errorMessage = error.message || 'Connection failed';
        return { ...config, status: 'failed', error: errorMessage, responseTime };
      }

      if (data?.success) {
        const resourceData = Array.isArray(data.data) ? data.data[0] : data.data;
        return {
          ...config,
          status: 'success',
          responseTime,
          routerInfo: {
            version: resourceData?.version,
            boardName: resourceData?.['board-name'],
          },
        };
      } else {
        return { ...config, status: 'failed', error: data?.error || 'Unknown error', responseTime };
      }
    } catch (err) {
      const responseTime = Date.now() - startTime;
      return { 
        ...config, 
        status: 'failed', 
        error: err instanceof Error ? err.message : 'Connection error',
        responseTime 
      };
    }
  };

  const runDiagnostics = async () => {
    if (!customHost) {
      toast.error('Please enter a router IP/hostname');
      return;
    }
    if (!customUsername || !customPassword) {
      toast.error('Please enter router credentials');
      return;
    }

    setIsScanning(true);
    setRecommendedConfig(null);
    
    // Initialize all ports as pending
    const initialResults: PortScanResult[] = PORT_CONFIGS.map(c => ({ ...c, status: 'pending' as const }));
    setScanResults(initialResults);

    const results: PortScanResult[] = [];

    // Test each port sequentially (to avoid overwhelming the router)
    for (let i = 0; i < PORT_CONFIGS.length; i++) {
      const config = PORT_CONFIGS[i];
      
      // Update status to testing
      setScanResults(prev => prev.map((r, idx) => 
        idx === i ? { ...r, status: 'testing' as const } : r
      ));

      const result = await testPort(config);
      results.push(result);

      // Update with actual result
      setScanResults(prev => prev.map((r, idx) => 
        idx === i ? result : r
      ));
    }

    // Find the best working configuration
    const successfulResults = results.filter(r => r.status === 'success');
    if (successfulResults.length > 0) {
      // Prefer API over REST, and non-SSL over SSL (simpler)
      const sorted = successfulResults.sort((a, b) => {
        // Prefer API protocol
        if (a.protocol === 'api' && b.protocol !== 'api') return -1;
        if (a.protocol !== 'api' && b.protocol === 'api') return 1;
        // Prefer faster response
        return (a.responseTime || 0) - (b.responseTime || 0);
      });
      setRecommendedConfig(sorted[0]);
      toast.success(`Found ${successfulResults.length} working configuration(s)!`);
    } else {
      toast.error('No working configuration found. Check router accessibility.');
    }

    setIsScanning(false);
  };

  const applyConfig = (config: PortScanResult) => {
    if (onApplyConfig) {
      onApplyConfig({
        port: config.port.toString(),
        useSsl: config.useSsl,
        connectionMode: config.protocol,
      });
      toast.success('Configuration applied! Remember to save.');
    }
  };

  const getStatusIcon = (status: PortScanResult['status']) => {
    switch (status) {
      case 'pending':
        return <div className="w-4 h-4 rounded-full bg-muted" />;
      case 'testing':
        return <Loader2 className="w-4 h-4 animate-spin text-primary" />;
      case 'success':
        return <Check className="w-4 h-4 text-success" />;
      case 'failed':
        return <X className="w-4 h-4 text-destructive" />;
    }
  };

  const getProtocolBadge = (protocol: 'api' | 'rest', useSsl: boolean) => {
    if (protocol === 'api') {
      return (
        <Badge variant="outline" className="text-xs">
          <Wifi className="w-3 h-3 mr-1" />
          API {useSsl ? '(SSL)' : ''}
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="text-xs">
        <Shield className="w-3 h-3 mr-1" />
        REST {useSsl ? '(HTTPS)' : '(HTTP)'}
      </Badge>
    );
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="w-5 h-5 text-primary" />
          Port Diagnostics
        </CardTitle>
        <CardDescription>
          Scan common MikroTik ports to auto-detect the correct configuration.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Credentials for scanning */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Host</Label>
            <Input
              placeholder="192.168.88.1"
              value={customHost}
              onChange={(e) => setCustomHost(e.target.value)}
              className="bg-secondary border-border h-9"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Username</Label>
            <Input
              placeholder="admin"
              value={customUsername}
              onChange={(e) => setCustomUsername(e.target.value)}
              className="bg-secondary border-border h-9"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Password</Label>
            <Input
              type="password"
              placeholder="••••••••"
              value={customPassword}
              onChange={(e) => setCustomPassword(e.target.value)}
              className="bg-secondary border-border h-9"
            />
          </div>
        </div>

        <Button
          onClick={runDiagnostics}
          disabled={isScanning || !customHost}
          className="w-full bg-gradient-primary text-primary-foreground"
        >
          {isScanning ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Scanning Ports...
            </>
          ) : (
            <>
              <Zap className="w-4 h-4 mr-2" />
              Run Port Scan
            </>
          )}
        </Button>

        {/* Scan Results */}
        {scanResults.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Scan Results</Label>
            <div className="space-y-2">
              {scanResults.map((result, idx) => (
                <div
                  key={idx}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    result.status === 'success' 
                      ? 'bg-success/10 border-success/30' 
                      : result.status === 'failed'
                      ? 'bg-destructive/5 border-destructive/20'
                      : 'bg-muted/30 border-border'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(result.status)}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-medium">Port {result.port}</span>
                        {getProtocolBadge(result.protocol, result.useSsl)}
                        {result === recommendedConfig && (
                          <Badge className="bg-primary text-primary-foreground text-xs">
                            Recommended
                          </Badge>
                        )}
                      </div>
                      {result.status === 'success' && result.routerInfo?.version && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          RouterOS {result.routerInfo.version} • {result.responseTime}ms
                        </p>
                      )}
                      {result.status === 'failed' && result.error && (
                        <p className="text-xs text-destructive mt-0.5 line-clamp-1">
                          {result.error.substring(0, 60)}{result.error.length > 60 ? '...' : ''}
                        </p>
                      )}
                    </div>
                  </div>
                  {result.status === 'success' && onApplyConfig && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => applyConfig(result)}
                      className="text-xs h-7"
                    >
                      Apply
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Info Box */}
        <div className="bg-muted/30 rounded-lg p-3 border border-border">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-muted-foreground mt-0.5" />
            <div className="text-xs text-muted-foreground">
              <p className="font-medium">Ports Scanned:</p>
              <ul className="mt-1 space-y-0.5">
                <li>• <strong>8728</strong> - MikroTik API (plaintext)</li>
                <li>• <strong>8729</strong> - MikroTik API-SSL (encrypted)</li>
                <li>• <strong>80</strong> - REST API via HTTP (RouterOS v7+)</li>
                <li>• <strong>443</strong> - REST API via HTTPS (RouterOS v7+)</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
