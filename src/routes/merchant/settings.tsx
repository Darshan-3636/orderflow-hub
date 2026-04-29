import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Upload } from "lucide-react";

export const Route = createFileRoute("/merchant/settings")({
  component: SettingsPage,
});

type Settings = { id: string; name: string; tagline: string | null; logo_url: string | null; banner_url: string | null };

function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [saving, setSaving] = useState(false);
  const [pwd, setPwd] = useState("");

  useEffect(() => {
    supabase.from("restaurant_settings").select("*").maybeSingle().then(async ({ data }) => {
      if (data) { setSettings(data as Settings); return; }
      const { data: created } = await supabase.from("restaurant_settings").insert({ name: "My Restaurant" }).select().single();
      setSettings(created as Settings);
    });
  }, []);

  const upload = async (bucket: string, file: File) => {
    const path = `${crypto.randomUUID()}-${file.name}`;
    const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: false });
    if (error) { toast.error(error.message); return null; }
    return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
  };

  const save = async () => {
    if (!settings) return;
    setSaving(true);
    const { error } = await supabase.from("restaurant_settings").update({
      name: settings.name, tagline: settings.tagline, logo_url: settings.logo_url, banner_url: settings.banner_url,
    }).eq("id", settings.id);
    setSaving(false);
    if (error) toast.error(error.message); else toast.success("Saved");
  };

  const changePassword = async () => {
    if (pwd.length < 6) { toast.error("Min 6 characters"); return; }
    const { error } = await supabase.auth.updateUser({ password: pwd });
    if (error) toast.error(error.message); else { toast.success("Password updated"); setPwd(""); }
  };

  if (!settings) return <p className="text-muted-foreground">Loading…</p>;

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Restaurant profile and account.</p>
      </div>

      <section className="space-y-4 rounded-2xl border border-border/60 bg-card p-6 shadow-soft">
        <h2 className="font-display text-lg font-semibold">Restaurant profile</h2>
        <div className="space-y-2"><Label>Name</Label><Input value={settings.name} onChange={(e) => setSettings({ ...settings, name: e.target.value })} /></div>
        <div className="space-y-2"><Label>Tagline</Label><Textarea rows={2} value={settings.tagline ?? ""} onChange={(e) => setSettings({ ...settings, tagline: e.target.value })} /></div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Logo</Label>
            {settings.logo_url && <img src={settings.logo_url} alt="logo" className="h-20 w-20 rounded-lg object-cover" />}
            <label className="flex w-fit cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border bg-secondary/40 px-3 py-2 text-sm">
              <Upload className="h-4 w-4" />Upload
              <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                const f = e.target.files?.[0]; if (!f) return;
                const url = await upload("restaurant-assets", f); if (url) setSettings({ ...settings, logo_url: url });
              }} />
            </label>
          </div>
          <div className="space-y-2">
            <Label>Banner</Label>
            {settings.banner_url && <img src={settings.banner_url} alt="banner" className="h-20 w-full rounded-lg object-cover" />}
            <label className="flex w-fit cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border bg-secondary/40 px-3 py-2 text-sm">
              <Upload className="h-4 w-4" />Upload
              <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                const f = e.target.files?.[0]; if (!f) return;
                const url = await upload("restaurant-assets", f); if (url) setSettings({ ...settings, banner_url: url });
              }} />
            </label>
          </div>
        </div>

        <Button variant="hero" onClick={save} disabled={saving}>{saving ? "Saving…" : "Save changes"}</Button>
      </section>

      <section className="space-y-4 rounded-2xl border border-border/60 bg-card p-6 shadow-soft">
        <h2 className="font-display text-lg font-semibold">Change password</h2>
        <div className="space-y-2"><Label>New password</Label><Input type="password" value={pwd} onChange={(e) => setPwd(e.target.value)} /></div>
        <Button variant="soft" onClick={changePassword}>Update password</Button>
      </section>
    </div>
  );
}
