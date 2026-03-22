import { useEffect, useState } from "react";
import { settingsStore } from "../lib/settingsStore";

export function useSettingsName() {
  const [name, setName] = useState<string>(() => settingsStore.getName());

  useEffect(() => {
    function onUpdate() {
      setName(settingsStore.getName());
    }
    window.addEventListener("settings-updated", onUpdate);
    return () => window.removeEventListener("settings-updated", onUpdate);
  }, []);

  return name;
}
