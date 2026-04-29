import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { UserPlus, Trash2 } from "lucide-react";

export const Route = createFileRoute("/merchant/employees")({
  component: EmployeesPage,
});

type EmployeeRow = { user_id: string; full_name: string | null; email: string | null };

function EmployeesPage() {
  const [employees, setEmployees] = useState<EmployeeRow[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", fullName: "", phone: "" });
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const { data: roles } = await supabase.from("user_roles").select("user_id").eq("role", "employee");
    const ids = (roles ?? []).map((r) => r.user_id);
    if (ids.length === 0) { setEmployees([]); return; }
    const { data: profiles } = await supabase.from("profiles").select("id, full_name, email").in("id", ids);
    setEmployees((profiles ?? []).map((p) => ({ user_id: p.id, full_name: p.full_name, email: p.email })));
  };

  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!form.email || !form.password || !form.fullName) { toast.error("All fields required"); return; }
    setBusy(true);
    // Sign up with admin still signed in — uses anon signup. After signup, we re-assign role and re-restore admin session via current session.
    // Since signUp triggers a session swap, we capture admin session first.
    const { data: adminSession } = await supabase.auth.getSession();
    const { data: signUp, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { full_name: form.fullName, phone: form.phone } },
    });
    if (error || !signUp.user) { setBusy(false); toast.error(error?.message ?? "Failed"); return; }
    const newUserId = signUp.user.id;
    // restore admin session
    if (adminSession.session) {
      await supabase.auth.setSession({
        access_token: adminSession.session.access_token,
        refresh_token: adminSession.session.refresh_token,
      });
    }
    // assign employee role (and remove default customer)
    await supabase.from("user_roles").delete().eq("user_id", newUserId).eq("role", "customer");
    const { error: roleErr } = await supabase.from("user_roles").insert({ user_id: newUserId, role: "employee" });
    setBusy(false);
    if (roleErr) { toast.error(roleErr.message); return; }
    toast.success("Employee created");
    setOpen(false);
    setForm({ email: "", password: "", fullName: "", phone: "" });
    load();
  };

  const remove = async (userId: string) => {
    if (!confirm("Remove employee role from this user?")) return;
    const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", "employee");
    if (error) toast.error(error.message); else { toast.success("Removed"); load(); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Employees</h1>
          <p className="text-muted-foreground">Staff accounts with Cook Mode access.</p>
        </div>
        <Button variant="hero" onClick={() => setOpen(true)}><UserPlus className="mr-1 h-4 w-4" />New employee</Button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-soft">
        <table className="w-full text-sm">
          <thead className="bg-secondary/60 text-left text-xs uppercase text-muted-foreground">
            <tr><th className="px-4 py-3">Name</th><th className="px-4 py-3">Email</th><th className="px-4 py-3"></th></tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {employees.map((e) => (
              <tr key={e.user_id}>
                <td className="px-4 py-3">{e.full_name ?? "—"}</td>
                <td className="px-4 py-3">{e.email}</td>
                <td className="px-4 py-3 text-right">
                  <Button variant="ghost" size="icon" onClick={() => remove(e.user_id)}><Trash2 className="h-4 w-4" /></Button>
                </td>
              </tr>
            ))}
            {employees.length === 0 && <tr><td colSpan={3} className="px-4 py-12 text-center text-muted-foreground">No employees yet.</td></tr>}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New employee</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2"><Label>Full name</Label><Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} /></div>
            <div className="space-y-2"><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div className="space-y-2"><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            <div className="space-y-2"><Label>Temporary password</Label><Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button variant="hero" onClick={create} disabled={busy}>{busy ? "Creating…" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
