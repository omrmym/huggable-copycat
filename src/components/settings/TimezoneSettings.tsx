import { useState, useEffect, forwardRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Globe, Save, Clock } from 'lucide-react';
import {
  useTimezoneSettings,
  useUpdateTimezoneSettings,
  TimezoneSettings as TimezoneSettingsType,
} from '@/hooks/useAppSettings';
import { setTimezoneOffsetHours } from '@/lib/dateUtils';

// Common timezones with their UTC offsets
const TIMEZONES = [
  { value: '-12', label: 'UTC-12:00 (Baker Island)' },
  { value: '-11', label: 'UTC-11:00 (American Samoa)' },
  { value: '-10', label: 'UTC-10:00 (Hawaii)' },
  { value: '-9', label: 'UTC-09:00 (Alaska)' },
  { value: '-8', label: 'UTC-08:00 (Pacific Time)' },
  { value: '-7', label: 'UTC-07:00 (Mountain Time)' },
  { value: '-6', label: 'UTC-06:00 (Central Time)' },
  { value: '-5', label: 'UTC-05:00 (Eastern Time)' },
  { value: '-4', label: 'UTC-04:00 (Atlantic Time)' },
  { value: '-3', label: 'UTC-03:00 (Buenos Aires)' },
  { value: '-2', label: 'UTC-02:00 (Mid-Atlantic)' },
  { value: '-1', label: 'UTC-01:00 (Azores)' },
  { value: '0', label: 'UTC+00:00 (London, Lisbon)' },
  { value: '1', label: 'UTC+01:00 (Paris, Berlin)' },
  { value: '2', label: 'UTC+02:00 (Cairo, Athens)' },
  { value: '3', label: 'UTC+03:00 (Moscow, Riyadh)' },
  { value: '3.5', label: 'UTC+03:30 (Tehran)' },
  { value: '4', label: 'UTC+04:00 (Dubai)' },
  { value: '4.5', label: 'UTC+04:30 (Kabul)' },
  { value: '5', label: 'UTC+05:00 (Karachi)' },
  { value: '5.5', label: 'UTC+05:30 (Mumbai, Delhi)' },
  { value: '5.75', label: 'UTC+05:45 (Kathmandu)' },
  { value: '6', label: 'UTC+06:00 (Dhaka, Bangladesh)' },
  { value: '6.5', label: 'UTC+06:30 (Yangon)' },
  { value: '7', label: 'UTC+07:00 (Bangkok, Jakarta)' },
  { value: '8', label: 'UTC+08:00 (Singapore, Hong Kong)' },
  { value: '9', label: 'UTC+09:00 (Tokyo, Seoul)' },
  { value: '9.5', label: 'UTC+09:30 (Adelaide)' },
  { value: '10', label: 'UTC+10:00 (Sydney)' },
  { value: '11', label: 'UTC+11:00 (Solomon Islands)' },
  { value: '12', label: 'UTC+12:00 (Auckland)' },
  { value: '13', label: 'UTC+13:00 (Samoa)' },
  { value: '14', label: 'UTC+14:00 (Line Islands)' },
];

export const TimezoneSettings = forwardRef<HTMLDivElement>(function TimezoneSettings(_props, _ref) {
  const { data: settings, isLoading } = useTimezoneSettings();
  const updateSettings = useUpdateTimezoneSettings();

  const [formData, setFormData] = useState<TimezoneSettingsType>({
    timezone_offset_hours: 6, // Default to UTC+6 (Bangladesh)
    timezone_label: 'UTC+06:00 (Dhaka, Bangladesh)',
  });

  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  const handleTimezoneChange = (value: string) => {
    const offset = parseFloat(value);
    const selectedTz = TIMEZONES.find(tz => tz.value === value);
    setFormData({
      timezone_offset_hours: offset,
      timezone_label: selectedTz?.label || `UTC${offset >= 0 ? '+' : ''}${offset}:00`,
    });
  };

  const handleSave = () => {
    updateSettings.mutate(formData, {
      onSuccess: () => {
        // Update the cached timezone immediately
        setTimezoneOffsetHours(formData.timezone_offset_hours);
      },
    });
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
    (settings.timezone_offset_hours !== formData.timezone_offset_hours);

  const currentOffset = formData.timezone_offset_hours >= 0 
    ? `+${formData.timezone_offset_hours}` 
    : `${formData.timezone_offset_hours}`;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Globe className="w-5 h-5 text-primary" />
          </div>
          <div>
            <CardTitle>Timezone Settings</CardTitle>
            <CardDescription>
              Configure the timezone for date and time displays across the application
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Timezone Display */}
        <div className="bg-muted/50 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Current Timezone</p>
              <p className="font-medium">{formData.timezone_label}</p>
            </div>
          </div>
        </div>

        {/* Timezone Selection */}
        <div className="space-y-3">
          <Label className="text-base font-medium">Select Timezone</Label>
          <Select 
            value={formData.timezone_offset_hours.toString()} 
            onValueChange={handleTimezoneChange}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a timezone" />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              {TIMEZONES.map((tz) => (
                <SelectItem key={tz.value} value={tz.value}>
                  {tz.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">
            All dates and times in activity logs, reports, and other views will be displayed in UTC{currentOffset}.
          </p>
        </div>

        {/* Quick Presets */}
        <div className="space-y-3 pt-4 border-t">
          <Label className="text-sm font-medium text-muted-foreground">Common Timezones</Label>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleTimezoneChange('0')}
            >
              UTC (London)
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleTimezoneChange('5.5')}
            >
              IST (India)
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleTimezoneChange('6')}
            >
              BST (Bangladesh)
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleTimezoneChange('8')}
            >
              SGT (Singapore)
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleTimezoneChange('-5')}
            >
              EST (New York)
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
