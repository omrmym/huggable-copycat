import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Settings } from 'lucide-react';

export interface RoleSettings {
  max_grace_days: number;
}

interface RoleSettingsEditorProps {
  settings: RoleSettings;
  onChange: (settings: RoleSettings) => void;
  disabled?: boolean;
}

export function RoleSettingsEditor({
  settings,
  onChange,
  disabled = false,
}: RoleSettingsEditorProps) {
  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Rule Settings
        </CardTitle>
        <CardDescription>
          Configure operational limits for this rule
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Grace Activation Settings */}
        <div className="rounded-lg bg-muted/50 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <Label className="text-sm font-medium">Grace Activation</Label>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Label htmlFor="max-grace-days" className="text-xs text-muted-foreground">
                  Maximum Grace Days Allowed
                </Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    id="max-grace-days"
                    type="number"
                    min={1}
                    max={30}
                    value={settings.max_grace_days}
                    onChange={(e) =>
                      onChange({
                        ...settings,
                        max_grace_days: Math.max(1, Math.min(30, parseInt(e.target.value) || 1)),
                      })
                    }
                    disabled={disabled}
                    className="w-24"
                  />
                  <span className="text-sm text-muted-foreground">days</span>
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Users with this rule can activate grace periods up to this many days.
              Super Admin can activate unlimited times, while other rules can only activate once per billing cycle.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
