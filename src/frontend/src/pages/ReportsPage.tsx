import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BarChart3, Printer } from "lucide-react";
import { useState } from "react";
import { PaymentStatus } from "../backend";
import {
  useAllFeeRecordsForMonth,
  useAllStudents,
  useSettings,
  useTotalIncomeForMonth,
} from "../hooks/useQueries";

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}
function getMonthLabel(month: string) {
  const [y, m] = month.split("-");
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
}

export default function ReportsPage() {
  const [month, setMonth] = useState(currentMonth());

  const { data: settings } = useSettings();
  const { data: students = [], isLoading: loadingStudents } = useAllStudents();
  const { data: totalIncome, isLoading: loadingIncome } =
    useTotalIncomeForMonth(month);
  const { data: feeRecords = {}, isLoading: loadingFees } =
    useAllFeeRecordsForMonth(month, students);

  const isLoading = loadingStudents || loadingIncome || loadingFees;

  return (
    <div className="min-h-full bg-background px-4 py-6 max-w-3xl mx-auto print-area">
      {/* Header (no-print) */}
      <div className="flex items-center justify-between mb-4 no-print">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reports</h1>
          <p className="text-sm text-muted-foreground">Monthly summary</p>
        </div>
        <Button
          variant="outline"
          onClick={() => window.print()}
          data-ocid="reports.print.button"
        >
          <Printer className="w-4 h-4 mr-2" />
          Print / PDF
        </Button>
      </div>

      {/* Month Selector (no-print) */}
      <div className="flex items-center gap-2 mb-6 no-print">
        <Label className="text-sm shrink-0">Month:</Label>
        <Input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="flex-1 max-w-xs"
          data-ocid="reports.month.input"
        />
      </div>

      {/* Print Header (print-only) */}
      <div className="hidden print:block mb-6">
        <h1 className="text-2xl font-bold">
          {settings?.instituteName ?? "Tuition Center"}
        </h1>
        <h2 className="text-lg font-medium">
          Monthly Report — {getMonthLabel(month)}
        </h2>
        <p className="text-sm text-gray-500">
          Generated: {new Date().toLocaleDateString("en-IN")}
        </p>
      </div>

      {/* Summary Header */}
      <div className="bg-card rounded-2xl shadow-card p-4 mb-6">
        <h2 className="text-lg font-bold mb-1">{getMonthLabel(month)}</h2>
        <div className="flex items-center gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Total Students</p>
            <p className="text-2xl font-bold">{students.length}</p>
          </div>
          <div className="w-px h-10 bg-border" />
          <div>
            <p className="text-xs text-muted-foreground">Total Income</p>
            {loadingIncome ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <p className="text-2xl font-bold text-green-600">
                ₹{Number(totalIncome ?? 0n).toLocaleString("en-IN")}
              </p>
            )}
          </div>
          <div className="w-px h-10 bg-border" />
          <div>
            <p className="text-xs text-muted-foreground">Pending Count</p>
            <p className="text-2xl font-bold text-destructive">
              {
                Object.values(feeRecords).filter(
                  (r) => r?.paymentStatus === PaymentStatus.Pending,
                ).length
              }
            </p>
          </div>
        </div>
      </div>

      {/* Per-Student Table */}
      {isLoading ? (
        <div className="space-y-3" data-ocid="reports.loading_state">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12 rounded-xl" />
          ))}
        </div>
      ) : students.length === 0 ? (
        <div className="text-center py-12" data-ocid="reports.empty_state">
          <BarChart3 className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground">No students enrolled.</p>
        </div>
      ) : (
        <div
          className="bg-card rounded-2xl shadow-card overflow-hidden"
          data-ocid="reports.table"
        >
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-accent/50">
                  <TableHead className="font-semibold">Student</TableHead>
                  <TableHead className="text-center">Classes</TableHead>
                  <TableHead className="text-center">Att%</TableHead>
                  <TableHead className="text-right">Adj Fee</TableHead>
                  <TableHead className="text-right">Paid</TableHead>
                  <TableHead className="text-right">Pending</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((s, i) => {
                  const r = feeRecords[s.id.toString()];
                  const cc = r?.classesConducted ?? 0n;
                  const ca = r?.classesAttended ?? 0n;
                  const adj = cc > 0n ? (s.monthlyFee * ca) / cc : 0n;
                  const paid = r?.paidAmount ?? 0n;
                  const pendingAmt = adj > paid ? adj - paid : 0n;
                  const attPct =
                    cc > 0n ? Math.round(Number((ca * 100n) / cc)) : 0;
                  return (
                    <TableRow
                      key={s.id.toString()}
                      data-ocid={`reports.row.${i + 1}`}
                    >
                      <TableCell>
                        <div>
                          <p className="font-medium">{s.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {s.className}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="text-sm">
                          {ca.toString()}/{cc.toString()}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span
                          className={`text-sm font-medium ${
                            attPct >= 75 ? "text-green-600" : "text-destructive"
                          }`}
                        >
                          {attPct}%
                        </span>
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        ₹{adj.toString()}
                      </TableCell>
                      <TableCell className="text-right text-sm text-green-600">
                        ₹{paid.toString()}
                      </TableCell>
                      <TableCell className="text-right text-sm text-destructive">
                        ₹{pendingAmt.toString()}
                      </TableCell>
                      <TableCell className="text-center">
                        {r ? (
                          <Badge
                            variant={
                              r.paymentStatus === PaymentStatus.Paid
                                ? "default"
                                : "destructive"
                            }
                            className="text-xs"
                          >
                            {r.paymentStatus}
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">
                            No Record
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Footer (no-print) */}
      <footer className="mt-8 py-4 text-center no-print">
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()}.{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-primary transition-colors"
          >
            Built with ❤️ using caffeine.ai
          </a>
        </p>
      </footer>
    </div>
  );
}
