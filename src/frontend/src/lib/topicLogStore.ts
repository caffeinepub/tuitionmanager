const KEY = "apex_topic_logs";

export interface LocalTopicLog {
  id: string;
  studentId: string;
  date: string;
  topic: string;
  notes?: string;
  batch?: string;
}

export const topicLogStore = {
  getAll(): LocalTopicLog[] {
    try {
      return JSON.parse(localStorage.getItem(KEY) || "[]");
    } catch {
      return [];
    }
  },
  getForStudent(studentId: string): LocalTopicLog[] {
    return this.getAll()
      .filter((l) => l.studentId === studentId)
      .sort((a, b) => b.date.localeCompare(a.date));
  },
  getRecent(count: number): LocalTopicLog[] {
    return this.getAll()
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, count);
  },
  add(log: LocalTopicLog) {
    const all = this.getAll();
    all.push(log);
    localStorage.setItem(KEY, JSON.stringify(all));
  },
  update(id: string, updates: Partial<LocalTopicLog>) {
    const all = this.getAll();
    const idx = all.findIndex((l) => l.id === id);
    if (idx >= 0) {
      all[idx] = { ...all[idx], ...updates };
      localStorage.setItem(KEY, JSON.stringify(all));
    }
  },
  clear() {
    localStorage.removeItem(KEY);
  },
};
