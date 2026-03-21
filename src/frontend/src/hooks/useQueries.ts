import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  AttendanceRecord,
  FeeRecord,
  Settings,
  Student,
  TopicLog,
} from "../backend";
import { useActor } from "./useActor";

export function useSettings() {
  const { actor, isFetching } = useActor();
  return useQuery<Settings>({
    queryKey: ["settings"],
    queryFn: async () => {
      if (!actor) return { instituteName: "Apex Tuition Center" };
      try {
        return await actor.getSettings();
      } catch {
        return { instituteName: "Apex Tuition Center" };
      }
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAllStudents() {
  const { actor, isFetching } = useActor();
  return useQuery<Student[]>({
    queryKey: ["students"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllStudents();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useStudent(id: bigint) {
  const { actor, isFetching } = useActor();
  return useQuery<Student | null>({
    queryKey: ["student", id.toString()],
    queryFn: async () => {
      if (!actor) return null;
      try {
        return await actor.getStudent(id);
      } catch {
        return null;
      }
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAttendanceForDate(date: string, students: Student[]) {
  const { actor, isFetching } = useActor();
  return useQuery<Record<string, boolean>>({
    queryKey: ["attendance", "date", date],
    queryFn: async () => {
      if (!actor) return {};
      const results = await Promise.all(
        students.map(async (s) => {
          try {
            const r = await actor.getAttendance(s.id, date);
            return [s.id.toString(), r.isPresent] as const;
          } catch {
            return [s.id.toString(), false] as const;
          }
        }),
      );
      return Object.fromEntries(results);
    },
    enabled: !!actor && !isFetching && students.length > 0,
  });
}

type AttendanceDay = { date: string; isPresent: boolean };

export function useStudentAttendanceForMonth(
  studentId: bigint | null,
  month: string,
) {
  const { actor, isFetching } = useActor();
  return useQuery<AttendanceDay[]>({
    queryKey: ["attendance", "student-month", studentId?.toString(), month],
    queryFn: async () => {
      if (!actor || !studentId) return [];
      const [year, m] = month.split("-").map(Number);
      const daysInMonth = new Date(year, m, 0).getDate();
      const dates = Array.from(
        { length: daysInMonth },
        (_, i) => `${month}-${String(i + 1).padStart(2, "0")}`,
      );
      return Promise.all(
        dates.map(async (date) => {
          try {
            const r = await actor.getAttendance(studentId, date);
            return { date, isPresent: r.isPresent };
          } catch {
            return { date, isPresent: false };
          }
        }),
      );
    },
    enabled: !!actor && !isFetching && !!studentId,
  });
}

export function useFeeRecord(studentId: bigint | null, month: string) {
  const { actor, isFetching } = useActor();
  return useQuery<FeeRecord | null>({
    queryKey: ["fee", studentId?.toString(), month],
    queryFn: async () => {
      if (!actor || !studentId) return null;
      try {
        return await actor.getFeeRecord(studentId, month);
      } catch {
        return null;
      }
    },
    enabled: !!actor && !isFetching && !!studentId,
  });
}

export function usePendingFeesForMonth(month: string) {
  const { actor, isFetching } = useActor();
  return useQuery<FeeRecord[]>({
    queryKey: ["fees", "pending", month],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getPendingFeesForMonth(month);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useTotalIncomeForMonth(month: string) {
  const { actor, isFetching } = useActor();
  return useQuery<bigint>({
    queryKey: ["income", month],
    queryFn: async () => {
      if (!actor) return 0n;
      return actor.getTotalIncomeForMonth(month);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAllFeeRecordsForMonth(month: string, students: Student[]) {
  const { actor, isFetching } = useActor();
  return useQuery<Record<string, FeeRecord | null>>({
    queryKey: ["fees", "all-students", month],
    queryFn: async () => {
      if (!actor) return {};
      const results = await Promise.all(
        students.map(async (s) => {
          try {
            const record = await actor.getFeeRecord(s.id, month);
            return [s.id.toString(), record] as const;
          } catch {
            return [s.id.toString(), null] as const;
          }
        }),
      );
      return Object.fromEntries(results);
    },
    enabled: !!actor && !isFetching && students.length > 0,
  });
}

export function useAddStudent() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (student: Student) => actor!.addStudent(student),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["students"] }),
  });
}

export function useUpdateStudent() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, student }: { id: bigint; student: Student }) =>
      actor!.updateStudent(id, student),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["students"] }),
  });
}

export function useDeleteStudent() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: bigint) => actor!.deleteStudent(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["students"] }),
  });
}

export function useMarkAttendance() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (record: AttendanceRecord) => actor!.markAttendance(record),
    onSuccess: (_data, record) => {
      qc.invalidateQueries({ queryKey: ["attendance", "date", record.date] });
      qc.invalidateQueries({ queryKey: ["attendance", "student-month"] });
    },
  });
}

export function useUpsertFeeRecord() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (record: FeeRecord) => actor!.upsertFeeRecord(record),
    onSuccess: (_data, record) => {
      qc.invalidateQueries({ queryKey: ["fee", record.studentId.toString()] });
      qc.invalidateQueries({ queryKey: ["fees"] });
      qc.invalidateQueries({ queryKey: ["income"] });
    },
  });
}

export function useAddTopicLog() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: (log: TopicLog) => actor!.addTopicLog(log),
  });
}

export function useUpdateSettings() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (settings: Settings) => actor!.updateSettings(settings),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["settings"] }),
  });
}
