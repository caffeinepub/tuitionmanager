const KEY = "tuition_academy_logo";

export const logoStore = {
  get(): string | null {
    return localStorage.getItem(KEY);
  },
  set(dataUrl: string) {
    localStorage.setItem(KEY, dataUrl);
    window.dispatchEvent(new Event("logo-updated"));
  },
  remove() {
    localStorage.removeItem(KEY);
    window.dispatchEvent(new Event("logo-updated"));
  },
};
