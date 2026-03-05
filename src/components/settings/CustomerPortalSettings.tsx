import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Save, Loader2, Globe, Link2, Copy, Check, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function CustomerPortalSettings() {
  const queryClient = useQueryClient();

  // Request Success Note state
  const [title, setTitle] = useState("Request Submitted!");
  const [message, setMessage] = useState(
    "Your connection request has been submitted successfully. An admin will review and approve your request soon."
  );
  const [note, setNote] = useState(
    "Note: Requests not approved within 48 hours will be automatically removed."
  );

  // Portal Settings state
  const [portalEnabled, setPortalEnabled] = useState(true);
  const [autoLoginEnabled, setAutoLoginEnabled] = useState(true);

  const { data: noteSettings } = useQuery({
    queryKey: ["app-settings", "request_success_note"],
    queryFn: async () => {
      const { data } = await supabase
        .from("app_settings")
        .select("*")
        .eq("key", "request_success_note")
        .maybeSingle();
      return data;
    },
  });

  const { data: portalSettings } = useQuery({
    queryKey: ["app-settings", "customer_portal"],
    queryFn: async () => {
      const { data } = await supabase
        .from("app_settings")
        .select("*")
        .eq("key", "customer_portal")
        .maybeSingle();
      return data;
    },
  });

  useEffect(() => {
    if (noteSettings?.value) {
      const val = noteSettings.value as any;
      if (val.title) setTitle(val.title);
      if (val.message) setMessage(val.message);
      if (val.note) setNote(val.note);
    }
  }, [noteSettings]);

  useEffect(() => {
    if (portalSettings?.value) {
      const val = portalSettings.value as any;
      if (typeof val.enabled === 'boolean') setPortalEnabled(val.enabled);
      if (typeof val.auto_login_enabled === 'boolean') setAutoLoginEnabled(val.auto_login_enabled);
    }
  }, [portalSettings]);

  const saveNoteMutation = useMutation({
    mutationFn: async () => {
      const value = { title, message, note };
      if (noteSettings?.id) {
        const { error } = await supabase
          .from("app_settings")
          .update({ value: value as any, updated_at: new Date().toISOString() })
          .eq("id", noteSettings.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("app_settings")
          .insert({ key: "request_success_note", value: value as any });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["app-settings", "request_success_note"] });
      toast.success("Request success note saved!");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const savePortalMutation = useMutation({
    mutationFn: async () => {
      const value = { enabled: portalEnabled, auto_login_enabled: autoLoginEnabled };
      if (portalSettings?.id) {
        const { error } = await supabase
          .from("app_settings")
          .update({ value: value as any, updated_at: new Date().toISOString() })
          .eq("id", portalSettings.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("app_settings")
          .insert({ key: "customer_portal", value: value as any });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["app-settings", "customer_portal"] });
      toast.success("Portal settings saved!");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const [copiedLogin, setCopiedLogin] = useState(false);
  const [copiedRequest, setCopiedRequest] = useState(false);
  const portalLoginUrl = `${window.location.origin}/portal/login`;
  const portalRequestUrl = `${window.location.origin}/portal/request`;

  const copyUrl = (url: string, type: 'login' | 'request') => {
    navigator.clipboard.writeText(url);
    if (type === 'login') {
      setCopiedLogin(true);
      setTimeout(() => setCopiedLogin(false), 2000);
    } else {
      setCopiedRequest(true);
      setTimeout(() => setCopiedRequest(false), 2000);
    }
    toast.success("URL copied!");
  };

  return (
    <div className="space-y-6">
      {/* Portal General Settings */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary" />
            Customer Portal
          </CardTitle>
          <CardDescription>
            Configure customer-facing portal settings and access options.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Toggle: Portal Enabled */}
          <div className="flex items-center justify-between rounded-lg border border-border p-4 bg-muted/30">
            <div className="space-y-0.5">
              <Label className="font-medium">Enable Customer Portal</Label>
              <p className="text-sm text-muted-foreground">
                Allow customers to access the self-service portal.
              </p>
            </div>
            <Switch checked={portalEnabled} onCheckedChange={setPortalEnabled} />
          </div>

          {/* Toggle: Auto Login */}
          <div className="flex items-center justify-between rounded-lg border border-border p-4 bg-muted/30">
            <div className="space-y-0.5">
              <Label className="font-medium">Auto Login Links</Label>
              <p className="text-sm text-muted-foreground">
                Allow customers to access their dashboard via direct auto-login URLs.
              </p>
            </div>
            <Switch checked={autoLoginEnabled} onCheckedChange={setAutoLoginEnabled} />
          </div>

          <div className="flex justify-end">
            <Button onClick={() => savePortalMutation.mutate()} disabled={savePortalMutation.isPending}>
              {savePortalMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Save Settings
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Portal URLs */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="w-5 h-5 text-primary" />
            Portal URLs
          </CardTitle>
          <CardDescription>
            Share these URLs with customers to access the portal.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Customer Login URL</Label>
            <div className="flex gap-2">
              <Input value={portalLoginUrl} readOnly className="bg-secondary border-border font-mono text-sm" />
              <Button variant="outline" size="icon" onClick={() => copyUrl(portalLoginUrl, 'login')}>
                {copiedLogin ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label>New Connection Request URL</Label>
            <div className="flex gap-2">
              <Input value={portalRequestUrl} readOnly className="bg-secondary border-border font-mono text-sm" />
              <Button variant="outline" size="icon" onClick={() => copyUrl(portalRequestUrl, 'request')}>
                {copiedRequest ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Request Success Note */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Request Success Note
          </CardTitle>
          <CardDescription>
            Customize the message shown after a user submits a connection request.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Request Submitted!"
              className="bg-secondary border-border"
            />
          </div>
          <div className="space-y-2">
            <Label>Success Message</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Your connection request has been submitted..."
              className="bg-secondary border-border min-h-[80px]"
            />
          </div>
          <div className="space-y-2">
            <Label>Additional Note</Label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Note: Requests not approved within 48 hours..."
              className="bg-secondary border-border min-h-[60px]"
            />
          </div>
          <div className="flex justify-end">
            <Button onClick={() => saveNoteMutation.mutate()} disabled={saveNoteMutation.isPending}>
              {saveNoteMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Save Note
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
