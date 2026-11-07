import { FormEvent, useEffect, useState } from "react";
import { DIWALI_PAGE_SIZE, fetchDiwaliGreetings, type DiwaliGreeting } from "@/lib/diwaliGreetingApi";

export default function DiwaliGreetingsPanel() {
  const [rows, setRows] = useState<DiwaliGreeting[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(0);
  const [draft, setDraft] = useState("");
  const [search, setSearch] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const buttonClass = "px-4 py-2 rounded-lg text-sm font-semibold border border-border hover:bg-secondary disabled:opacity-50";

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    fetchDiwaliGreetings(page, search).then((result) => {
      if (!active) return;
      setRows(result.rows);
      setCount(result.count);
    }).catch(() => {
      if (active) setError("Could not load Diwali wishes. Check your connection and ensure database/supabase-diwali-greetings.sql has been run in Supabase.");
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [page, search, refresh]);

  const onSearch = (event: FormEvent) => {
    event.preventDefault();
    setPage(0);
    setSearch(draft.trim());
    setRefresh((value) => value + 1);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-semibold">Diwali Wishes</h2>
          <p className="text-sm text-muted-foreground mt-1">Names submitted on the Diwali greeting page. Each greeting submission is listed separately.</p>
        </div>
        <button type="button" disabled={loading} onClick={() => setRefresh((value) => value + 1)} className={buttonClass}>Refresh</button>
      </div>
      <form onSubmit={onSearch} className="flex flex-wrap gap-2">
        <input aria-label="Search Diwali names" placeholder="Search by name" value={draft} onChange={(event) => setDraft(event.target.value)} className="bg-background border border-border rounded-lg px-3 py-2 text-sm" />
        <button className={buttonClass} type="submit">Search</button>
      </form>
      {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : loading ? (
        <p role="status">Loading Diwali wishes…</p>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">{count} {search ? "matching" : "total"} submissions</p>
          {rows.length === 0 ? <p className="text-sm">{search ? "No names match your search." : "No Diwali wishes submitted yet."}</p> : (
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-sm text-left">
                <thead className="bg-secondary"><tr><th scope="col" className="p-3">#</th><th scope="col" className="p-3">Name</th><th scope="col" className="p-3">Submitted (IST)</th></tr></thead>
                <tbody>{rows.map((row, index) => (
                  <tr key={row.id} className="border-t border-border">
                    <td className="p-3">{page * DIWALI_PAGE_SIZE + index + 1}</td>
                    <td className="p-3 font-medium">{row.name}</td>
                    <td className="p-3 whitespace-nowrap">{new Date(row.created_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
          <div className="flex items-center gap-3">
            <button type="button" className={buttonClass} disabled={page === 0} onClick={() => setPage((value) => value - 1)}>Previous</button>
            <span className="text-sm">Page {page + 1} of {Math.max(1, Math.ceil(count / DIWALI_PAGE_SIZE))}</span>
            <button type="button" className={buttonClass} disabled={(page + 1) * DIWALI_PAGE_SIZE >= count} onClick={() => setPage((value) => value + 1)}>Next</button>
          </div>
        </>
      )}
    </div>
  );
}
