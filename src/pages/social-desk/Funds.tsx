import { useMemo, useState } from "react";
import { Download, Edit2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDelete, EmptyState, PageHeader, Panel, RecordDialog, Select, StatCard, StatusBadge, useEditor, type Field } from "@/components/social-desk/ui";
import { TXN_TYPES, businessName, clientBalance, downloadCSV, inr, useClients, useRemove, useSave, useSettings, useTxns, type Txn } from "@/lib/socialDesk";
import { Wallet, TrendingDown, TrendingUp } from "lucide-react";

const txnFields: Field[] = [
  { name: "client_id", label: "Business name", type: "client", required: true },
  { name: "txn_type", label: "Type", type: "select", options: TXN_TYPES },
  { name: "amount", label: "Amount", type: "number", required: true },
  { name: "txn_date", label: "Date", type: "date", required: true },
  { name: "payment_method", label: "Payment method" },
  { name: "reference", label: "Reference" },
  { name: "notes", label: "Notes", type: "textarea", full: true },
];

export default function FundsPage() {
  const [client, setClient] = useState("");
  const editor = useEditor<Txn>();
  const save = useSave("social_desk_transactions");
  const remove = useRemove("social_desk_transactions");
  const { data: txns = [] } = useTxns();
  const { data: clients = [] } = useClients();
  const { data: settings } = useSettings();
  const getBusinessName = (id: string) => businessName(clients.find((c) => c.id === id));

  const filtered = useMemo(() => txns.filter((t) => !client || t.client_id === client), [client, txns]);
  const balance = clientBalance(filtered);
  const lowClients = clients.filter((c) => clientBalance(txns, c.id).balance <= (settings?.low_balance_threshold ?? 1000));
  const initial = { txn_type: "Fund Added", txn_date: new Date().toISOString().slice(0, 10), amount: 0, ...editor.row };

  return (
    <div className="space-y-5">
      <PageHeader title="Funds" subtitle="Monitor deposits, ad spend, refunds, and low balances.">
        <Button variant="outline" onClick={() => downloadCSV(filtered as unknown as Record<string, unknown>[], "funds")}>
          <Download /> Export
        </Button>
        <Button onClick={() => editor.edit({ client_id: client || undefined })}>
          <Plus /> Add transaction
        </Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Funds added" value={inr(balance.added)} icon={TrendingUp} color="success" />
        <StatCard label="Ad spend" value={inr(balance.spent)} icon={TrendingDown} color="destructive" />
        <StatCard label="Balance" value={inr(balance.balance)} icon={Wallet} color={balance.balance < 0 ? "destructive" : "primary"} hint={`${lowClients.length} low-balance businesses`} />
      </div>

      <Panel>
        <div className="mb-4 max-w-sm">
          <Select value={client} onChange={setClient} placeholder="All businesses" options={clients.map((c) => ({ value: c.id, label: businessName(c) }))} />
        </div>

        {filtered.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-sm">
              <thead className="border-b text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="py-3 pr-4">Date</th>
                  <th className="py-3 pr-4">Business</th>
                  <th className="py-3 pr-4">Type</th>
                  <th className="py-3 pr-4">Amount</th>
                  <th className="py-3 pr-4">Reference</th>
                  <th className="py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((t) => (
                  <tr key={t.id}>
                    <td className="py-3 pr-4">{t.txn_date}</td>
                    <td className="py-3 pr-4">{getBusinessName(t.client_id)}</td>
                    <td className="py-3 pr-4"><StatusBadge status={t.txn_type} /></td>
                    <td className="py-3 pr-4 font-medium">{inr(t.amount)}</td>
                    <td className="py-3 pr-4 text-muted-foreground">{t.reference || t.payment_method || "-"}</td>
                    <td className="py-3">
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" aria-label="Edit" onClick={() => editor.edit(t)}>
                          <Edit2 />
                        </Button>
                        <ConfirmDelete label="transaction" onConfirm={() => remove.mutate(t.id)} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title="No transactions found" text="Add a fund entry or choose another business." />
        )}
      </Panel>

      <RecordDialog
        open={editor.open}
        onOpenChange={editor.setOpen}
        title={editor.row.id ? "Edit transaction" : "Add transaction"}
        fields={txnFields}
        initial={initial}
        saving={save.isPending}
        onSubmit={(row) => save.mutate(row, { onSuccess: () => editor.setOpen(false) })}
      />
    </div>
  );
}



