import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "@tanstack/react-router";
import {
  ChevronRight,
  GraduationCap,
  Loader2,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Student } from "../backend";
import {
  useAddStudent,
  useAllStudents,
  useDeleteStudent,
  useUpdateStudent,
} from "../hooks/useQueries";

const CLASS_OPTIONS = [
  "Class 1",
  "Class 2",
  "Class 3",
  "Class 4",
  "Class 5",
  "Class 6",
  "Class 7",
  "Class 8",
  "Class 9",
  "Class 10",
  "Class 11",
  "Class 12",
];

const SESSION_OPTIONS = ["2024-25", "2025-26", "2026-27", "2027-28"];

interface StudentFormData {
  name: string;
  className: string;
  batch: string;
  monthlyFee: string;
  contactNumber: string;
  academicSession: string;
}

const DEFAULT_FORM: StudentFormData = {
  name: "",
  className: "Class 10",
  batch: "",
  monthlyFee: "",
  contactNumber: "",
  academicSession: "2025-26",
};

export default function StudentsPage() {
  const navigate = useNavigate();
  const { data: students = [], isLoading } = useAllStudents();
  const addStudent = useAddStudent();
  const updateStudent = useUpdateStudent();
  const deleteStudent = useDeleteStudent();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);
  const [form, setForm] = useState<StudentFormData>(DEFAULT_FORM);
  const [deleteTarget, setDeleteTarget] = useState<Student | null>(null);

  function openAdd() {
    setEditing(null);
    setForm(DEFAULT_FORM);
    setSheetOpen(true);
  }

  function openEdit(s: Student, e: React.MouseEvent) {
    e.stopPropagation();
    setEditing(s);
    setForm({
      name: s.name,
      className: s.className,
      batch: s.batch,
      monthlyFee: s.monthlyFee.toString(),
      contactNumber: s.contactNumber,
      academicSession: s.academicSession || "2025-26",
    });
    setSheetOpen(true);
  }

  async function handleSubmit() {
    if (!form.name.trim() || !form.batch.trim() || !form.monthlyFee) {
      toast.error("Please fill in all required fields");
      return;
    }
    const studentData: Student = {
      id: editing?.id ?? 0n,
      name: form.name.trim(),
      className: form.className,
      batch: form.batch.trim(),
      monthlyFee: BigInt(form.monthlyFee || "0"),
      contactNumber: form.contactNumber.trim(),
      academicSession: form.academicSession,
    };
    try {
      if (editing) {
        await updateStudent.mutateAsync({
          id: editing.id,
          student: studentData,
        });
        toast.success("Student updated");
      } else {
        await addStudent.mutateAsync(studentData);
        toast.success("Student added");
      }
      setSheetOpen(false);
    } catch {
      toast.error("Failed to save student");
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteStudent.mutateAsync(deleteTarget.id);
      toast.success("Student removed");
      setDeleteTarget(null);
    } catch {
      toast.error("Failed to delete student");
    }
  }

  const isSaving = addStudent.isPending || updateStudent.isPending;

  return (
    <div className="min-h-full bg-background px-4 py-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Students</h1>
          <p className="text-sm text-muted-foreground">
            {students.length} enrolled
          </p>
        </div>
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button onClick={openAdd} data-ocid="students.add.primary_button">
              <Plus className="w-4 h-4 mr-2" />
              Add Student
            </Button>
          </SheetTrigger>
          <SheetContent data-ocid="students.form.sheet">
            <SheetHeader>
              <SheetTitle>
                {editing ? "Edit Student" : "Add New Student"}
              </SheetTitle>
            </SheetHeader>
            <div className="mt-6 space-y-4">
              <div className="space-y-1.5">
                <Label>Name *</Label>
                <Input
                  value={form.name}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, name: e.target.value }))
                  }
                  placeholder="Student name"
                  data-ocid="students.name.input"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Class *</Label>
                <Select
                  value={form.className}
                  onValueChange={(v) =>
                    setForm((p) => ({ ...p, className: v }))
                  }
                >
                  <SelectTrigger data-ocid="students.class.select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CLASS_OPTIONS.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Academic Session *</Label>
                <Select
                  value={form.academicSession}
                  onValueChange={(v) =>
                    setForm((p) => ({ ...p, academicSession: v }))
                  }
                >
                  <SelectTrigger data-ocid="students.session.select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SESSION_OPTIONS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Batch / Timing *</Label>
                <Input
                  value={form.batch}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, batch: e.target.value }))
                  }
                  placeholder="e.g. Morning 7-8 AM"
                  data-ocid="students.batch.input"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Monthly Fee (₹) *</Label>
                <Input
                  type="number"
                  value={form.monthlyFee}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, monthlyFee: e.target.value }))
                  }
                  placeholder="1500"
                  data-ocid="students.fee.input"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Contact Number</Label>
                <Input
                  value={form.contactNumber}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, contactNumber: e.target.value }))
                  }
                  placeholder="10-digit mobile number"
                  data-ocid="students.contact.input"
                />
              </div>
              <Button
                className="w-full mt-2"
                onClick={handleSubmit}
                disabled={isSaving}
                data-ocid="students.form.submit_button"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : null}
                {editing ? "Save Changes" : "Add Student"}
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {isLoading ? (
        <div className="space-y-3" data-ocid="students.loading_state">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 rounded-2xl" />
          ))}
        </div>
      ) : students.length === 0 ? (
        <div className="text-center py-16" data-ocid="students.empty_state">
          <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
            <GraduationCap className="w-8 h-8 text-primary" />
          </div>
          <p className="text-muted-foreground">
            No students yet. Add your first student!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {students.map((s, i) => (
            <button
              key={s.id.toString()}
              type="button"
              className="w-full bg-card rounded-2xl shadow-card p-4 flex items-center gap-3 hover:shadow-md transition-shadow text-left"
              onClick={() =>
                navigate({
                  to: "/students/$id",
                  params: { id: s.id.toString() },
                })
              }
              data-ocid={`students.item.${i + 1}`}
            >
              <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center shrink-0">
                <span className="text-primary font-bold text-sm">
                  {s.name.charAt(0)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground truncate">
                  {s.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {s.className} · {s.batch}
                </p>
                {s.academicSession && (
                  <p className="text-xs text-muted-foreground/70">
                    Session: {s.academicSession}
                  </p>
                )}
                <p className="text-xs text-primary font-medium">
                  ₹{s.monthlyFee.toString()}/mo
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={(e) => openEdit(s, e)}
                  data-ocid={`students.edit_button.${i + 1}`}
                >
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteTarget(s);
                  }}
                  data-ocid={`students.delete_button.${i + 1}`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
            </button>
          ))}
        </div>
      )}

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <AlertDialogContent data-ocid="students.delete.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Student?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{deleteTarget?.name}</strong>{" "}
              and all their records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="students.delete.cancel_button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-ocid="students.delete.confirm_button"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
