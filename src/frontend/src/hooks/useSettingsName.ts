import { useSettings } from "./useQueries";

export function useSettingsName() {
  const { data } = useSettings();
  return data?.instituteName ?? "My Academy";
}
