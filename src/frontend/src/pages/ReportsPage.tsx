import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { BarChart3, FileText, Printer } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { PaymentStatus } from "../backend";
import { useLogo } from "../hooks/useLogo";
import {
  useAllFeeRecordsForMonth,
  useAllStudents,
  useFeeRecord,
  useStudentAttendanceForMonth,
  useTotalIncomeForMonth,
} from "../hooks/useQueries";
import { useSettingsName } from "../hooks/useSettingsName";
import { attendanceTopicStore } from "../lib/attendanceTopicStore";
import { remarksStore } from "../lib/remarksStore";
import { topicLogStore } from "../lib/topicLogStore";

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

/** Reusable badge for payment status */
function StatusBadge({
  status,
  className: extraClass = "",
}: {
  status: PaymentStatus;
  className?: string;
}) {
  if (status === PaymentStatus.Paid) {
    return (
      <Badge
        className={`bg-[#16A34A] hover:bg-[#16A34A] text-white border-transparent ${extraClass}`}
      >
        {status}
      </Badge>
    );
  }
  return (
    <Badge variant="destructive" className={extraClass}>
      {status}
    </Badge>
  );
}

// ── Shared Report Letterhead ───────────────────────────────────────────────────
function ReportLetterhead({
  instituteName,
  logo,
  subtitle,
  month,
}: {
  instituteName: string;
  logo: string | null;
  subtitle: string;
  month: string;
}) {
  return (
    <div className="flex items-center gap-4 border-b-2 border-primary pb-4 mb-2">
      {logo && (
        <img
          src={logo}
          alt="Academy Logo"
          className="h-16 w-16 object-contain rounded-xl border border-border print:h-14 print:w-14"
        />
      )}
      <div className="flex-1">
        <h1 className="text-xl font-bold text-foreground leading-tight">
          {instituteName}
        </h1>
        <p className="text-sm font-semibold text-muted-foreground">
          {subtitle}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {getMonthLabel(month)} &nbsp;·&nbsp; Generated:{" "}
          {new Date().toLocaleDateString("en-IN")}
        </p>
      </div>
    </div>
  );
}

// ── Monthly Summary ────────────────────────────────────────────────────────────
function MonthlySummary() {
  const [month, setMonth] = useState(currentMonth());
  const instituteName = useSettingsName();
  const logo = useLogo();
  const { data: students = [], isLoading: loadingStudents } = useAllStudents();
  const { data: totalIncome, isLoading: loadingIncome } =
    useTotalIncomeForMonth(month);
  const { data: feeRecords = {}, isLoading: loadingFees } =
    useAllFeeRecordsForMonth(month, students);
  const isLoading = loadingStudents || loadingIncome || loadingFees;

  return (
    <div className="print-area">
      {/* Header (no-print) */}
      <div className="flex items-center justify-between mb-4 no-print">
        <div>
          <h2 className="text-xl font-bold text-foreground">Monthly Summary</h2>
          <p className="text-sm text-muted-foreground">
            Overview for all students
          </p>
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

      {/* Letterhead */}
      <div className="bg-white border border-border rounded-2xl p-5 mb-4 print:border-none print:p-0">
        <ReportLetterhead
          instituteName={instituteName}
          logo={logo}
          subtitle="Monthly Fee & Attendance Summary"
          month={month}
        />

        {/* Summary Header */}
        <div className="mt-4 flex items-center gap-4">
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
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((s, i) => {
                  const r = feeRecords[s.id.toString()];
                  const cc = r?.classesConducted ?? 0n;
                  const ca = r?.classesAttended ?? 0n;
                  // Adjusted Fee is display only — not used in any calculation
                  const adj = cc > 0n ? (s.monthlyFee * ca) / cc : 0n;
                  const paid = r?.paidAmount ?? 0n;
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
                      <TableCell className="text-center">
                        {r ? (
                          <StatusBadge
                            status={r.paymentStatus}
                            className="text-xs"
                          />
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
    </div>
  );
}

// ── Student Report ─────────────────────────────────────────────────────────────
function StudentReport() {
  const [month, setMonth] = useState(currentMonth());
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [showReport, setShowReport] = useState(false);
  const [remarks, setRemarks] = useState("");
  const reportRef = useRef<HTMLDivElement>(null);

  const instituteName = useSettingsName();
  const logo = useLogo();
  const { data: students = [], isLoading: loadingStudents } = useAllStudents();

  const studentIdBigInt = selectedStudentId ? BigInt(selectedStudentId) : null;
  const student = students.find((s) => s.id.toString() === selectedStudentId);

  const { data: attendance = [], isLoading: loadingAtt } =
    useStudentAttendanceForMonth(showReport ? studentIdBigInt : null, month);

  const { data: feeRecord, isLoading: loadingFee } = useFeeRecord(
    showReport ? studentIdBigInt : null,
    month,
  );

  useEffect(() => {
    setShowReport(false);
    if (selectedStudentId && month) {
      setRemarks(remarksStore.get(selectedStudentId, month));
    }
  }, [selectedStudentId, month]);

  const topicLogs = selectedStudentId
    ? topicLogStore
        .getForStudent(selectedStudentId)
        .filter((log) => log.date.startsWith(month))
        .sort((a, b) => a.date.localeCompare(b.date))
    : [];

  // Attendance topics from the Attendance tab (per-student per-date)
  const attendanceTopics = selectedStudentId
    ? attendanceTopicStore.getForStudentMonth(selectedStudentId, month)
    : {};

  const presentCount = attendance.filter((a) => a.isPresent).length;
  const totalClasses = attendance.length;
  const attPct =
    totalClasses > 0 ? Math.round((presentCount / totalClasses) * 100) : 0;

  function handleGenerateReport() {
    if (!selectedStudentId) return;
    setShowReport(true);
  }

  function handleRemarksChange(text: string) {
    setRemarks(text);
    if (selectedStudentId) {
      remarksStore.set(selectedStudentId, month, text);
    }
  }

  function handlePrint() {
    window.print();
  }

  const isLoading =
    loadingStudents || (showReport && (loadingAtt || loadingFee));

  return (
    <div>
      {/* Control Bar (no-print) */}
      <div className="no-print space-y-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-foreground">
              Student Report
            </h2>
            <p className="text-sm text-muted-foreground">
              Generate a detailed monthly report for a student
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label className="text-sm">Student</Label>
            <Select
              value={selectedStudentId}
              onValueChange={setSelectedStudentId}
            >
              <SelectTrigger data-ocid="studentreport.student.select">
                <SelectValue placeholder="Select student..." />
              </SelectTrigger>
              <SelectContent>
                {students.map((s) => (
                  <SelectItem key={s.id.toString()} value={s.id.toString()}>
                    {s.name} — {s.className}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm">Month</Label>
            <Input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              data-ocid="studentreport.month.input"
            />
          </div>
          <div className="flex items-end">
            <Button
              className="w-full"
              onClick={handleGenerateReport}
              disabled={!selectedStudentId || loadingStudents}
              data-ocid="studentreport.generate.primary_button"
            >
              <FileText className="w-4 h-4 mr-2" />
              Generate Report
            </Button>
          </div>
        </div>
      </div>

      {/* Report Content */}
      {showReport && student && (
        <div ref={reportRef}>
          {isLoading ? (
            <div
              className="space-y-3 no-print"
              data-ocid="studentreport.loading_state"
            >
              <Skeleton className="h-16 rounded-xl" />
              <Skeleton className="h-40 rounded-xl" />
              <Skeleton className="h-20 rounded-xl" />
            </div>
          ) : (
            <>
              {/* Print Button (no-print) */}
              <div className="flex justify-end mb-4 no-print">
                <Button
                  variant="outline"
                  onClick={handlePrint}
                  data-ocid="studentreport.print.button"
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Print / Save as PDF
                </Button>
              </div>

              {/* Report Document */}
              <div className="bg-white border border-border rounded-2xl p-6 space-y-6 print:border-none print:p-0 print:shadow-none">
                {/* Report Header with logo */}
                <ReportLetterhead
                  instituteName={instituteName}
                  logo={logo}
                  subtitle="Student Progress Report"
                  month={month}
                />

                {/* Student Details */}
                <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm pt-1">
                  <div>
                    <span className="text-muted-foreground">Student: </span>
                    <span className="font-semibold">{student.name}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Class: </span>
                    <span className="font-semibold">{student.className}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Session: </span>
                    <span className="font-semibold">
                      {student.academicSession || "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Month: </span>
                    <span className="font-semibold">
                      {getMonthLabel(month)}
                    </span>
                  </div>
                </div>

                {/* Attendance Section */}
                <div>
                  <h3 className="text-base font-bold mb-3">
                    📅 Attendance Details
                  </h3>
                  <div className="overflow-x-auto rounded-xl border border-border">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-accent/40">
                          <TableHead>Date</TableHead>
                          <TableHead className="text-center">Status</TableHead>
                          <TableHead>Topics Covered</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {attendance.map((a) => {
                          const d = new Date(`${a.date}T00:00:00`);
                          const formattedDate = d.toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          });
                          const topicForDate = attendanceTopics[a.date] || "";
                          return (
                            <TableRow key={a.date}>
                              <TableCell className="text-sm whitespace-nowrap">
                                {formattedDate}
                              </TableCell>
                              <TableCell className="text-center">
                                <span
                                  className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                                    a.isPresent
                                      ? "bg-green-100 text-green-700"
                                      : "bg-red-100 text-red-600"
                                  }`}
                                >
                                  {a.isPresent ? "Present" : "Absent"}
                                </span>
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {topicForDate || "—"}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
                    <div className="bg-accent/30 rounded-xl p-3 text-center">
                      <p className="text-xs text-muted-foreground">
                        Total Classes
                      </p>
                      <p className="text-xl font-bold">{totalClasses}</p>
                    </div>
                    <div className="bg-green-50 rounded-xl p-3 text-center">
                      <p className="text-xs text-muted-foreground">Attended</p>
                      <p className="text-xl font-bold text-green-700">
                        {presentCount}
                      </p>
                    </div>
                    <div
                      className={`rounded-xl p-3 text-center ${
                        attPct >= 75 ? "bg-green-50" : "bg-red-50"
                      }`}
                    >
                      <p className="text-xs text-muted-foreground">
                        Percentage
                      </p>
                      <p
                        className={`text-xl font-bold ${
                          attPct >= 75 ? "text-green-700" : "text-red-600"
                        }`}
                      >
                        {attPct}%
                      </p>
                    </div>
                  </div>
                </div>

                {/* Topics Covered Section (from Topics tab) */}
                <div>
                  <h3 className="text-base font-bold mb-3">
                    📚 Topics Covered
                  </h3>
                  {topicLogs.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic">
                      No topics recorded for this month.
                    </p>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-border">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-accent/40">
                            <TableHead>Date</TableHead>
                            <TableHead>Topic</TableHead>
                            <TableHead>Notes</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {topicLogs.map((log) => (
                            <TableRow key={log.id}>
                              <TableCell className="text-sm whitespace-nowrap">
                                {log.date}
                              </TableCell>
                              <TableCell className="text-sm font-medium">
                                {log.topic}
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {log.notes || "—"}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>

                {/* Fee Status Section */}
                <div>
                  <h3 className="text-base font-bold mb-3">💳 Fee Status</h3>
                  {feeRecord ? (
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground">
                        Payment Status for {getMonthLabel(month)}:
                      </span>
                      {feeRecord.paymentStatus === PaymentStatus.Paid ? (
                        <span className="px-3 py-1 rounded-full text-sm font-bold bg-[#16A34A] text-white">
                          ✓ Paid
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full text-sm font-bold bg-red-100 text-red-600">
                          ⚠ Pending
                        </span>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">
                      Not recorded for this month.
                    </p>
                  )}
                </div>

                {/* Remarks Section */}
                <div>
                  <h3 className="text-base font-bold mb-2">📝 Remarks</h3>
                  <Textarea
                    className="no-print w-full text-sm"
                    rows={4}
                    placeholder="Add remarks for this student (e.g. performance notes, areas to improve)..."
                    value={remarks}
                    onChange={(e) => handleRemarksChange(e.target.value)}
                    data-ocid="studentreport.remarks.textarea"
                  />
                  <div className="hidden print:block min-h-[60px] border border-gray-300 rounded p-3 text-sm whitespace-pre-wrap">
                    {remarks || "—"}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {!showReport && !loadingStudents && (
        <div
          className="text-center py-16 no-print"
          data-ocid="studentreport.empty_state"
        >
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">
            Select a student and month, then click "Generate Report"
          </p>
        </div>
      )}
    </div>
  );
}

// ── Main Reports Page ─────────────────────────────────────────────────────────
export default function ReportsPage() {
  return (
    <div className="min-h-full bg-background px-4 py-6 max-w-3xl mx-auto">
      <div className="mb-6 no-print">
        <h1 className="text-2xl font-bold text-foreground">Reports</h1>
        <p className="text-sm text-muted-foreground">
          Monthly summary & student progress reports
        </p>
      </div>

      <Tabs defaultValue="summary" className="w-full">
        <TabsList
          className="w-full grid grid-cols-2 mb-6 no-print"
          data-ocid="reports.tab"
        >
          <TabsTrigger value="summary" data-ocid="reports.summary.tab">
            <BarChart3 className="w-4 h-4 mr-2" />
            Monthly Summary
          </TabsTrigger>
          <TabsTrigger value="student" data-ocid="reports.student.tab">
            <FileText className="w-4 h-4 mr-2" />
            Student Report
          </TabsTrigger>
        </TabsList>

        <TabsContent value="summary">
          <MonthlySummary />
        </TabsContent>

        <TabsContent value="student">
          <StudentReport />
        </TabsContent>
      </Tabs>

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
