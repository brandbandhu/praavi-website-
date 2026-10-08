import { useEffect, useState, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Inbox, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useClients } from "@/lib/socialDesk";

const tone: Record<string, string> = {
  Planned: "bg-info/10 text-info",
  Draft: "bg-muted text-muted-foreground",
  "In Progress": "bg-warning/15 text-warning",
  "Pending Approval": "bg-warning/15 text-warning",
  Approved: "bg-violet/10 text-violet",
  Scheduled: "bg-primary/10 text-primary",
  Posted: "bg-success/10 text-success",
  Completed: "bg-success/10 text-success",
  Active: "bg-success/10 text-success",
  Paused: "bg-warning/15 text-warning",
  Archived: "bg-muted text-muted-foreground",
  Cancelled: "bg-muted text-muted-foreground line-through",
  Overdue: "bg-destructive/10 text-destructive",
  "Fund Added": "bg-success/10 text-success",
  "Ad Spend": "bg-destructive/10 text-destructive",
  Refund: "bg-warning/15 text-warning",
  Adjustment: "bg-info/10 text-info",
};
export const statusDot: Record<string, string> = {
  Planned: "bg-info",
  "In Progress": "bg-warning",
  "Pending Approval": "bg-warning",
  Approved: "bg-violet",
  Scheduled: "bg-primary",
  Posted: "bg-success",
  Cancelled: "bg-muted-foreground",
  Overdue: "bg-destructive",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap", tone[status] ?? "bg-muted text-muted-foreground")}>
      {status}
    </span>
  );
}

export function PageHeader({ title, subtitle, children }: { title: string; subtitle?: string; children?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </div>
  );
}

export function Panel({ title, action, children, className }: { title?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-xl border bg-card p-5 shadow-card", className)}>
      {title && (
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold">{title}</h3>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

const statTone = {
  primary: "bg-primary/10 text-primary",
  violet: "bg-violet/10 text-violet",
  success: "bg-success/10 text-success",
  warning: "bg-warning/15 text-warning",
  destructive: "bg-destructive/10 text-destructive",
  info: "bg-info/10 text-info",
};
export function StatCard({ label, value, icon: Icon, color = "primary", hint }: { label: string; value: ReactNode; icon: LucideIcon; color?: keyof typeof statTone; hint?: string }) {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-card transition-transform hover:-translate-y-0.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <span className={cn("grid size-8 place-items-center rounded-lg", statTone[color])}>
          <Icon className="size-4" />
        </span>
      </div>
      <div className="mt-2 font-display text-2xl font-bold">{value}</div>
      {hint && <div className="mt-0.5 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}

export function ProgressBar({ value, className }: { value: number; className?: string }) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-muted", className)}>
      <div className={cn("h-full rounded-full transition-all", v >= 100 ? "bg-success" : "bg-brand")} style={{ width: `${v}%` }} />
    </div>
  );
}

export function EmptyState({ title, text, action }: { title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-card/50 px-6 py-14 text-center">
      <div className="grid size-12 place-items-center rounded-full bg-accent text-accent-foreground">
        <Inbox className="size-5" />
      </div>
      <h3 className="mt-3 font-semibold">{title}</h3>
      {text && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{text}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ConfirmDelete({ onConfirm, label = "this record" }: { onConfirm: () => void; label?: string }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button size="icon" variant="ghost" aria-label="Delete">
          <Trash2 className="size-4 text-destructive" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {label}?</AlertDialogTitle>
          <AlertDialogDescription>This permanently removes it. This can't be undone.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export const selectCls =
  "flex h-9 w-full rounded-md border border-input bg-card px-3 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function Select({ value, onChange, options, placeholder, className }: { value: string; onChange: (v: string) => void; options: (string | { value: string; label: string })[]; placeholder?: string | undefined; className?: string | undefined }) {
  return (
    <select className={cn(selectCls, className)} value={value} onChange={(e) => onChange(e.target.value)}>
      {placeholder !== undefined && <option value="">{placeholder}</option>}
      {options.map((o) => {
        const opt = typeof o === "string" ? { value: o, label: o } : o;
        return (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        );
      })}
    </select>
  );
}

export function ClientSelect({ value, onChange, placeholder = "All clients", className }: { value: string; onChange: (v: string) => void; placeholder?: string | undefined; className?: string | undefined }) {
  const { data = [] } = useClients();
  return <Select className={className} value={value} onChange={onChange} placeholder={placeholder} options={data.filter((c) => c.status !== "Archived").map((c) => ({ value: c.id, label: c.name }))} />;
}

export type Field = {
  name: string;
  label: string;
  type?: "text" | "number" | "date" | "textarea" | "select" | "client" | "url" | "email" | "tel";
  options?: string[];
  required?: boolean;
  full?: boolean;
};

export function RecordDialog({ open, onOpenChange, title, fields, initial, onSubmit, saving }: { open: boolean; onOpenChange: (o: boolean) => void; title: string; fields: Field[]; initial: Record<string, unknown>; onSubmit: (v: Record<string, unknown>) => void; saving?: boolean }) {
  const [v, setV] = useState<Record<string, unknown>>(initial);
  useEffect(() => {
    if (open) setV(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  const set = (k: string, val: unknown) => setV((p) => ({ ...p, [k]: val }));
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form
          id="record-form"
          className="grid gap-4 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            const out: Record<string, unknown> = { ...v };
            for (const f of fields) {
              if (out[f.name] === "") out[f.name] = null;
              if (f.type === "number" && out[f.name] != null) out[f.name] = Number(out[f.name]);
            }
            onSubmit(out);
          }}
        >
          {fields.map((f) => {
            const val = (v[f.name] ?? "") as string;
            const id = `f-${f.name}`;
            return (
              <div key={f.name} className={cn("space-y-1.5", (f.full || f.type === "textarea") && "sm:col-span-2")}>
                <Label htmlFor={id}>
                  {f.label}
                  {f.required && <span className="text-destructive"> *</span>}
                </Label>
                {f.type === "textarea" ? (
                  <Textarea id={id} value={val} onChange={(e) => set(f.name, e.target.value)} rows={3} />
                ) : f.type === "select" ? (
                  <Select value={val} onChange={(x) => set(f.name, x)} options={f.options ?? []} />
                ) : f.type === "client" ? (
                  <ClientSelect value={val} onChange={(x) => set(f.name, x)} placeholder="Select client" />
                ) : (
                  <Input id={id} type={f.type ?? "text"} required={f.required} value={val} min={f.type === "number" ? 0 : undefined} step={f.type === "number" ? "any" : undefined} onChange={(e) => set(f.name, e.target.value)} />
                )}
              </div>
            );
          })}
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="record-form" disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Small hook to drive RecordDialog open/edit state. */
export function useEditor<T extends Record<string, unknown>>() {
  const [state, setState] = useState<{ open: boolean; row: Partial<T> }>({ open: false, row: {} });
  return {
    open: state.open,
    row: state.row,
    edit: (row: Partial<T>) => setState({ open: true, row }),
    setOpen: (open: boolean) => setState((s) => ({ ...s, open })),
  };
}
