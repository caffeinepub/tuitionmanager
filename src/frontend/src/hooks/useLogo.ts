import { useEffect, useState } from "react";
import { logoStore } from "../lib/logoStore";

export function useLogo() {
  const [logo, setLogo] = useState<string | null>(() => logoStore.get());

  useEffect(() => {
    function onUpdate() {
      setLogo(logoStore.get());
    }
    window.addEventListener("logo-updated", onUpdate);
    return () => window.removeEventListener("logo-updated", onUpdate);
  }, []);

  return logo;
}
