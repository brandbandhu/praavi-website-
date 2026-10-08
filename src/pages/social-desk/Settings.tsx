import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader, Panel } from "@/components/social-desk/ui";
import { useSave, useSettings } from "@/lib/socialDesk";

export default function SettingsPage() {
  const { data } = useSettings();
  const save = useSave("social_desk_settings");
  const [form, setForm] = useState<Record<string, string | number>>({});

  useEffect(() => {
    if (data) setForm(data as unknown as Record<string, string | number>);
  }, [data]);

  const set = (name: string, value: string | number) => setForm((prev) => ({ ...prev, [name]: value }));

  return (
    <div className="space-y-5">
      <PageHeader title="Settings" subtitle="Agency defaults used across client setup and fund alerts." />
      <Panel>
        <form
          className="grid gap-5 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate({ ...form, id: 1 });
          }}
        >
          <Field label="Agency name" name="agency_name" value={form.agency_name} onChange={set} />
          <Field label="Contact" name="contact" value={form.contact} onChange={set} />
          <Field label="Currency" name="currency" value={form.currency} onChange={set} />
          <Field label="Timezone" name="timezone" value={form.timezone} onChange={set} />
          <Field label="Default posts" name="default_post_target" type="number" value={form.default_post_target} onChange={set} />
          <Field label="Default reels" name="default_reel_target" type="number" value={form.default_reel_target} onChange={set} />
          <Field label="Default group shares" name="default_group_target" type="number" value={form.default_group_target} onChange={set} />
          <Field label="Low balance threshold" name="low_balance_threshold" type="number" value={form.low_balance_threshold} onChange={set} />
          <div className="sm:col-span-2">
            <Button type="submit" disabled={save.isPending}>
              <Save /> {save.isPending ? "Saving..." : "Save settings"}
            </Button>
          </div>
        </form>
      </Panel>
    </div>
  );
}

function Field({ label, name, value, type = "text", onChange }: { label: string; name: string; value: unknown; type?: "text" | "number"; onChange: (name: string, value: string | number) => void }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        type={type}
        value={String(value ?? "")}
        onChange={(e) => onChange(name, type === "number" ? Number(e.target.value) : e.target.value)}
      />
    </div>
  );
}


