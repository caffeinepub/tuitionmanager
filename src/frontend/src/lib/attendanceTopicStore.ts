const KEY = "apex_attendance_topics";

type TopicMap = Record<string, string>; // key: "studentId_date"

export const attendanceTopicStore = {
  getAll(): TopicMap {
    try {
      return JSON.parse(localStorage.getItem(KEY) || "{}");
    } catch {
      return {};
    }
  },
  get(studentId: string, date: string): string {
    return this.getAll()[`${studentId}_${date}`] || "";
  },
  set(studentId: string, date: string, topic: string) {
    const all = this.getAll();
    if (topic.trim()) {
      all[`${studentId}_${date}`] = topic;
    } else {
      delete all[`${studentId}_${date}`];
    }
    localStorage.setItem(KEY, JSON.stringify(all));
  },
  getForStudentMonth(studentId: string, month: string): Record<string, string> {
    const all = this.getAll();
    const result: Record<string, string> = {};
    for (const [key, value] of Object.entries(all)) {
      if (key.startsWith(`${studentId}_${month}`)) {
        const date = key.slice(studentId.length + 1);
        result[date] = value;
      }
    }
    return result;
  },
  clear() {
    localStorage.removeItem(KEY);
  },
};
