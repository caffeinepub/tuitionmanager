import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Settings {
    instituteName: string;
    logoData?: string;
}
export interface FeeRecord {
    month: string;
    paymentStatus: PaymentStatus;
    studentId: bigint;
    classesConducted: bigint;
    dueDate: string;
    classesAttended: bigint;
    paidAmount: bigint;
}
export interface AttendanceRecord {
    studentId: bigint;
    isPresent: boolean;
    date: string;
}
export interface TopicLog {
    id: bigint;
    topic: string;
    studentId: bigint;
    date: string;
    notes?: string;
}
export interface Student {
    id: bigint;
    name: string;
    academicSession: string;
    batch: string;
    contactNumber: string;
    monthlyFee: bigint;
    className: string;
}
export enum PaymentStatus {
    Paid = "Paid",
    Pending = "Pending"
}
export interface backendInterface {
    addStudent(student: Student): Promise<bigint>;
    addTopicLog(log: TopicLog): Promise<bigint>;
    deleteStudent(id: bigint): Promise<void>;
    getAllFeeRecords(): Promise<Array<FeeRecord>>;
    getAllStudents(): Promise<Array<Student>>;
    getAttendance(studentId: bigint, date: string): Promise<AttendanceRecord>;
    getFeeRecord(studentId: bigint, month: string): Promise<FeeRecord>;
    getPendingFeesForMonth(month: string): Promise<Array<FeeRecord>>;
    getSettings(): Promise<Settings>;
    getStudent(id: bigint): Promise<Student>;
    getTopicLog(id: bigint): Promise<TopicLog>;
    getTotalIncomeForMonth(month: string): Promise<bigint>;
    markAttendance(record: AttendanceRecord): Promise<void>;
    updateSettings(newSettings: Settings): Promise<void>;
    updateStudent(id: bigint, student: Student): Promise<void>;
    updateTopicLog(id: bigint, log: TopicLog): Promise<void>;
    upsertFeeRecord(record: FeeRecord): Promise<void>;
}
