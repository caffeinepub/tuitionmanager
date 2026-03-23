import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Order "mo:core/Order";
import Text "mo:core/Text";
import List "mo:core/List";
import Runtime "mo:core/Runtime";

actor {
  public type Settings = {
    instituteName : Text;
    logoData : ?Text;
  };

  public type Student = {
    id : Nat;
    name : Text;
    className : Text;
    batch : Text;
    monthlyFee : Nat;
    contactNumber : Text;
    academicSession : Text;
  };

  public type AttendanceRecord = {
    studentId : Nat;
    date : Text;
    isPresent : Bool;
  };

  public type TopicLog = {
    id : Nat;
    date : Text;
    studentId : Nat;
    topic : Text;
    notes : ?Text;
  };

  public type FeeRecord = {
    studentId : Nat;
    month : Text;
    classesConducted : Nat;
    classesAttended : Nat;
    paidAmount : Nat;
    dueDate : Text;
    paymentStatus : PaymentStatus;
  };

  public type PaymentStatus = {
    #Paid;
    #Pending;
  };

  module Student {
    public func compare(s1 : Student, s2 : Student) : Order.Order {
      Nat.compare(s1.id, s2.id);
    };
  };

  module FeeRecord {
    public func compare(f1 : FeeRecord, f2 : FeeRecord) : Order.Order {
      Nat.compare(f1.studentId, f2.studentId);
    };
  };

  // Stable settings
  stable var settings : { instituteName : Text } = { instituteName = "My Academy" };
  stable var stableLogoData : ?Text = null;

  // Stable counters
  var nextStudentId : Nat = 1;
  var nextTopicLogId : Nat = 1;

  // Stable arrays for upgrade persistence
  stable var stableStudents : [(Nat, Student)] = [];
  stable var stableAttendance : [(Text, AttendanceRecord)] = [];
  stable var stableTopicLogs : [(Nat, TopicLog)] = [];
  stable var stableFeeRecords : [(Text, FeeRecord)] = [];
  stable var stableNextStudentId : Nat = 1;
  stable var stableNextTopicLogId : Nat = 1;

  // Runtime maps
  let students = Map.empty<Nat, Student>();
  let attendance = Map.empty<Text, AttendanceRecord>();
  let topicLogs = Map.empty<Nat, TopicLog>();
  let feeRecords = Map.empty<Text, FeeRecord>();

  // Restore from stable arrays on upgrade
  system func postupgrade() {
    for ((k, v) in stableStudents.vals()) { students.add(k, v) };
    for ((k, v) in stableAttendance.vals()) { attendance.add(k, v) };
    for ((k, v) in stableTopicLogs.vals()) { topicLogs.add(k, v) };
    for ((k, v) in stableFeeRecords.vals()) { feeRecords.add(k, v) };
    nextStudentId := stableNextStudentId;
    nextTopicLogId := stableNextTopicLogId;
    stableStudents := [];
    stableAttendance := [];
    stableTopicLogs := [];
    stableFeeRecords := [];
  };

  // Save to stable arrays before upgrade
  system func preupgrade() {
    stableStudents := students.entries().toArray();
    stableAttendance := attendance.entries().toArray();
    stableTopicLogs := topicLogs.entries().toArray();
    stableFeeRecords := feeRecords.entries().toArray();
    stableNextStudentId := nextStudentId;
    stableNextTopicLogId := nextTopicLogId;
  };

  public shared func updateSettings(newSettings : Settings) : async () {
    settings := { instituteName = newSettings.instituteName };
    stableLogoData := newSettings.logoData;
  };

  public query func getSettings() : async Settings {
    { instituteName = settings.instituteName; logoData = stableLogoData };
  };

  public shared func addStudent(student : Student) : async Nat {
    let id = nextStudentId;
    students.add(id, { student with id });
    nextStudentId += 1;
    id;
  };

  public shared func updateStudent(id : Nat, student : Student) : async () {
    if (not students.containsKey(id)) { Runtime.trap("Student not found") };
    students.add(id, { student with id });
  };

  public query func getStudent(id : Nat) : async Student {
    switch (students.get(id)) {
      case (null) { Runtime.trap("Student not found") };
      case (?s) { s };
    };
  };

  public shared func deleteStudent(id : Nat) : async () {
    students.remove(id);
  };

  public query func getAllStudents() : async [Student] {
    students.values().toArray().sort();
  };

  public shared func markAttendance(record : AttendanceRecord) : async () {
    let key = record.studentId.toText() # "_" # record.date;
    attendance.add(key, record);
  };

  public query func getAttendance(studentId : Nat, date : Text) : async AttendanceRecord {
    let key = studentId.toText() # "_" # date;
    switch (attendance.get(key)) {
      case (null) { Runtime.trap("Attendance record not found") };
      case (?r) { r };
    };
  };

  public query func getAttendanceForStudent(studentId : Nat) : async [AttendanceRecord] {
    let result = List.empty<AttendanceRecord>();
    for ((_, r) in attendance.entries()) {
      if (r.studentId == studentId) { result.add(r) };
    };
    result.toArray();
  };

  public shared func addTopicLog(log : TopicLog) : async Nat {
    let id = nextTopicLogId;
    topicLogs.add(id, { log with id });
    nextTopicLogId += 1;
    id;
  };

  public shared func updateTopicLog(id : Nat, log : TopicLog) : async () {
    if (not topicLogs.containsKey(id)) { Runtime.trap("Topic log not found") };
    topicLogs.add(id, { log with id });
  };

  public query func getTopicLog(id : Nat) : async TopicLog {
    switch (topicLogs.get(id)) {
      case (null) { Runtime.trap("Topic log not found") };
      case (?l) { l };
    };
  };

  public query func getAllTopicLogs() : async [TopicLog] {
    topicLogs.values().toArray();
  };

  public query func getTopicLogsForStudent(studentId : Nat) : async [TopicLog] {
    let result = List.empty<TopicLog>();
    for ((_, l) in topicLogs.entries()) {
      if (l.studentId == studentId) { result.add(l) };
    };
    result.toArray();
  };

  public shared func upsertFeeRecord(record : FeeRecord) : async () {
    let key = record.studentId.toText() # "_" # record.month;
    feeRecords.add(key, record);
  };

  public query func getFeeRecord(studentId : Nat, month : Text) : async FeeRecord {
    let key = studentId.toText() # "_" # month;
    switch (feeRecords.get(key)) {
      case (null) { Runtime.trap("Fee record not found") };
      case (?r) { r };
    };
  };

  public query func getFeeRecordsForStudent(studentId : Nat) : async [FeeRecord] {
    let result = List.empty<FeeRecord>();
    for ((_, r) in feeRecords.entries()) {
      if (r.studentId == studentId) { result.add(r) };
    };
    result.toArray().sort();
  };

  public query func getPendingFeesForMonth(month : Text) : async [FeeRecord] {
    let result = List.empty<FeeRecord>();
    for ((_, r) in feeRecords.entries()) {
      if (r.month == month and r.paymentStatus == #Pending) { result.add(r) };
    };
    result.toArray().sort();
  };

  public query func getAllFeeRecords() : async [FeeRecord] {
    feeRecords.values().toArray().sort();
  };

  // Returns total income for a month: sums Amount (paidAmount) only for Paid records.
  public query func getTotalIncomeForMonth(month : Text) : async Nat {
    var total : Nat = 0;
    for ((_, r) in feeRecords.entries()) {
      if (r.month == month and r.paymentStatus == #Paid) { total += r.paidAmount };
    };
    total;
  };
};
