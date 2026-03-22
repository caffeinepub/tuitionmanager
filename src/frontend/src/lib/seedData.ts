import type {
  AttendanceRecord,
  FeeRecord,
  Student,
  TopicLog,
} from "../backend";
import { PaymentStatus } from "../backend";
import { topicLogStore } from "./topicLogStore";

export const sampleStudents: Omit<Student, "id">[] = [
  {
    name: "Aarav Sharma",
    academicSession: "2025-26",
    className: "Class 10",
    batch: "Morning 7-8 AM",
    monthlyFee: 1500n,
    contactNumber: "9876543210",
  },
  {
    name: "Priya Patel",
    academicSession: "2025-26",
    className: "Class 9",
    batch: "Morning 7-8 AM",
    monthlyFee: 1400n,
    contactNumber: "9876543211",
  },
  {
    name: "Rohan Mehta",
    academicSession: "2025-26",
    className: "Class 8",
    batch: "Evening 5-6 PM",
    monthlyFee: 1200n,
    contactNumber: "9876543212",
  },
  {
    name: "Sneha Gupta",
    academicSession: "2025-26",
    className: "Class 10",
    batch: "Evening 5-6 PM",
    monthlyFee: 1500n,
    contactNumber: "9876543213",
  },
  {
    name: "Arjun Singh",
    academicSession: "2025-26",
    className: "Class 7",
    batch: "Evening 6-7 PM",
    monthlyFee: 1100n,
    contactNumber: "9876543214",
  },
  {
    name: "Kavya Nair",
    academicSession: "2025-26",
    className: "Class 6",
    batch: "Evening 6-7 PM",
    monthlyFee: 1000n,
    contactNumber: "9876543215",
  },
];

export function buildSampleFeeRecords(
  studentIds: bigint[],
  month: string,
): FeeRecord[] {
  const statuses = [
    PaymentStatus.Paid,
    PaymentStatus.Paid,
    PaymentStatus.Paid,
    PaymentStatus.Pending,
    PaymentStatus.Paid,
    PaymentStatus.Pending,
  ];
  const fees = [1500n, 1400n, 1200n, 1500n, 1100n, 1000n];
  return studentIds.map((studentId, i) => ({
    studentId,
    month,
    classesConducted: 22n,
    classesAttended: BigInt(18 + (i % 4)),
    paidAmount: statuses[i] === PaymentStatus.Paid ? fees[i] : 0n,
    dueDate: `${month}-10`,
    paymentStatus: statuses[i],
  }));
}

export function buildSampleAttendance(
  studentIds: bigint[],
  currentMonth: string,
): AttendanceRecord[] {
  const records: AttendanceRecord[] = [];
  const today = new Date();
  const daysToMark = Math.min(today.getDate() - 1, 20);
  for (let day = 1; day <= daysToMark; day++) {
    const date = `${currentMonth}-${String(day).padStart(2, "0")}`;
    for (let i = 0; i < studentIds.length; i++) {
      const isPresent = !(day % 7 === 0 && i % 2 === 0);
      records.push({ studentId: studentIds[i], date, isPresent });
    }
  }
  return records;
}

export function buildSampleTopicLogs(
  studentIds: bigint[],
  batches: string[],
  currentMonth: string,
) {
  const topics = [
    ["Quadratic Equations", "Circles and Tangents", "Probability"],
    ["Chemical Reactions", "Carbon Compounds", "Life Processes"],
    ["Rational Numbers", "Linear Equations", "Understanding Quadrilaterals"],
    ["Polynomials", "Coordinate Geometry", "Introduction to Euclid's Geometry"],
  ];
  const today = new Date();
  const days = [3, 6, 9, 12, 15, 18];
  for (let si = 0; si < studentIds.length; si++) {
    const sid = studentIds[si];
    const studentTopics = topics[si % topics.length];
    for (let di = 0; di < Math.min(3, days.length); di++) {
      const day = days[di];
      if (day > today.getDate()) continue;
      const date = `${currentMonth}-${String(day).padStart(2, "0")}`;
      topicLogStore.add({
        id: `seed-${sid}-${di}`,
        studentId: sid.toString(),
        date,
        topic: studentTopics[di % studentTopics.length],
        notes: di === 0 ? "Covered basic concepts" : undefined,
        batch: batches[si],
      });
    }
  }
}

export async function seedSampleData(
  actor: {
    addStudent: (s: Student) => Promise<bigint>;
    upsertFeeRecord: (r: FeeRecord) => Promise<void>;
    markAttendance: (r: AttendanceRecord) => Promise<void>;
    addTopicLog: (l: TopicLog) => Promise<bigint>;
  },
  currentMonth: string,
): Promise<void> {
  topicLogStore.clear();
  const studentIds = await Promise.all(
    sampleStudents.map((s) => actor.addStudent({ ...s, id: 0n })),
  );
  const feeRecords = buildSampleFeeRecords(studentIds, currentMonth);
  const attendanceRecords = buildSampleAttendance(studentIds, currentMonth);
  await Promise.all([
    ...feeRecords.map((r) => actor.upsertFeeRecord(r)),
    ...attendanceRecords.map((r) => actor.markAttendance(r)),
  ]);
  buildSampleTopicLogs(
    studentIds,
    sampleStudents.map((s) => s.batch),
    currentMonth,
  );
}
