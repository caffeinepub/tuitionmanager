# TuitionManager

## Current State
New project. No existing code.

## Requested Changes (Diff)

### Add
- Home dashboard with institute name, student count, monthly income, pending fees count, and navigation
- Student management: add/edit/delete students with name, class, batch/timing, monthly fee, contact number
- Student profile page: basic details, attendance history, topics covered, fee history
- Attendance system: daily mark Present/Absent per student, date-wise storage, monthly stats (total classes, attended, percentage)
- Fees management: per student per month — monthly fee, classes conducted/attended, auto-calculated adjusted fee, paid amount, pending amount, payment status, due date
- Pending fees section: list students with pending fees, filter by month
- Topic/class log: date, student or batch, topic covered, optional notes; viewable per student
- Monthly summary report: per student (attendance, topics, fees) and overall income
- Print/PDF export of reports

### Modify
N/A

### Remove
N/A

## Implementation Plan
1. Backend (Motoko):
   - Student entity: id, name, class, batch, monthlyFee, contactNumber
   - Attendance entity: studentId, date, present (bool)
   - Topic log entity: id, date, studentId (or batch), topic, notes
   - Fee record entity: studentId, month (YYYY-MM), classesConducted, classesAttended, paidAmount, dueDate, paymentStatus
   - Settings entity: instituteName
   - Queries: getStudents, getAttendanceByStudent, getAttendanceByMonth, getTopicsByStudent, getFeeRecord, getPendingFees, getMonthlyIncome
   - Mutations: addStudent, updateStudent, deleteStudent, markAttendance, addTopicLog, upsertFeeRecord, updateSettings

2. Frontend:
   - Mobile-first layout with bottom nav (Home, Students, Attendance, Fees, Reports)
   - Home dashboard page
   - Students list + add/edit form + student profile page
   - Attendance page: date picker, student list, toggle Present/Absent
   - Fees page: monthly fee table, pending fees filter
   - Reports page: monthly summary per student, print/PDF export
   - Topic log accessible from student profile
