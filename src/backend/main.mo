import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Order "mo:core/Order";
import Text "mo:core/Text";
import List "mo:core/List";
import Runtime "mo:core/Runtime";



actor {
  public type Settings = {
    instituteName : Text;
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

  var settings : Settings = {
    instituteName = "Default Institute";
  };

  public type StudentId = Nat;
  public type Month = Text;

  let students = Map.empty<Nat, Student>();
  let attendance = Map.empty<Text, AttendanceRecord>();
  let topicLogs = Map.empty<Nat, TopicLog>();
  let feeRecords = Map.empty<Text, FeeRecord>();

  var nextStudentId = 1;
  var nextTopicLogId = 1;

  public shared ({ caller }) func updateSettings(newSettings : Settings) : async () {
    settings := newSettings;
  };

  public query ({ caller }) func getSettings() : async Settings {
    settings;
  };

  public shared ({ caller }) func addStudent(student : Student) : async Nat {
    let id = nextStudentId;
    let newStudent : Student = {
      student with
      id;
    };
    students.add(id, newStudent);
    nextStudentId += 1;
    id;
  };

  public shared ({ caller }) func updateStudent(id : Nat, student : Student) : async () {
    if (not students.containsKey(id)) {
      Runtime.trap("Student not found");
    };
    let updatedStudent : Student = {
      student with id;
    };
    students.add(id, updatedStudent);
  };

  public query ({ caller }) func getStudent(id : Nat) : async Student {
    switch (students.get(id)) {
      case (null) { Runtime.trap("Student not found") };
      case (?student) { student };
    };
  };

  public shared ({ caller }) func deleteStudent(id : Nat) : async () {
    students.remove(id);
  };

  public query ({ caller }) func getAllStudents() : async [Student] {
    students.values().toArray().sort();
  };

  public shared ({ caller }) func markAttendance(record : AttendanceRecord) : async () {
    let key = record.studentId.toText() # "_" # record.date;
    attendance.add(key, record);
  };

  public query ({ caller }) func getAttendance(studentId : Nat, date : Text) : async AttendanceRecord {
    let key = studentId.toText() # "_" # date;
    switch (attendance.get(key)) {
      case (null) { Runtime.trap("Attendance record not found") };
      case (?record) { record };
    };
  };

  public shared ({ caller }) func addTopicLog(log : TopicLog) : async Nat {
    let id = nextTopicLogId;
    let newLog : TopicLog = {
      log with id;
    };
    topicLogs.add(id, newLog);
    nextTopicLogId += 1;
    id;
  };

  public shared ({ caller }) func updateTopicLog(id : Nat, log : TopicLog) : async () {
    if (not topicLogs.containsKey(id)) { Runtime.trap("Topic log not found") };
    let updatedLog : TopicLog = {
      log with id;
    };
    topicLogs.add(id, updatedLog);
  };

  public query ({ caller }) func getTopicLog(id : Nat) : async TopicLog {
    switch (topicLogs.get(id)) {
      case (null) { Runtime.trap("Topic log not found") };
      case (?log) { log };
    };
  };

  public shared ({ caller }) func upsertFeeRecord(record : FeeRecord) : async () {
    let key = record.studentId.toText() # "_" # record.month;
    feeRecords.add(key, record);
  };

  public query ({ caller }) func getFeeRecord(studentId : Nat, month : Text) : async FeeRecord {
    let key = studentId.toText() # "_" # month;
    switch (feeRecords.get(key)) {
      case (null) { Runtime.trap("Fee record not found") };
      case (?record) { record };
    };
  };

  public query ({ caller }) func getPendingFeesForMonth(month : Text) : async [FeeRecord] {
    let result = List.empty<FeeRecord>();

    for ((_, record) in feeRecords.entries()) {
      if (record.month == month and record.paymentStatus == #Pending) {
        result.add(record);
      };
    };

    result.toArray().sort();
  };

  public query ({ caller }) func getTotalIncomeForMonth(month : Text) : async Nat {
    feeRecords.values().toArray().filter(func(r) { r.month == month }).foldLeft(
      0,
      func(acc, record) { acc + record.paidAmount },
    );
  };
};
