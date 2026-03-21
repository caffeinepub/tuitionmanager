import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate, useParams } from "@tanstack/react-router";
import { ArrowLeft, BookOpen, Loader2, Phone, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PaymentStatus } from "../backend";
import type { FeeRecord } from "../backend";
import {
  useAddTopicLog,
  useFeeRecord,
  useStudent,
  useStudentAttendanceForMonth,
  useUpsertFeeRecord,
} from "../hooks/useQueries";
import { topicLogStore } from "../lib/topicLogStore";

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}
function today() {
  return new Date().toISOString().slice(0, 10);
}
function getMonthLabel(month: string) {
  const [y, m] = month.split("-");
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
}

export default function StudentProfilePage() {
  const { id } = useParams({ from: "/students/$id" });
  const navigate = useNavigate();
  const studentId = id ? BigInt(id) : null;

  const { data: student, isLoading } = useStudent(studentId ?? 0n);
  const [attMonth, setAttMonth] = useState(currentMonth());
  const [feeMonth, setFeeMonth] = useState(currentMonth());
  const [topicKey, setTopicKey] = useState(0);

  const { data: attendance = [], isLoading: loadingAtt } =
    useStudentAttendanceForMonth(studentId, attMonth);
  const { data: feeRecord, isLoading: loadingFee } = useFeeRecord(
    studentId,
    feeMonth,
  );
  const upsertFee = useUpsertFeeRecord();
  const addTopicLog = useAddTopicLog();

  const topicLogs = studentId
    ? topicLogStore.getForStudent(studentId.toString())
    : [];
  void topicKey;

  const [feeDialogOpen, setFeeDialogOpen] = useState(false);
  const [feeForm, setFeeForm] = useState({
    classesConducted: "",
    classesAttended: "",
    paidAmount: "",
    dueDate: `${feeMonth}-10`,
    paymentStatus: PaymentStatus.Pending as PaymentStatus,
  });

  const [topicDialogOpen, setTopicDialogOpen] = useState(false);
  const [topicForm, setTopicForm] = useState({
    date: today(),
    topic: "",
    notes: "",
  });

  function openFeeDialog() {
    if (feeRecord) {
      setFeeForm({
        classesConducted: feeRecord.classesConducted.toString(),
        classesAttended: feeRecord.classesAttended.toString(),
        paidAmount: feeRecord.paidAmount.toString(),
        dueDate: feeRecord.dueDate,
        paymentStatus: feeRecord.paymentStatus,
      });
    } else {
      setFeeForm({
        classesConducted: "",
        classesAttended: "",
        paidAmount: "",
        dueDate: `${feeMonth}-10`,
        paymentStatus: PaymentStatus.Pending,
      });
    }
    setFeeDialogOpen(true);
  }

  async function handleSaveFee() {
    if (!studentId || !student) return;
    if (!feeForm.classesConducted || !feeForm.classesAttended) {
      toast.error("Fill classes conducted and attended");
      return;
    }
    const record: FeeRecord = {
      studentId,
      month: feeMonth,
      classesConducted: BigInt(feeForm.classesConducted),
      classesAttended: BigInt(feeForm.classesAttended),
      paidAmount: BigInt(feeForm.paidAmount || "0"),
      dueDate: feeForm.dueDate,
      paymentStatus: feeForm.paymentStatus,
    };
    try {
      await upsertFee.mutateAsync(record);
      toast.success("Fee record saved");
      setFeeDialogOpen(false);
    } catch {
      toast.error("Failed to save fee record");
    }
  }

  async function handleAddTopic() {
    if (!studentId || !student) return;
    if (!topicForm.topic.trim()) {
      toast.error("Please enter a topic");
      return;
    }
    try {
      const newId = await addTopicLog.mutateAsync({
        id: 0n,
        studentId,
        date: topicForm.date,
        topic: topicForm.topic.trim(),
        notes: topicForm.notes.trim() || undefined,
      });
      topicLogStore.add({
        id: newId.toString(),
        studentId: studentId.toString(),
        date: topicForm.date,
        topic: topicForm.topic.trim(),
        notes: topicForm.notes.trim() || undefined,
        batch: student.batch,
      });
      setTopicKey((p) => p + 1);
      toast.success("Topic log added");
      setTopicDialogOpen(false);
      setTopicForm({ date: today(), topic: "", notes: "" });
    } catch {
      toast.error("Failed to add topic log");
    }
  }

  const presentCount = attendance.filter((a) => a.isPresent).length;
  const totalDays = attendance.length;
  const attendancePct =
    totalDays > 0 ? Math.round((presentCount / totalDays) * 100) : 0;
  const cc = feeRecord?.classesConducted ?? 0n;
  const ca = feeRecord?.classesAttended ?? 0n;
  const mf = student?.monthlyFee ?? 0n;
  const adjustedFee = cc > 0n ? (mf * ca) / cc : 0n;
  const pendingAmt =
    adjustedFee > (feeRecord?.paidAmount ?? 0n)
      ? adjustedFee - (feeRecord?.paidAmount ?? 0n)
      : 0n;

  if (isLoading)
    return (
      <div className="px-4 py-6">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-24 rounded-2xl" />
      </div>
    );
  if (!student)
    return (
      <div className="px-4 py-6 text-center">
        <p className="text-muted-foreground">Student not found.</p>
        <Button variant="link" onClick={() => navigate({ to: "/students" })}>
          Go back
        </Button>
      </div>
    );

  return (
    <div className="min-h-full bg-background max-w-2xl mx-auto">
      <div className="bg-card border-b border-border px-4 py-4">
        <button
          type="button"
          onClick={() => navigate({ to: "/students" })}
          className="flex items-center gap-1.5 text-primary text-sm font-medium mb-3"
          data-ocid="profile.back.button"
        >
          <ArrowLeft className="w-4 h-4" />
          Students
        </button>
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center shrink-0">
            <span className="text-primary font-bold text-lg">
              {student.name.charAt(0)}
            </span>
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-foreground">
              {student.name}
            </h1>
            <p className="text-sm text-muted-foreground">
              {student.className} · {student.batch}
            </p>
            {student.contactNumber && (
              <a
                href={`tel:${student.contactNumber}`}
                className="flex items-center gap-1 text-xs text-primary mt-1"
              >
                <Phone className="w-3 h-3" />
                {student.contactNumber}
              </a>
            )}
          </div>
          <Badge variant="secondary">₹{student.monthlyFee.toString()}/mo</Badge>
        </div>
      </div>

      <Tabs defaultValue="overview" className="px-4 pt-4">
        <TabsList className="w-full grid grid-cols-4 mb-4">
          <TabsTrigger value="overview" data-ocid="profile.overview.tab">
            Overview
          </TabsTrigger>
          <TabsTrigger value="attendance" data-ocid="profile.attendance.tab">
            Attend.
          </TabsTrigger>
          <TabsTrigger value="topics" data-ocid="profile.topics.tab">
            Topics
          </TabsTrigger>
          <TabsTrigger value="fees" data-ocid="profile.fees.tab">
            Fees
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="space-y-3">
            <div className="bg-card rounded-2xl shadow-card p-4 grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Class</p>
                <p className="font-semibold">{student.className}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Batch</p>
                <p className="font-semibold">{student.batch}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Monthly Fee</p>
                <p className="font-semibold">
                  ₹{student.monthlyFee.toString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Contact</p>
                <p className="font-semibold">{student.contactNumber || "—"}</p>
              </div>
            </div>
            <div className="bg-card rounded-2xl shadow-card p-4">
              <p className="text-sm font-semibold mb-2">This Month</p>
              <div className="flex gap-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">
                    {presentCount}
                  </p>
                  <p className="text-xs text-muted-foreground">Present</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">
                    {totalDays - presentCount}
                  </p>
                  <p className="text-xs text-muted-foreground">Absent</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {attendancePct}%
                  </p>
                  <p className="text-xs text-muted-foreground">Attendance</p>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="attendance">
          <div className="mb-3 flex items-center gap-2">
            <Label className="text-sm shrink-0">Month:</Label>
            <Input
              type="month"
              value={attMonth}
              onChange={(e) => setAttMonth(e.target.value)}
              className="flex-1"
              data-ocid="profile.att_month.input"
            />
          </div>
          {loadingAtt ? (
            <div data-ocid="profile.attendance.loading_state">
              <Skeleton className="h-8 w-full mb-2" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : (
            <>
              <div className="flex gap-3 mb-3 text-sm">
                <span className="text-green-600 font-medium">
                  {presentCount} Present
                </span>
                <span className="text-destructive font-medium">
                  {totalDays - presentCount} Absent
                </span>
                <span className="text-primary font-medium">
                  {attendancePct}%
                </span>
              </div>
              <div className="grid grid-cols-7 gap-1.5">
                {attendance.map((a) => (
                  <div
                    key={a.date}
                    className={`rounded-lg p-1.5 text-center text-xs ${a.isPresent ? "bg-green-50 text-green-700" : "bg-red-50 text-red-500"}`}
                    title={a.date}
                  >
                    {a.date.split("-")[2]}
                  </div>
                ))}
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="topics">
          <div className="flex justify-end mb-3">
            <Dialog open={topicDialogOpen} onOpenChange={setTopicDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" data-ocid="profile.topic.open_modal_button">
                  <Plus className="w-4 h-4 mr-1" />
                  Add Topic
                </Button>
              </DialogTrigger>
              <DialogContent data-ocid="profile.topic.dialog">
                <DialogHeader>
                  <DialogTitle>Add Topic Log</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-2">
                  <div className="space-y-1.5">
                    <Label>Date</Label>
                    <Input
                      type="date"
                      value={topicForm.date}
                      onChange={(e) =>
                        setTopicForm((p) => ({ ...p, date: e.target.value }))
                      }
                      data-ocid="profile.topic.date.input"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Topic *</Label>
                    <Input
                      value={topicForm.topic}
                      onChange={(e) =>
                        setTopicForm((p) => ({ ...p, topic: e.target.value }))
                      }
                      placeholder="e.g. Quadratic Equations"
                      data-ocid="profile.topic.input"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Notes (optional)</Label>
                    <Textarea
                      value={topicForm.notes}
                      onChange={(e) =>
                        setTopicForm((p) => ({ ...p, notes: e.target.value }))
                      }
                      placeholder="Additional notes..."
                      rows={3}
                      data-ocid="profile.topic.textarea"
                    />
                  </div>
                  <Button
                    className="w-full"
                    onClick={handleAddTopic}
                    disabled={addTopicLog.isPending}
                    data-ocid="profile.topic.submit_button"
                  >
                    {addTopicLog.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : null}
                    Save Topic Log
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          {topicLogs.length === 0 ? (
            <div
              className="text-center py-10"
              data-ocid="profile.topics.empty_state"
            >
              <BookOpen className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground text-sm">
                No topic logs yet.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {topicLogs.map((log, i) => (
                <div
                  key={log.id}
                  className="bg-card rounded-xl shadow-xs p-3"
                  data-ocid={`profile.topics.item.${i + 1}`}
                >
                  <div className="flex justify-between items-start">
                    <p className="font-medium text-sm">{log.topic}</p>
                    <span className="text-xs text-muted-foreground">
                      {log.date}
                    </span>
                  </div>
                  {log.notes && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {log.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="fees">
          <div className="mb-3 flex items-center gap-2">
            <Label className="text-sm shrink-0">Month:</Label>
            <Input
              type="month"
              value={feeMonth}
              onChange={(e) => setFeeMonth(e.target.value)}
              className="flex-1"
              data-ocid="profile.fee_month.input"
            />
          </div>
          {loadingFee ? (
            <Skeleton
              className="h-32 rounded-2xl"
              data-ocid="profile.fees.loading_state"
            />
          ) : feeRecord ? (
            <div className="bg-card rounded-2xl shadow-card p-4 space-y-3">
              <div className="flex justify-between items-center">
                <p className="font-semibold">{getMonthLabel(feeMonth)}</p>
                <Badge
                  variant={
                    feeRecord.paymentStatus === PaymentStatus.Paid
                      ? "default"
                      : "destructive"
                  }
                >
                  {feeRecord.paymentStatus}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">
                    Classes Conducted
                  </p>
                  <p className="font-semibold">
                    {feeRecord.classesConducted.toString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    Classes Attended
                  </p>
                  <p className="font-semibold">
                    {feeRecord.classesAttended.toString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Adjusted Fee</p>
                  <p className="font-semibold">₹{adjustedFee.toString()}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Paid Amount</p>
                  <p className="font-semibold text-green-600">
                    ₹{feeRecord.paidAmount.toString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Pending</p>
                  <p
                    className={`font-semibold ${pendingAmt > 0n ? "text-destructive" : "text-green-600"}`}
                  >
                    ₹{pendingAmt.toString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Due Date</p>
                  <p className="font-semibold">{feeRecord.dueDate}</p>
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={openFeeDialog}
                data-ocid="profile.fee.edit_button"
              >
                Edit Fee Record
              </Button>
            </div>
          ) : (
            <div
              className="text-center py-8"
              data-ocid="profile.fees.empty_state"
            >
              <p className="text-muted-foreground text-sm mb-3">
                No fee record for this month.
              </p>
              <Button
                onClick={openFeeDialog}
                data-ocid="profile.fee.open_modal_button"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Fee Record
              </Button>
            </div>
          )}
          <Dialog open={feeDialogOpen} onOpenChange={setFeeDialogOpen}>
            <DialogContent data-ocid="profile.fee.dialog">
              <DialogHeader>
                <DialogTitle>
                  {feeRecord ? "Edit" : "Add"} Fee — {getMonthLabel(feeMonth)}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-3 mt-2">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Classes Conducted *</Label>
                    <Input
                      type="number"
                      value={feeForm.classesConducted}
                      onChange={(e) =>
                        setFeeForm((p) => ({
                          ...p,
                          classesConducted: e.target.value,
                        }))
                      }
                      placeholder="22"
                      data-ocid="profile.fee.conducted.input"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Classes Attended *</Label>
                    <Input
                      type="number"
                      value={feeForm.classesAttended}
                      onChange={(e) =>
                        setFeeForm((p) => ({
                          ...p,
                          classesAttended: e.target.value,
                        }))
                      }
                      placeholder="20"
                      data-ocid="profile.fee.attended.input"
                    />
                  </div>
                </div>
                {feeForm.classesConducted &&
                  feeForm.classesAttended &&
                  student && (
                    <div className="bg-accent rounded-lg p-3 text-sm">
                      <span className="text-muted-foreground">
                        Adjusted Fee:{" "}
                      </span>
                      <span className="font-bold text-primary">
                        ₹
                        {(
                          (student.monthlyFee *
                            BigInt(feeForm.classesAttended || "0")) /
                          BigInt(feeForm.classesConducted || "1")
                        ).toString()}
                      </span>
                    </div>
                  )}
                <div className="space-y-1.5">
                  <Label>Paid Amount (₹)</Label>
                  <Input
                    type="number"
                    value={feeForm.paidAmount}
                    onChange={(e) =>
                      setFeeForm((p) => ({ ...p, paidAmount: e.target.value }))
                    }
                    placeholder="0"
                    data-ocid="profile.fee.paid.input"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Due Date</Label>
                    <Input
                      type="date"
                      value={feeForm.dueDate}
                      onChange={(e) =>
                        setFeeForm((p) => ({ ...p, dueDate: e.target.value }))
                      }
                      data-ocid="profile.fee.due.input"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Status</Label>
                    <Select
                      value={feeForm.paymentStatus}
                      onValueChange={(v) =>
                        setFeeForm((p) => ({
                          ...p,
                          paymentStatus: v as PaymentStatus,
                        }))
                      }
                    >
                      <SelectTrigger data-ocid="profile.fee.status.select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={PaymentStatus.Paid}>Paid</SelectItem>
                        <SelectItem value={PaymentStatus.Pending}>
                          Pending
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button
                  className="w-full"
                  onClick={handleSaveFee}
                  disabled={upsertFee.isPending}
                  data-ocid="profile.fee.submit_button"
                >
                  {upsertFee.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : null}
                  Save Fee Record
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </TabsContent>
      </Tabs>
    </div>
  );
}
