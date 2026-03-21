import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { Loader2, Plus, Wallet } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { FeeRecord, Student } from "../backend";
import { PaymentStatus } from "../backend";
import {
  useAllFeeRecordsForMonth,
  useAllStudents,
  usePendingFeesForMonth,
  useUpsertFeeRecord,
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

interface FeeFormState {
  classesConducted: string;
  classesAttended: string;
  paidAmount: string;
  dueDate: string;
  paymentStatus: PaymentStatus;
}

export default function FeesPage() {
  const [month, setMonth] = useState(currentMonth());
  const [pendingMonth, setPendingMonth] = useState(currentMonth());
  const [editStudent, setEditStudent] = useState<Student | null>(null);
  const [editRecord, setEditRecord] = useState<FeeRecord | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [feeForm, setFeeForm] = useState<FeeFormState>({
    classesConducted: "",
    classesAttended: "",
    paidAmount: "",
    dueDate: `${currentMonth()}-10`,
    paymentStatus: PaymentStatus.Pending,
  });

  const { data: students = [] } = useAllStudents();
  const { data: allFees = {}, isLoading: loadingAll } =
    useAllFeeRecordsForMonth(month, students);
  const { data: pendingFees = [], isLoading: loadingPending } =
    usePendingFeesForMonth(pendingMonth);
  const upsertFee = useUpsertFeeRecord();

  function openEdit(
    student: Student,
    record: FeeRecord | null,
    currentMonth: string,
  ) {
    setEditStudent(student);
    setEditRecord(record);
    if (record) {
      setFeeForm({
        classesConducted: record.classesConducted.toString(),
        classesAttended: record.classesAttended.toString(),
        paidAmount: record.paidAmount.toString(),
        dueDate: record.dueDate,
        paymentStatus: record.paymentStatus,
      });
    } else {
      setFeeForm({
        classesConducted: "",
        classesAttended: "",
        paidAmount: "",
        dueDate: `${currentMonth}-10`,
        paymentStatus: PaymentStatus.Pending,
      });
    }
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!editStudent) return;
    if (!feeForm.classesConducted || !feeForm.classesAttended) {
      toast.error("Classes conducted and attended are required");
      return;
    }
    const targetMonth = editRecord ? editRecord.month : month;
    const record: FeeRecord = {
      studentId: editStudent.id,
      month: targetMonth,
      classesConducted: BigInt(feeForm.classesConducted),
      classesAttended: BigInt(feeForm.classesAttended),
      paidAmount: BigInt(feeForm.paidAmount || "0"),
      dueDate: feeForm.dueDate,
      paymentStatus: feeForm.paymentStatus,
    };
    try {
      await upsertFee.mutateAsync(record);
      toast.success("Fee record saved");
      setDialogOpen(false);
    } catch {
      toast.error("Failed to save fee record");
    }
  }

  const adjustedFee =
    editStudent && feeForm.classesConducted && feeForm.classesAttended
      ? (
          (editStudent.monthlyFee * BigInt(feeForm.classesAttended)) /
          BigInt(feeForm.classesConducted)
        ).toString()
      : null;

  return (
    <div className="min-h-full bg-background px-4 py-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-foreground mb-4">Fees</h1>

      <Tabs defaultValue="all">
        <TabsList className="w-full grid grid-cols-2 mb-4">
          <TabsTrigger value="all" data-ocid="fees.all.tab">
            All Fees
          </TabsTrigger>
          <TabsTrigger value="pending" data-ocid="fees.pending.tab">
            Pending
          </TabsTrigger>
        </TabsList>

        {/* All Fees Tab */}
        <TabsContent value="all">
          <div className="flex items-center gap-2 mb-4">
            <Label className="text-sm shrink-0">Month:</Label>
            <Input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="flex-1"
              data-ocid="fees.all_month.input"
            />
          </div>

          {loadingAll ? (
            <div className="space-y-3" data-ocid="fees.loading_state">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 rounded-2xl" />
              ))}
            </div>
          ) : students.length === 0 ? (
            <div className="text-center py-12" data-ocid="fees.empty_state">
              <Wallet className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">No students enrolled.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {students.map((s, i) => {
                const record = allFees[s.id.toString()] ?? null;
                const cc = record?.classesConducted ?? 0n;
                const ca = record?.classesAttended ?? 0n;
                const adj = cc > 0n ? (s.monthlyFee * ca) / cc : 0n;
                const _pending = adj - (record?.paidAmount ?? 0n);
                return (
                  <div
                    key={s.id.toString()}
                    className="bg-card rounded-2xl shadow-card p-4 flex items-center gap-3"
                    data-ocid={`fees.item.${i + 1}`}
                  >
                    <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center shrink-0">
                      <span className="text-primary font-bold text-sm">
                        {s.name.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{s.name}</p>
                      {record ? (
                        <p className="text-xs text-muted-foreground">
                          {ca.toString()}/{cc.toString()} classes · ₹
                          {record.paidAmount.toString()} paid
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          No record
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {record ? (
                        <Badge
                          variant={
                            record.paymentStatus === PaymentStatus.Paid
                              ? "default"
                              : "destructive"
                          }
                        >
                          {record.paymentStatus}
                        </Badge>
                      ) : (
                        <Badge variant="secondary">—</Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openEdit(s, record, month)}
                        data-ocid={`fees.edit_button.${i + 1}`}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Pending Tab */}
        <TabsContent value="pending">
          <div className="flex items-center gap-2 mb-4">
            <Label className="text-sm shrink-0">Month:</Label>
            <Input
              type="month"
              value={pendingMonth}
              onChange={(e) => setPendingMonth(e.target.value)}
              className="flex-1"
              data-ocid="fees.pending_month.input"
            />
          </div>

          {loadingPending ? (
            <div className="space-y-3" data-ocid="fees.pending.loading_state">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-16 rounded-2xl" />
              ))}
            </div>
          ) : pendingFees.length === 0 ? (
            <div
              className="text-center py-12"
              data-ocid="fees.pending.empty_state"
            >
              <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <Wallet className="w-7 h-7 text-green-600" />
              </div>
              <p className="font-medium text-foreground">All fees collected!</p>
              <p className="text-sm text-muted-foreground">
                {getMonthLabel(pendingMonth)}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {pendingFees.map((fee, i) => {
                const student = students.find((s) => s.id === fee.studentId);
                const cc = fee.classesConducted;
                const ca = fee.classesAttended;
                const mf = student?.monthlyFee ?? 0n;
                const adj = cc > 0n ? (mf * ca) / cc : 0n;
                const pendingAmt = adj - fee.paidAmount;
                return (
                  <div
                    key={`${fee.studentId}-${fee.month}`}
                    className="bg-card rounded-2xl shadow-card p-4 flex items-center gap-3"
                    data-ocid={`fees.pending.item.${i + 1}`}
                  >
                    <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center shrink-0">
                      <span className="text-orange-600 font-bold text-sm">
                        {(student?.name ?? "?").charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">
                        {student?.name ?? `Student #${fee.studentId}`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Due: {fee.dueDate} · Pending: ₹
                        {(pendingAmt > 0n ? pendingAmt : 0n).toString()}
                      </p>
                    </div>
                    <Badge variant="destructive">Pending</Badge>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent data-ocid="fees.fee.dialog">
          <DialogHeader>
            <DialogTitle>
              {editRecord ? "Edit" : "Add"} Fee — {editStudent?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Conducted *</Label>
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
                  data-ocid="fees.conducted.input"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Attended *</Label>
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
                  data-ocid="fees.attended.input"
                />
              </div>
            </div>
            {adjustedFee !== null && (
              <div className="bg-accent rounded-lg p-3 text-sm">
                <span className="text-muted-foreground">Adjusted Fee: </span>
                <span className="font-bold text-primary">₹{adjustedFee}</span>
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
                data-ocid="fees.paid.input"
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
                  data-ocid="fees.due.input"
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
                  <SelectTrigger data-ocid="fees.status.select">
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
              onClick={handleSave}
              disabled={upsertFee.isPending}
              data-ocid="fees.fee.submit_button"
            >
              {upsertFee.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              Save Fee Record
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
