import { useState, useEffect, forwardRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Loader2, Clock, Shield, Save } from 'lucide-react';
import {
  useSessionTimeoutSettings,
  useUpdateSessionTimeoutSettings,
  SessionTimeoutSettings as SessionTimeoutSettingsType,
} from '@/hooks/useAppSettings';

export const SessionTimeoutSettings = forwardRef<HTMLDivElement>(function SessionTimeoutSettings(_props, _ref) {
  const { data: settings, isLoading } = useSessionTimeoutSettings();
  const updateSettings = useUpdateSessionTimeoutSettings();

  const [formData, setFormData] = useState<SessionTimeoutSettingsType>({
    timeout_minutes: 30,
    warning_minutes: 5,
  });

  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  const handleSave = () => {
    // Ensure warning is less than timeout
    const adjustedWarning = Math.min(formData.warning_minutes, formData.timeout_minutes - 1);
    updateSettings.mutate({
      ...formData,
      warning_minutes: adjustedWarning,
    });
  };

  const handleTimeoutChange = (value: number[]) => {
    const newTimeout = value[0];
    setFormData((prev) => ({
      ...prev,
      timeout_minutes: newTimeout,
      // Adjust warning if it's now >= timeout
      warning_minutes: Math.min(prev.warning_minutes, newTimeout - 1),
    }));
  };

  const handleWarningChange = (value: number[]) => {
    setFormData((prev) => ({
      ...prev,
      warning_minutes: Math.min(value[0], prev.timeout_minutes - 1),
    }));
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  const hasChanges =
    settings &&
    (settings.timeout_minutes !== formData.timeout_minutes ||
      settings.warning_minutes !== formData.warning_minutes);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div>
            <CardTitle>Session Timeout</CardTitle>
            <CardDescription>
              Configure automatic logout for inactive sessions
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Timeout Duration */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-base font-medium">Inactivity Timeout</Label>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">{formData.timeout_minutes} minutes</span>
            </div>
          </div>
          <Slider
            value={[formData.timeout_minutes]}
            onValueChange={handleTimeoutChange}
            min={5}
            max={120}
            step={5}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>5 min</span>
            <span>30 min</span>
            <span>60 min</span>
            <span>120 min</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Users will be automatically logged out after {formData.timeout_minutes} minutes of
            inactivity.
          </p>
        </div>

        {/* Warning Duration */}
        <div className="space-y-4 pt-4 border-t">
          <div className="flex items-center justify-between">
            <Label className="text-base font-medium">Warning Before Logout</Label>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-warning" />
              <span className="font-medium">{formData.warning_minutes} minutes</span>
            </div>
          </div>
          <Slider
            value={[formData.warning_minutes]}
            onValueChange={handleWarningChange}
            min={1}
            max={Math.max(formData.timeout_minutes - 1, 1)}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>1 min</span>
            <span>{Math.floor((formData.timeout_minutes - 1) / 2)} min</span>
            <span>{formData.timeout_minutes - 1} min</span>
          </div>
          <p className="text-sm text-muted-foreground">
            A warning dialog will appear {formData.warning_minutes} minutes before automatic
            logout, allowing users to extend their session.
          </p>
        </div>

        {/* Quick Presets */}
        <div className="space-y-3 pt-4 border-t">
          <Label className="text-sm font-medium text-muted-foreground">Quick Presets</Label>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFormData({ timeout_minutes: 15, warning_minutes: 3 })}
            >
              High Security (15 min)
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFormData({ timeout_minutes: 30, warning_minutes: 5 })}
            >
              Standard (30 min)
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFormData({ timeout_minutes: 60, warning_minutes: 10 })}
            >
              Extended (60 min)
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFormData({ timeout_minutes: 120, warning_minutes: 15 })}
            >
              Long Session (120 min)
            </Button>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-4 border-t">
          <Button onClick={handleSave} disabled={updateSettings.isPending || !hasChanges}>
            {updateSettings.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});
