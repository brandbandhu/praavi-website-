import { FormEvent, useEffect, useMemo, useState } from "react";
import { Download, IndianRupee, LogOut, Plus, Printer, RefreshCw, Trash2 } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { supabase } from "@/lib/supabase";

type TransactionType = "income" | "expense";
type ReportRange = "week" | "month" | "six_months" | "nine_months" | "year";

interface FinanceTransaction {
  id: string;
  transaction_type: TransactionType;
  transaction_date: string;
  title: string;
  category: string;
  amount: number;
  payment_method: string | null;
  vendor: string | null;
  invoice_number: string | null;
  notes: string | null;
  created_by: string;
  created_at: string;
}

const SESSION_KEY = "praavi_fms_session";
const REPORT_OPTIONS: Record<ReportRange, { label: string; days: number }> = {
  week: { label: "Weekly", days: 7 },
  month: { label: "Monthly", days: 30 },
  six_months: { label: "6 Months", days: 183 },
  nine_months: { label: "9 Months", days: 274 },
  year: { label: "1 Year", days: 365 },
};

const expenseCategories = [
  "Office",
  "Marketing",
  "Salary",
  "Software",
  "Travel",
  "Fuel",
  "Rent/EMI",
  "Utilities",
  "Professional Fees",
  "Miscellaneous",
];

const incomeCategories = ["Client Payment", "Retainer", "Project Advance", "Refund", "Other Income"];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value || 0);

const toInputDate = (date: Date) => date.toISOString().slice(0, 10);

const getStartDate = (range: ReportRange) => {
  const date = new Date();
  date.setDate(date.getDate() - REPORT_OPTIONS[range].days + 1);
  return toInputDate(date);
};

const FinanceManagementSystem = () => {
  const [session, setSession] = useState(() => localStorage.getItem(SESSION_KEY));
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [transactions, setTransactions] = useState<FinanceTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [range, setRange] = useState<ReportRange>("month");
  const [form, setForm] = useState({
    transaction_type: "expense" as TransactionType,
    transaction_date: toInputDate(new Date()),
    title: "",
    category: "Office",
    amount: "",
    payment_method: "Bank Transfer",
    vendor: "",
    invoice_number: "",
    notes: "",
  });

  const startDate = useMemo(() => getStartDate(range), [range]);

  useEffect(() => {
    if (session) void loadTransactions();
  }, [session]);

  async function handleLogin(event: FormEvent) {
    event.preventDefault();
    setLoginError("");
    setLoginLoading(true);
    const { data, error } = await supabase.rpc("fms_login", {
      input_username: username.trim(),
      input_password: password,
    });
    setLoginLoading(false);

    const user = Array.isArray(data) ? data[0] : null;
    if (error || !user?.ok) {
      setLoginError("Invalid login or Supabase setup is pending.");
      return;
    }

    localStorage.setItem(SESSION_KEY, user.username);
    setSession(user.username);
  }

  async function loadTransactions() {
    setLoading(true);
    const { data, error } = await supabase
      .from("fms_transactions")
      .select("*")
      .order("transaction_date", { ascending: false })
      .order("created_at", { ascending: false });
    setLoading(false);

    if (error) {
      setSaveError("Could not load finance data. Please run the Supabase SQL setup first.");
      return;
    }

    setTransactions((data || []) as FinanceTransaction[]);
  }

  async function saveTransaction(event: FormEvent) {
    event.preventDefault();
    setSaveError("");
    const amount = Number(form.amount);
    if (!form.title.trim() || !form.category.trim() || !amount || amount < 0) {
      setSaveError("Title, category, and a valid amount are required.");
      return;
    }

    const { error } = await supabase.from("fms_transactions").insert({
      transaction_type: form.transaction_type,
      transaction_date: form.transaction_date,
      title: form.title.trim(),
      category: form.category,
      amount,
      payment_method: form.payment_method || null,
      vendor: form.vendor || null,
      invoice_number: form.invoice_number || null,
      notes: form.notes || null,
      created_by: "finance_dept_member",
    });

    if (error) {
      setSaveError("Could not save this record. Check Supabase table/policies.");
      return;
    }

    setForm((current) => ({ ...current, title: "", amount: "", vendor: "", invoice_number: "", notes: "" }));
    await loadTransactions();
  }

  async function deleteTransaction(id: string) {
    const { error } = await supabase.from("fms_transactions").delete().eq("id", id);
    if (!error) setTransactions((rows) => rows.filter((row) => row.id !== id));
  }

  function logout() {
    localStorage.removeItem(SESSION_KEY);
    setSession(null);
    setPassword("");
  }

  const filteredTransactions = useMemo(
    () => transactions.filter((item) => item.transaction_date >= startDate),
    [transactions, startDate]
  );

  const totals = useMemo(() => {
    const income = filteredTransactions
      .filter((item) => item.transaction_type === "income")
      .reduce((sum, item) => sum + Number(item.amount), 0);
    const expenses = filteredTransactions
      .filter((item) => item.transaction_type === "expense")
      .reduce((sum, item) => sum + Number(item.amount), 0);
    return { income, expenses, balance: income - expenses };
  }, [filteredTransactions]);

  const chartRows = useMemo(() => {
    const map = new Map<string, { category: string; income: number; expenses: number }>();
    filteredTransactions.forEach((item) => {
      const row = map.get(item.category) || { category: item.category, income: 0, expenses: 0 };
      if (item.transaction_type === "income") row.income += Number(item.amount);
      else row.expenses += Number(item.amount);
      map.set(item.category, row);
    });
    return Array.from(map.values()).sort((a, b) => b.expenses + b.income - (a.expenses + a.income)).slice(0, 8);
  }, [filteredTransactions]);

  function printReport() {
    const rows = filteredTransactions
      .map(
        (item) => `
          <tr>
            <td>${item.transaction_date}</td>
            <td>${item.transaction_type}</td>
            <td>${item.title}</td>
            <td>${item.category}</td>
            <td>${item.vendor || ""}</td>
            <td style="text-align:right">${formatCurrency(Number(item.amount))}</td>
          </tr>`
      )
      .join("");
    const report = window.open("", "_blank", "width=1100,height=800");
    if (!report) return;
    report.document.write(`
      <html>
        <head>
          <title>Praavi Finance Report - ${REPORT_OPTIONS[range].label}</title>
          <style>
            body{font-family:Arial,sans-serif;color:#111827;margin:32px}
            h1{font-size:24px;margin:0 0 4px}
            p{margin:0 0 20px;color:#4b5563}
            .summary{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:20px 0}
            .box{border:1px solid #d1d5db;padding:12px;border-radius:8px}
            .label{font-size:12px;color:#6b7280}.value{font-size:20px;font-weight:700;margin-top:4px}
            table{width:100%;border-collapse:collapse;margin-top:18px;font-size:12px}
            th,td{border:1px solid #d1d5db;padding:8px;text-align:left}
            th{background:#f3f4f6}
          </style>
        </head>
        <body>
          <h1>Praavi Consultants Finance Report</h1>
          <p>${REPORT_OPTIONS[range].label} report from ${startDate} to ${toInputDate(new Date())}</p>
          <div class="summary">
            <div class="box"><div class="label">Income</div><div class="value">${formatCurrency(totals.income)}</div></div>
            <div class="box"><div class="label">Expenses</div><div class="value">${formatCurrency(totals.expenses)}</div></div>
            <div class="box"><div class="label">Net Balance</div><div class="value">${formatCurrency(totals.balance)}</div></div>
          </div>
          <table>
            <thead><tr><th>Date</th><th>Type</th><th>Title</th><th>Category</th><th>Vendor</th><th>Amount</th></tr></thead>
            <tbody>${rows || '<tr><td colspan="6">No records found.</td></tr>'}</tbody>
          </table>
          <script>window.print();</script>
        </body>
      </html>
    `);
    report.document.close();
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-4">
        <form onSubmit={handleLogin} className="w-full max-w-md rounded-lg border border-white/10 bg-white p-6 text-slate-950 shadow-2xl">
          <div className="mb-6">
            <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-md bg-emerald-600 text-white">
              <IndianRupee size={22} />
            </div>
            <h1 className="text-2xl font-semibold">Finance Management System</h1>
            <p className="mt-1 text-sm text-slate-500">Praavi Consultants internal finance login</p>
          </div>
          <label className="mb-3 block text-sm font-medium">
            Username
            <input value={username} onChange={(e) => setUsername(e.target.value)} className="mt-1 w-full rounded-md border px-3 py-2" />
          </label>
          <label className="mb-4 block text-sm font-medium">
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-md border px-3 py-2"
            />
          </label>
          {loginError && <p className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{loginError}</p>}
          <button disabled={loginLoading} className="w-full rounded-md bg-emerald-600 px-4 py-2 font-medium text-white disabled:opacity-60">
            {loginLoading ? "Checking..." : "Login"}
          </button>
        </form>
      </div>
    );
  }

  const categories = form.transaction_type === "income" ? incomeCategories : expenseCategories;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-950">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <div>
            <h1 className="text-xl font-semibold">Praavi Finance Management System</h1>
            <p className="text-sm text-slate-500">Income, expenses, history, and PDF-ready reports</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={loadTransactions} className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
              <RefreshCw size={16} /> Refresh
            </button>
            <button onClick={printReport} className="inline-flex items-center gap-2 rounded-md bg-slate-950 px-3 py-2 text-sm text-white">
              <Printer size={16} /> Print PDF
            </button>
            <button onClick={logout} className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
              <LogOut size={16} /> Logout
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-5 px-4 py-5 lg:grid-cols-[360px_1fr]">
        <section className="rounded-lg border bg-white p-4">
          <h2 className="mb-4 text-base font-semibold">Add Finance Record</h2>
          <form onSubmit={saveTransaction} className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setForm((current) => ({ ...current, transaction_type: "expense", category: "Office" }))}
                className={`rounded-md border px-3 py-2 text-sm ${form.transaction_type === "expense" ? "bg-red-50 text-red-700" : ""}`}
              >
                Expense
              </button>
              <button
                type="button"
                onClick={() => setForm((current) => ({ ...current, transaction_type: "income", category: "Client Payment" }))}
                className={`rounded-md border px-3 py-2 text-sm ${form.transaction_type === "income" ? "bg-emerald-50 text-emerald-700" : ""}`}
              >
                Income
              </button>
            </div>
            <FinanceField label="Date">
              <input
                type="date"
                value={form.transaction_date}
                onChange={(e) => setForm({ ...form, transaction_date: e.target.value })}
                className="w-full rounded-md border px-3 py-2"
              />
            </FinanceField>
            <FinanceField label="Title">
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full rounded-md border px-3 py-2" />
            </FinanceField>
            <FinanceField label="Category">
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full rounded-md border px-3 py-2">
                {categories.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </FinanceField>
            <FinanceField label="Amount">
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="w-full rounded-md border px-3 py-2"
              />
            </FinanceField>
            <FinanceField label="Payment Method">
              <input
                value={form.payment_method}
                onChange={(e) => setForm({ ...form, payment_method: e.target.value })}
                className="w-full rounded-md border px-3 py-2"
              />
            </FinanceField>
            <FinanceField label="Vendor / Client">
              <input value={form.vendor} onChange={(e) => setForm({ ...form, vendor: e.target.value })} className="w-full rounded-md border px-3 py-2" />
            </FinanceField>
            <FinanceField label="Invoice / Bill No.">
              <input
                value={form.invoice_number}
                onChange={(e) => setForm({ ...form, invoice_number: e.target.value })}
                className="w-full rounded-md border px-3 py-2"
              />
            </FinanceField>
            <FinanceField label="Notes">
              <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full rounded-md border px-3 py-2" />
            </FinanceField>
            {saveError && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{saveError}</p>}
            <button className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-emerald-600 px-4 py-2 font-medium text-white">
              <Plus size={16} /> Save Record
            </button>
          </form>
        </section>

        <section className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-3">
            <SummaryTile label="Income" value={formatCurrency(totals.income)} tone="emerald" />
            <SummaryTile label="Expenses" value={formatCurrency(totals.expenses)} tone="red" />
            <SummaryTile label="Net Balance" value={formatCurrency(totals.balance)} tone="slate" />
          </div>

          <div className="rounded-lg border bg-white p-4">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold">History</h2>
                <p className="text-sm text-slate-500">
                  {REPORT_OPTIONS[range].label} view from {startDate}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(REPORT_OPTIONS) as ReportRange[]).map((key) => (
                  <button
                    key={key}
                    onClick={() => setRange(key)}
                    className={`rounded-md border px-3 py-1.5 text-sm ${range === key ? "bg-slate-950 text-white" : "bg-white"}`}
                  >
                    {REPORT_OPTIONS[key].label}
                  </button>
                ))}
                <button onClick={printReport} className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm">
                  <Download size={15} /> PDF
                </button>
              </div>
            </div>

            <div className="mb-5 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartRows}>
                  <CartesianGrid vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="category" tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={(value) => `₹${Number(value) / 1000}k`} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Bar dataKey="income" fill="#059669" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" fill="#dc2626" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="border-y bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-3 py-2">Date</th>
                    <th className="px-3 py-2">Type</th>
                    <th className="px-3 py-2">Title</th>
                    <th className="px-3 py-2">Category</th>
                    <th className="px-3 py-2">Vendor/Client</th>
                    <th className="px-3 py-2 text-right">Amount</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={7} className="px-3 py-8 text-center text-slate-500">Loading finance data...</td></tr>
                  ) : filteredTransactions.length === 0 ? (
                    <tr><td colSpan={7} className="px-3 py-8 text-center text-slate-500">No finance records in this period.</td></tr>
                  ) : (
                    filteredTransactions.map((item) => (
                      <tr key={item.id} className="border-b">
                        <td className="px-3 py-2">{item.transaction_date}</td>
                        <td className="px-3 py-2 capitalize">{item.transaction_type}</td>
                        <td className="px-3 py-2 font-medium">{item.title}</td>
                        <td className="px-3 py-2">{item.category}</td>
                        <td className="px-3 py-2">{item.vendor || "-"}</td>
                        <td className={`px-3 py-2 text-right font-semibold ${item.transaction_type === "expense" ? "text-red-700" : "text-emerald-700"}`}>
                          {formatCurrency(Number(item.amount))}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <button onClick={() => deleteTransaction(item.id)} className="rounded-md p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-700">
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

const FinanceField = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <label className="block text-sm font-medium text-slate-700">
    <span className="mb-1 block">{label}</span>
    {children}
  </label>
);

const SummaryTile = ({ label, value, tone }: { label: string; value: string; tone: "emerald" | "red" | "slate" }) => {
  const toneClass =
    tone === "emerald" ? "text-emerald-700 bg-emerald-50" : tone === "red" ? "text-red-700 bg-red-50" : "text-slate-900 bg-white";
  return (
    <div className={`rounded-lg border p-4 ${toneClass}`}>
      <div className="text-sm opacity-75">{label}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
    </div>
  );
};

export default FinanceManagementSystem;
