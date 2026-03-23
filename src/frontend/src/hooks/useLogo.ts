import { useSettings } from "./useQueries";

export function useLogo() {
  const { data } = useSettings();
  return data?.logoData ?? null;
}
