import { useState, useRef, forwardRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Image, Upload, Trash2, Save, Loader2, Network } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';

interface BrandingConfig {
  logo_url: string | null;
  company_name: string;
  company_subtitle: string;
}

const DEFAULT_BRANDING: BrandingConfig = {
  logo_url: null,
  company_name: 'MikroBill',
  company_subtitle: 'RADIUS Manager',
};

export function useBrandingSettings() {
  return useQuery({
    queryKey: ['app-settings', 'branding'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('app_settings')
        .select('*')
        .eq('key', 'branding')
        .maybeSingle();

      if (error) throw error;
      if (!data) return DEFAULT_BRANDING;
      return data.value as unknown as BrandingConfig;
    },
    staleTime: 1000 * 60 * 5,
  });
}

export const BrandingSettings = forwardRef<HTMLDivElement>(function BrandingSettings(_props, _ref) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data: branding, isLoading } = useBrandingSettings();
  const [companyName, setCompanyName] = useState('');
  const [companySubtitle, setCompanySubtitle] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  // Initialize form when data loads
  if (branding && !initialized) {
    setCompanyName(branding.company_name);
    setCompanySubtitle(branding.company_subtitle);
    setPreviewUrl(branding.logo_url);
    setInitialized(true);
  }

  const uploadLogo = useMutation({
    mutationFn: async (file: File) => {
      const fileExt = file.name.split('.').pop();
      const fileName = `logo.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('branding')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('branding')
        .getPublicUrl(fileName);

      return urlData.publicUrl + '?t=' + Date.now();
    },
    onSuccess: (url) => {
      setPreviewUrl(url);
      toast.success('Logo uploaded!');
    },
    onError: (err: Error) => {
      toast.error(`Upload failed: ${err.message}`);
    },
  });

  const saveBranding = useMutation({
    mutationFn: async () => {
      const settings: BrandingConfig = {
        logo_url: previewUrl,
        company_name: companyName,
        company_subtitle: companySubtitle,
      };

      const { data: existing } = await supabase
        .from('app_settings')
        .select('id')
        .eq('key', 'branding')
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('app_settings')
          .update({ value: settings as unknown as Json })
          .eq('key', 'branding');
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('app_settings')
          .insert({ key: 'branding', value: settings as unknown as Json });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app-settings', 'branding'] });
      toast.success('Branding settings saved!');
    },
    onError: (err: Error) => {
      toast.error(`Failed to save: ${err.message}`);
    },
  });

  const removeLogo = () => {
    setPreviewUrl(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('File size must be under 2MB');
        return;
      }
      uploadLogo.mutate(file);
    }
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
          <Image className="w-5 h-5 text-primary" />
          Branding & Logo
        </CardTitle>
        <CardDescription>
          Customize the logo and company name displayed in the sidebar.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-start gap-6">
          {/* Logo Preview */}
          <div className="flex flex-col items-center gap-3">
            <div className="w-20 h-20 rounded-xl bg-muted/50 border-2 border-dashed border-border flex items-center justify-center overflow-hidden">
              {previewUrl ? (
                <img src={previewUrl} alt="Logo" className="w-full h-full object-contain p-1" />
              ) : (
                <Network className="w-8 h-8 text-muted-foreground" />
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadLogo.isPending}
              >
                {uploadLogo.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
              </Button>
              {previewUrl && (
                <Button variant="outline" size="sm" onClick={removeLogo}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/svg+xml,image/webp"
              className="hidden"
              onChange={handleFileChange}
            />
            <p className="text-xs text-muted-foreground text-center">PNG, JPG, SVG<br />Max 2MB</p>
          </div>

          {/* Name Fields */}
          <div className="flex-1 space-y-4">
            <div className="space-y-2">
              <Label>Company Name</Label>
              <Input
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="MikroBill"
                className="bg-secondary border-border"
              />
            </div>
            <div className="space-y-2">
              <Label>Subtitle</Label>
              <Input
                value={companySubtitle}
                onChange={(e) => setCompanySubtitle(e.target.value)}
                placeholder="RADIUS Manager"
                className="bg-secondary border-border"
              />
            </div>
          </div>
        </div>

        {/* Live Preview */}
        <div className="bg-muted/30 rounded-lg p-4 border border-border">
          <p className="text-xs text-muted-foreground mb-3">Preview</p>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center overflow-hidden">
              {previewUrl ? (
                <img src={previewUrl} alt="Logo" className="w-full h-full object-contain p-1" />
              ) : (
                <Network className="w-6 h-6 text-primary-foreground" />
              )}
            </div>
            <div>
              <h1 className="font-bold text-foreground">{companyName || 'MikroBill'}</h1>
              <p className="text-xs text-muted-foreground">{companySubtitle || 'RADIUS Manager'}</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            onClick={() => saveBranding.mutate()}
            disabled={saveBranding.isPending}
            className="bg-gradient-primary text-primary-foreground"
          >
            {saveBranding.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Branding
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});
