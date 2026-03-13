import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import PageHero from "@/components/PageHero";
import SeoHead from "@/components/SeoHead";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fetchLeadSheetRows, type LeadSheetRow } from "@/lib/leadsSheetApi";

const TABLE_COLUMNS = [
  { key: "submitted_at", label: "Submitted At" },
  { key: "source_form", label: "Source Form" },
  { key: "name", label: "Name" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone" },
  { key: "service", label: "Service" },
  { key: "message", label: "Message" },
  { key: "source_page", label: "Source Page" },
] as const;

const formatDateTime = (value?: string) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
};

const ViewDetailsPage = () => {
  const [rows, setRows] = useState<LeadSheetRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadRows = useCallback(async (silent = false) => {
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");
    try {
      const data = await fetchLeadSheetRows();
      setRows(data);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load sheet data.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadRows();
    const interval = window.setInterval(() => {
      void loadRows(true);
    }, 30000);

    return () => {
      window.clearInterval(interval);
    };
  }, [loadRows]);

  const totalRows = useMemo(() => rows.length, [rows]);

  return (
    <>
      <SeoHead
        title="Lead Details | Praavi Consultants"
        description="View latest lead records from Google Sheets in table format."
        canonicalPath="/viewdetails"
        noIndex
      />
      <PageHero
        title="Lead Details"
        subtitle="Live records synced from Google Sheets."
        badge="Internal View"
      />

      <section className="section-padding">
        <div className="container-max">
          <div className="service-card p-4 sm:p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-sm text-muted-foreground">
                <span>Total Rows: {totalRows}</span>
                {lastUpdated ? (
                  <span className="ml-3">Last Updated: {lastUpdated.toLocaleTimeString()}</span>
                ) : null}
              </div>
              <Button
                type="button"
                onClick={() => void loadRows(true)}
                disabled={loading || refreshing}
                className="inline-flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>

            {error ? (
              <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            ) : null}

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  {TABLE_COLUMNS.map((column) => (
                    <TableHead key={column.key}>{column.label}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={TABLE_COLUMNS.length + 1} className="text-center text-muted-foreground">
                      Loading records...
                    </TableCell>
                  </TableRow>
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={TABLE_COLUMNS.length + 1} className="text-center text-muted-foreground">
                      No records found.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((row, index) => (
                    <TableRow key={`${row.submitted_at || "row"}-${index}`}>
                      <TableCell>{index + 1}</TableCell>
                      {TABLE_COLUMNS.map((column) => (
                        <TableCell key={column.key} className="align-top">
                          {column.key === "submitted_at"
                            ? formatDateTime(row[column.key])
                            : row[column.key] || ""}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </section>
    </>
  );
};

export default ViewDetailsPage;
