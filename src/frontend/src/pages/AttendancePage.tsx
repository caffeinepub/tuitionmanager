import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useQueryClient } from "@tanstack/react-query";
import {
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Loader2,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  useAllStudents,
  useAttendanceForDate,
  useMarkAttendance,
} from "../hooks/useQueries";
import { attendanceTopicStore } from "../lib/attendanceTopicStore";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export default function AttendancePage() {
  const [date, setDate] = useState(todayStr());
  const qc = useQueryClient();

  const { data: students = [], isLoading: loadingStudents } = useAllStudents();
  const { data: attendance = {}, isLoading: loadingAtt } = useAttendanceForDate(
    date,
    students,
  );
  const markAttendance = useMarkAttendance();

  const [pending, setPending] = useState<Set<string>>(new Set());
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [topicInputs, setTopicInputs] = useState<Record<string, string>>({});

  async function handleToggle(studentId: bigint, current: boolean) {
    const key = studentId.toString();
    setPending((p) => new Set(p).add(key));
    try {
      await markAttendance.mutateAsync({
        studentId,
        date,
        isPresent: !current,
      });
      await qc.invalidateQueries({ queryKey: ["attendance", "date", date] });
    } catch {
      toast.error("Failed to mark attendance");
    } finally {
      setPending((p) => {
        const next = new Set(p);
        next.delete(key);
        return next;
      });
    }
  }

  function handleCardClick(studentId: string) {
    if (expandedId === studentId) {
      setExpandedId(null);
    } else {
      setExpandedId(studentId);
      // Load existing topic for this student+date
      if (!(studentId in topicInputs)) {
        const existing = attendanceTopicStore.get(studentId, date);
        setTopicInputs((prev) => ({ ...prev, [studentId]: existing }));
      }
    }
  }

  function handleTopicChange(studentId: string, value: string) {
    setTopicInputs((prev) => ({ ...prev, [studentId]: value }));
    attendanceTopicStore.set(studentId, date, value);
  }

  // Reset topic inputs when date changes
  function handleDateChange(newDate: string) {
    setDate(newDate);
    setExpandedId(null);
    setTopicInputs({});
  }

  const presentCount = Object.values(attendance).filter(Boolean).length;
  const totalCount = students.length;

  return (
    <div className="min-h-full bg-background px-4 py-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-foreground mb-4">Attendance</h1>

      {/* Date Picker */}
      <div className="bg-card rounded-2xl shadow-card p-4 mb-4">
        <div className="flex items-center gap-3">
          <CalendarDays className="w-5 h-5 text-primary shrink-0" />
          <div className="flex-1">
            <Label className="text-xs text-muted-foreground">Select Date</Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => handleDateChange(e.target.value)}
              className="mt-0.5 h-9"
              data-ocid="attendance.date.input"
            />
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-primary">
              {loadingAtt ? "—" : `${presentCount}/${totalCount}`}
            </p>
            <p className="text-xs text-muted-foreground">Present</p>
          </div>
        </div>
      </div>

      {/* Student List */}
      {loadingStudents || loadingAtt ? (
        <div className="space-y-3" data-ocid="attendance.loading_state">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-16 rounded-2xl" />
          ))}
        </div>
      ) : students.length === 0 ? (
        <div className="text-center py-12" data-ocid="attendance.empty_state">
          <p className="text-muted-foreground">No students enrolled yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {students.map((s, i) => {
            const isPresent = attendance[s.id.toString()] ?? false;
            const isBusy = pending.has(s.id.toString());
            const isExpanded = expandedId === s.id.toString();
            const topicValue =
              topicInputs[s.id.toString()] ??
              attendanceTopicStore.get(s.id.toString(), date);
            return (
              <div
                key={s.id.toString()}
                className={`bg-card rounded-2xl shadow-card transition-all ${
                  isPresent
                    ? "border-l-4 border-green-400"
                    : "border-l-4 border-transparent"
                }`}
                data-ocid={`attendance.item.${i + 1}`}
              >
                {/* Main row */}
                {/* biome-ignore lint/a11y/useKeyWithClickEvents: expand row has interactive button inside */}
                <div
                  className="p-4 flex items-center gap-3 cursor-pointer"
                  onClick={() => handleCardClick(s.id.toString())}
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
                    {topicValue && !isExpanded && (
                      <p className="text-xs text-primary mt-0.5 truncate">
                        <BookOpen className="w-3 h-3 inline mr-1" />
                        {topicValue}
                      </p>
                    )}
                  </div>
                  <Button
                    variant={isPresent ? "default" : "outline"}
                    size="sm"
                    className={`w-24 ${
                      isPresent
                        ? "bg-green-500 hover:bg-green-600 border-green-500"
                        : "text-destructive border-destructive/30 hover:border-destructive"
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggle(s.id, isPresent);
                    }}
                    disabled={isBusy}
                    data-ocid={`attendance.toggle.${i + 1}`}
                  >
                    {isBusy ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : isPresent ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 mr-1" />
                        Present
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4 mr-1" />
                        Absent
                      </>
                    )}
                  </Button>
                  <div className="text-muted-foreground shrink-0">
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </div>

                {/* Expanded: Topics Covered */}
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-border/40 pt-3">
                    <Label className="text-xs text-muted-foreground mb-1 block">
                      <BookOpen className="w-3 h-3 inline mr-1" />
                      Topics Covered
                    </Label>
                    <Input
                      placeholder="Enter topics covered in today's class..."
                      value={topicValue}
                      onChange={(e) =>
                        handleTopicChange(s.id.toString(), e.target.value)
                      }
                      className="text-sm"
                      data-ocid={`attendance.topic.${i + 1}`}
                      autoFocus
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
