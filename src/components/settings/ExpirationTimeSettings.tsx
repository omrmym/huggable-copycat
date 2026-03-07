import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useExpirationTimeSettings, useUpdateExpirationTimeSettings } from '@/hooks/useAppSettings';
import { Clock, Save, Loader2 } from 'lucide-react';

export function ExpirationTimeSettings() {
  const { data: settings, isLoading } = useExpirationTimeSettings();
  const updateSettings = useUpdateExpirationTimeSettings();
  const [time, setTime] = useState('09:00');

  useEffect(() => {
    if (settings) {
      const h = String(settings.hour).padStart(2, '0');
      const m = String(settings.minute).padStart(2, '0');
      setTime(`${h}:${m}`);
    }
  }, [settings]);

  const handleSave = () => {
    const [hours, minutes] = time.split(':').map(Number);
    updateSettings.mutate({ hour: hours, minute: minutes });
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          Default Expiration Time
        </CardTitle>
        <CardDescription>
          This time will be used as the default expiration time for new users, recharges, and grace activations. Applies to both existing and new users.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <Label htmlFor="default-expire-time">Expiration Time</Label>
              <Input
                id="default-expire-time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="max-w-xs"
              />
              <p className="text-xs text-muted-foreground">
                Current setting: {time} ({parseInt(time.split(':')[0]) >= 12 
                  ? `${parseInt(time.split(':')[0]) === 12 ? 12 : parseInt(time.split(':')[0]) - 12}:${time.split(':')[1]} PM` 
                  : `${parseInt(time.split(':')[0]) === 0 ? 12 : parseInt(time.split(':')[0])}:${time.split(':')[1]} AM`})
              </p>
            </div>
            <Button
              onClick={handleSave}
              disabled={updateSettings.isPending}
            >
              {updateSettings.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
              ) : (
                <><Save className="w-4 h-4 mr-2" /> Save Settings</>
              )}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
