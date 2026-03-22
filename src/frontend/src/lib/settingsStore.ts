const NAME_KEY = "tuition_academy_name";
const DEFAULT_NAME = "Apex Tuition Center";

export const settingsStore = {
  getName(): string {
    return localStorage.getItem(NAME_KEY) || DEFAULT_NAME;
  },
  setName(name: string) {
    localStorage.setItem(NAME_KEY, name || DEFAULT_NAME);
    window.dispatchEvent(new Event("settings-updated"));
  },
};
