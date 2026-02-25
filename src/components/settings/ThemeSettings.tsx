import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Palette, Check, Save, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';
import { cn } from '@/lib/utils';

interface ThemeConfig {
  theme: string;
}

const themes = [
  {
    id: 'dark-blue',
    name: 'Dark Blue',
    description: 'Default dark professional theme',
    preview: { bg: 'hsl(222,47%,11%)', card: 'hsl(222,47%,14%)', primary: 'hsl(199,89%,48%)', text: 'hsl(210,40%,98%)' },
  },
  {
    id: 'light',
    name: 'Light',
    description: 'Clean light theme',
    preview: { bg: 'hsl(210,40%,98%)', card: 'hsl(0,0%,100%)', primary: 'hsl(199,89%,48%)', text: 'hsl(222,47%,11%)' },
  },
  {
    id: 'dark-green',
    name: 'Dark Emerald',
    description: 'Dark theme with green accents',
    preview: { bg: 'hsl(160,30%,9%)', card: 'hsl(160,30%,12%)', primary: 'hsl(160,84%,39%)', text: 'hsl(160,20%,95%)' },
  },
  {
    id: 'dark-purple',
    name: 'Dark Purple',
    description: 'Dark theme with purple accents',
    preview: { bg: 'hsl(270,40%,10%)', card: 'hsl(270,35%,14%)', primary: 'hsl(270,76%,60%)', text: 'hsl(270,20%,96%)' },
  },
  {
    id: 'dark-orange',
    name: 'Dark Amber',
    description: 'Dark theme with warm accents',
    preview: { bg: 'hsl(20,30%,9%)', card: 'hsl(20,25%,13%)', primary: 'hsl(25,95%,53%)', text: 'hsl(30,20%,96%)' },
  },
  {
    id: 'dark-red',
    name: 'Dark Rose',
    description: 'Dark theme with red accents',
    preview: { bg: 'hsl(0,30%,9%)', card: 'hsl(0,25%,13%)', primary: 'hsl(346,77%,50%)', text: 'hsl(0,20%,96%)' },
  },
];

const themeCSS: Record<string, Record<string, string>> = {
  'dark-blue': {}, // default, no overrides needed
  'light': {
    '--background': '210 40% 98%',
    '--foreground': '222 47% 11%',
    '--card': '0 0% 100%',
    '--card-foreground': '222 47% 11%',
    '--popover': '0 0% 100%',
    '--popover-foreground': '222 47% 11%',
    '--primary': '199 89% 48%',
    '--primary-foreground': '210 40% 98%',
    '--secondary': '210 40% 96%',
    '--secondary-foreground': '222 47% 11%',
    '--muted': '210 40% 96%',
    '--muted-foreground': '215 16% 47%',
    '--accent': '210 40% 96%',
    '--accent-foreground': '222 47% 11%',
    '--border': '214 32% 91%',
    '--input': '214 32% 91%',
    '--sidebar-background': '0 0% 98%',
    '--sidebar-foreground': '240 5% 26%',
    '--sidebar-accent': '240 5% 96%',
    '--sidebar-accent-foreground': '240 6% 10%',
    '--sidebar-border': '220 13% 91%',
    '--gradient-primary': 'linear-gradient(135deg, hsl(199 89% 48%) 0%, hsl(217 91% 60%) 100%)',
    '--gradient-card': 'linear-gradient(180deg, hsl(0 0% 100%) 0%, hsl(210 40% 98%) 100%)',
  },
  'dark-green': {
    '--background': '160 30% 9%',
    '--foreground': '160 20% 95%',
    '--card': '160 30% 12%',
    '--card-foreground': '160 20% 95%',
    '--popover': '160 30% 12%',
    '--popover-foreground': '160 20% 95%',
    '--primary': '160 84% 39%',
    '--primary-foreground': '160 30% 9%',
    '--secondary': '160 20% 18%',
    '--secondary-foreground': '160 20% 95%',
    '--muted': '160 20% 15%',
    '--muted-foreground': '160 15% 60%',
    '--accent': '160 84% 39%',
    '--accent-foreground': '160 30% 9%',
    '--border': '160 20% 18%',
    '--input': '160 20% 18%',
    '--ring': '160 84% 39%',
    '--sidebar-background': '160 30% 7%',
    '--sidebar-foreground': '160 20% 95%',
    '--sidebar-primary': '160 84% 39%',
    '--sidebar-primary-foreground': '160 30% 9%',
    '--sidebar-accent': '160 20% 15%',
    '--sidebar-accent-foreground': '160 20% 95%',
    '--sidebar-border': '160 20% 15%',
    '--sidebar-ring': '160 84% 39%',
    '--gradient-primary': 'linear-gradient(135deg, hsl(160 84% 39%) 0%, hsl(140 70% 35%) 100%)',
    '--gradient-card': 'linear-gradient(180deg, hsl(160 30% 14%) 0%, hsl(160 30% 10%) 100%)',
  },
  'dark-purple': {
    '--background': '270 40% 10%',
    '--foreground': '270 20% 96%',
    '--card': '270 35% 14%',
    '--card-foreground': '270 20% 96%',
    '--popover': '270 35% 14%',
    '--popover-foreground': '270 20% 96%',
    '--primary': '270 76% 60%',
    '--primary-foreground': '270 40% 10%',
    '--secondary': '270 25% 20%',
    '--secondary-foreground': '270 20% 96%',
    '--muted': '270 25% 17%',
    '--muted-foreground': '270 15% 60%',
    '--accent': '270 76% 60%',
    '--accent-foreground': '270 40% 10%',
    '--border': '270 25% 20%',
    '--input': '270 25% 20%',
    '--ring': '270 76% 60%',
    '--sidebar-background': '270 40% 8%',
    '--sidebar-foreground': '270 20% 96%',
    '--sidebar-primary': '270 76% 60%',
    '--sidebar-primary-foreground': '270 40% 10%',
    '--sidebar-accent': '270 25% 17%',
    '--sidebar-accent-foreground': '270 20% 96%',
    '--sidebar-border': '270 25% 17%',
    '--sidebar-ring': '270 76% 60%',
    '--gradient-primary': 'linear-gradient(135deg, hsl(270 76% 60%) 0%, hsl(290 70% 50%) 100%)',
    '--gradient-card': 'linear-gradient(180deg, hsl(270 35% 16%) 0%, hsl(270 35% 12%) 100%)',
  },
  'dark-orange': {
    '--background': '20 30% 9%',
    '--foreground': '30 20% 96%',
    '--card': '20 25% 13%',
    '--card-foreground': '30 20% 96%',
    '--popover': '20 25% 13%',
    '--popover-foreground': '30 20% 96%',
    '--primary': '25 95% 53%',
    '--primary-foreground': '20 30% 9%',
    '--secondary': '20 20% 19%',
    '--secondary-foreground': '30 20% 96%',
    '--muted': '20 20% 16%',
    '--muted-foreground': '20 15% 60%',
    '--accent': '25 95% 53%',
    '--accent-foreground': '20 30% 9%',
    '--border': '20 20% 19%',
    '--input': '20 20% 19%',
    '--ring': '25 95% 53%',
    '--sidebar-background': '20 30% 7%',
    '--sidebar-foreground': '30 20% 96%',
    '--sidebar-primary': '25 95% 53%',
    '--sidebar-primary-foreground': '20 30% 9%',
    '--sidebar-accent': '20 20% 16%',
    '--sidebar-accent-foreground': '30 20% 96%',
    '--sidebar-border': '20 20% 16%',
    '--sidebar-ring': '25 95% 53%',
    '--gradient-primary': 'linear-gradient(135deg, hsl(25 95% 53%) 0%, hsl(38 92% 50%) 100%)',
    '--gradient-card': 'linear-gradient(180deg, hsl(20 25% 15%) 0%, hsl(20 25% 11%) 100%)',
  },
  'dark-red': {
    '--background': '0 30% 9%',
    '--foreground': '0 20% 96%',
    '--card': '0 25% 13%',
    '--card-foreground': '0 20% 96%',
    '--popover': '0 25% 13%',
    '--popover-foreground': '0 20% 96%',
    '--primary': '346 77% 50%',
    '--primary-foreground': '0 0% 100%',
    '--secondary': '0 20% 19%',
    '--secondary-foreground': '0 20% 96%',
    '--muted': '0 20% 16%',
    '--muted-foreground': '0 15% 60%',
    '--accent': '346 77% 50%',
    '--accent-foreground': '0 0% 100%',
    '--border': '0 20% 19%',
    '--input': '0 20% 19%',
    '--ring': '346 77% 50%',
    '--sidebar-background': '0 30% 7%',
    '--sidebar-foreground': '0 20% 96%',
    '--sidebar-primary': '346 77% 50%',
    '--sidebar-primary-foreground': '0 0% 100%',
    '--sidebar-accent': '0 20% 16%',
    '--sidebar-accent-foreground': '0 20% 96%',
    '--sidebar-border': '0 20% 16%',
    '--sidebar-ring': '346 77% 50%',
    '--gradient-primary': 'linear-gradient(135deg, hsl(346 77% 50%) 0%, hsl(330 70% 45%) 100%)',
    '--gradient-card': 'linear-gradient(180deg, hsl(0 25% 15%) 0%, hsl(0 25% 11%) 100%)',
  },
};

// Default dark-blue values to restore
const defaultDarkBlue: Record<string, string> = {
  '--background': '222 47% 11%',
  '--foreground': '210 40% 98%',
  '--card': '222 47% 14%',
  '--card-foreground': '210 40% 98%',
  '--popover': '222 47% 14%',
  '--popover-foreground': '210 40% 98%',
  '--primary': '199 89% 48%',
  '--primary-foreground': '222 47% 11%',
  '--secondary': '217 33% 22%',
  '--secondary-foreground': '210 40% 98%',
  '--muted': '217 33% 18%',
  '--muted-foreground': '215 20% 65%',
  '--accent': '199 89% 48%',
  '--accent-foreground': '222 47% 11%',
  '--border': '217 33% 22%',
  '--input': '217 33% 22%',
  '--ring': '199 89% 48%',
  '--sidebar-background': '222 47% 9%',
  '--sidebar-foreground': '210 40% 98%',
  '--sidebar-primary': '199 89% 48%',
  '--sidebar-primary-foreground': '222 47% 11%',
  '--sidebar-accent': '217 33% 18%',
  '--sidebar-accent-foreground': '210 40% 98%',
  '--sidebar-border': '217 33% 18%',
  '--sidebar-ring': '199 89% 48%',
  '--gradient-primary': 'linear-gradient(135deg, hsl(199 89% 48%) 0%, hsl(217 91% 60%) 100%)',
  '--gradient-card': 'linear-gradient(180deg, hsl(222 47% 16%) 0%, hsl(222 47% 12%) 100%)',
};

function applyTheme(themeId: string) {
  const root = document.documentElement;
  const vars = themeId === 'dark-blue' ? defaultDarkBlue : themeCSS[themeId];
  if (!vars) return;

  // First reset to defaults
  Object.entries(defaultDarkBlue).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });

  // Then apply theme overrides
  Object.entries(vars).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
}

export function useThemeSettings() {
  return useQuery({
    queryKey: ['app-settings', 'theme'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('app_settings')
        .select('*')
        .eq('key', 'theme')
        .maybeSingle();

      if (error) throw error;
      if (!data) return { theme: 'dark-blue' } as ThemeConfig;
      return data.value as unknown as ThemeConfig;
    },
    staleTime: 1000 * 60 * 5,
  });
}

// Auto-apply theme on load
export function useApplyTheme() {
  const { data } = useThemeSettings();
  useEffect(() => {
    if (data?.theme) {
      applyTheme(data.theme);
    }
  }, [data?.theme]);
}

export function ThemeSettings() {
  const queryClient = useQueryClient();
  const { data: themeConfig, isLoading } = useThemeSettings();
  const [selected, setSelected] = useState('dark-blue');

  useEffect(() => {
    if (themeConfig?.theme) {
      setSelected(themeConfig.theme);
    }
  }, [themeConfig]);

  const saveTheme = useMutation({
    mutationFn: async (themeId: string) => {
      const settings: ThemeConfig = { theme: themeId };

      const { data: existing } = await supabase
        .from('app_settings')
        .select('id')
        .eq('key', 'theme')
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('app_settings')
          .update({ value: settings as unknown as Json })
          .eq('key', 'theme');
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('app_settings')
          .insert({ key: 'theme', value: settings as unknown as Json });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app-settings', 'theme'] });
      toast.success('Theme saved!');
    },
    onError: (err: Error) => {
      toast.error(`Failed to save theme: ${err.message}`);
    },
  });

  const handleSelect = (themeId: string) => {
    setSelected(themeId);
    applyTheme(themeId); // Live preview
  };

  const handleSave = () => {
    saveTheme.mutate(selected);
  };

  if (isLoading) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="w-5 h-5 text-primary" />
          Theme
        </CardTitle>
        <CardDescription>
          Choose a color theme for the application.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {themes.map((theme) => (
            <button
              key={theme.id}
              onClick={() => handleSelect(theme.id)}
              className={cn(
                'relative rounded-xl border-2 p-1 transition-all duration-200 text-left',
                selected === theme.id
                  ? 'border-primary ring-2 ring-primary/20'
                  : 'border-border hover:border-muted-foreground/30'
              )}
            >
              {/* Theme preview */}
              <div
                className="rounded-lg overflow-hidden h-24"
                style={{ backgroundColor: theme.preview.bg }}
              >
                {/* Mini sidebar */}
                <div className="flex h-full">
                  <div
                    className="w-1/4 p-2 flex flex-col gap-1"
                    style={{ backgroundColor: theme.preview.bg, borderRight: `1px solid ${theme.preview.primary}22` }}
                  >
                    <div className="w-full h-2 rounded" style={{ backgroundColor: theme.preview.primary }} />
                    <div className="w-3/4 h-1.5 rounded opacity-40" style={{ backgroundColor: theme.preview.text }} />
                    <div className="w-3/4 h-1.5 rounded opacity-40" style={{ backgroundColor: theme.preview.text }} />
                    <div className="w-3/4 h-1.5 rounded opacity-40" style={{ backgroundColor: theme.preview.text }} />
                  </div>
                  {/* Mini content */}
                  <div className="flex-1 p-2 space-y-2">
                    <div className="w-1/2 h-2 rounded" style={{ backgroundColor: theme.preview.text, opacity: 0.8 }} />
                    <div className="flex gap-1">
                      <div className="flex-1 h-8 rounded" style={{ backgroundColor: theme.preview.card }} />
                      <div className="flex-1 h-8 rounded" style={{ backgroundColor: theme.preview.card }} />
                    </div>
                    <div className="w-full h-6 rounded" style={{ backgroundColor: theme.preview.card }} />
                  </div>
                </div>
              </div>
              {/* Label */}
              <div className="p-2 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">{theme.name}</p>
                  <p className="text-xs text-muted-foreground">{theme.description}</p>
                </div>
                {selected === theme.id && (
                  <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                    <Check className="w-3 h-3 text-primary-foreground" />
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>

        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={saveTheme.isPending}
            className="bg-gradient-primary text-primary-foreground"
          >
            {saveTheme.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Theme
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
