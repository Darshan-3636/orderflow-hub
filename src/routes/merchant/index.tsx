import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/merchant/")({
  component: MerchantHome,
});

function MerchantHome() {
  return (
    <div>
      <h1 className="font-display text-3xl font-bold">Welcome back 👋</h1>
      <p className="mt-2 text-muted-foreground">Use the sidebar to manage Cook Mode, Menu, Orders, Reviews, Employees, and Settings.</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { title: "Cook Mode", desc: "Live kitchen display for active orders." },
          { title: "Menu", desc: "Add, edit and toggle stock for items and categories." },
          { title: "Orders", desc: "Browse and filter all order history." },
          { title: "Reviews", desc: "Latest customer feedback and ratings." },
          { title: "Employees", desc: "Create staff accounts for Cook Mode." },
          { title: "Settings", desc: "Restaurant logo, banner, and password." },
        ].map((c) => (
          <div key={c.title} className="rounded-2xl border border-border/60 bg-card p-6 shadow-soft">
            <h3 className="font-display text-lg font-semibold">{c.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{c.desc}</p>
          </div>
        ))}
      </div>
      <p className="mt-8 rounded-xl border border-dashed border-border bg-secondary/40 p-4 text-sm text-muted-foreground">
        Full analytics, KDS, menu CRUD, reviews, and employee management are scaffolded and will be enriched in the next iteration.
      </p>
    </div>
  );
}
