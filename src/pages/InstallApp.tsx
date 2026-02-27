import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Download, Smartphone, CheckCircle, Wifi, ArrowDown, Chrome } from 'lucide-react';
import { useBrandingSettings } from '@/components/settings/BrandingSettings';
import { Network } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallApp() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const { data: branding } = useBrandingSettings();

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Check iOS
    const ua = navigator.userAgent;
    setIsIOS(/iPad|iPhone|iPod/.test(ua) && !(window as unknown as { MSStream?: unknown }).MSStream);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(220,60%,8%)] via-[hsl(230,50%,12%)] to-[hsl(250,45%,10%)]" />
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-[hsl(210,100%,50%,0.08)] blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-[hsl(260,100%,60%,0.08)] blur-[120px]" />
      </div>

      <Card className="w-full max-w-md backdrop-blur-xl bg-card/80 border-border/50 shadow-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-primary flex items-center justify-center overflow-hidden shadow-lg shadow-primary/20">
              {branding?.logo_url ? (
                <img src={branding.logo_url} alt="Logo" className="w-full h-full object-contain p-2" />
              ) : (
                <Network className="w-9 h-9 text-primary-foreground" />
              )}
            </div>
          </div>
          <CardTitle className="text-xl text-foreground">
            Install {branding?.company_name || 'MikroBill'}
          </CardTitle>
          <CardDescription>
            Install this app on your device for quick access
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isInstalled ? (
            <div className="text-center py-4">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-3" />
              <p className="text-foreground font-medium">App is already installed!</p>
              <p className="text-sm text-muted-foreground mt-1">
                You can find it on your home screen
              </p>
              <Button className="mt-4" onClick={() => window.location.href = '/'}>
                Open App
              </Button>
            </div>
          ) : deferredPrompt ? (
            <div className="space-y-4">
              <Button
                onClick={handleInstall}
                className="w-full bg-gradient-primary text-primary-foreground shadow-lg shadow-primary/20 h-12 text-base"
              >
                <Download className="w-5 h-5 mr-2" />
                Install App
              </Button>
              <div className="space-y-3 pt-2">
                <Feature icon={<Smartphone className="w-5 h-5" />} text="Works like a native app" />
                <Feature icon={<Wifi className="w-5 h-5" />} text="Fast loading & offline support" />
                <Feature icon={<CheckCircle className="w-5 h-5" />} text="No app store required" />
              </div>
            </div>
          ) : isIOS ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                To install on iPhone/iPad:
              </p>
              <div className="space-y-3 bg-secondary/50 rounded-lg p-4">
                <Step num={1} text="Tap the Share button in Safari" />
                <Step num={2} text='Scroll down and tap "Add to Home Screen"' />
                <Step num={3} text='Tap "Add" to confirm' />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                To install this app:
              </p>
              <div className="space-y-3 bg-secondary/50 rounded-lg p-4">
                <Step num={1} text="Open this page in Chrome or Edge browser" />
                <Step num={2} text="Tap the menu (⋮) button" />
                <Step num={3} text='Select "Install App" or "Add to Home Screen"' />
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground justify-center">
                <Chrome className="w-4 h-4" />
                Best experience with Chrome
              </div>
            </div>
          )}

          <div className="text-center pt-2">
            <a href="/login" className="text-sm text-primary hover:underline">
              ← Back to Login
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Feature({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-3 text-sm text-muted-foreground">
      <div className="text-primary">{icon}</div>
      {text}
    </div>
  );
}

function Step({ num, text }: { num: number; text: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center shrink-0 mt-0.5">
        {num}
      </span>
      <p className="text-sm text-foreground">{text}</p>
    </div>
  );
}
