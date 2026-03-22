const KEY = "apex_remarks";
export const remarksStore = {
  get(studentId: string, month: string): string {
    try {
      const all = JSON.parse(localStorage.getItem(KEY) || "{}");
      return all[`${studentId}_${month}`] || "";
    } catch {
      return "";
    }
  },
  set(studentId: string, month: string, text: string) {
    try {
      const all = JSON.parse(localStorage.getItem(KEY) || "{}");
      all[`${studentId}_${month}`] = text;
      localStorage.setItem(KEY, JSON.stringify(all));
    } catch {}
  },
};
