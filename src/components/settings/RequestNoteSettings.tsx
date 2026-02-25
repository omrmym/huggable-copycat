import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Save, Loader2, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function RequestNoteSettings() {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("Request Submitted!");
  const [message, setMessage] = useState(
    "Your connection request has been submitted successfully. An admin will review and approve your request soon."
  );
  const [note, setNote] = useState(
    "Note: Requests not approved within 48 hours will be automatically removed."
  );

  const { data: settings } = useQuery({
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

  useEffect(() => {
    if (settings?.value) {
      const val = settings.value as any;
      if (val.title) setTitle(val.title);
      if (val.message) setMessage(val.message);
      if (val.note) setNote(val.note);
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const value = { title, message, note };
      if (settings?.id) {
        const { error } = await supabase
          .from("app_settings")
          .update({ value: value as any, updated_at: new Date().toISOString() })
          .eq("id", settings.id);
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
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  return (
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
          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
