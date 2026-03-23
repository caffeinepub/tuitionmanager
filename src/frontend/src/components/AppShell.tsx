import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  BarChart3,
  Bell,
  CalendarCheck,
  ImagePlus,
  LayoutDashboard,
  Loader2,
  Trash2,
  Users,
  Wallet,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { useSettings, useUpdateSettings } from "../hooks/useQueries";

const navItems = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/students", label: "Students", icon: Users },
  { path: "/attendance", label: "Attendance", icon: CalendarCheck },
  { path: "/fees", label: "Fees", icon: Wallet },
  { path: "/reports", label: "Reports", icon: BarChart3 },
];

export default function AppShellLayout() {
  const navigate = useNavigate();
  const routerState = useRouterState();
  const pathname = routerState.location.pathname;
  const { data: settings } = useSettings();
  const instituteName = settings?.instituteName ?? "My Academy";
  const logo = settings?.logoData ?? null;
  const updateSettings = useUpdateSettings();

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [previewLogo, setPreviewLogo] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const instituteLetter = instituteName.charAt(0).toUpperCase();

  function handleOpenSettings() {
    setNameInput(instituteName);
    setPreviewLogo(logo);
    setSettingsOpen(true);
  }

  function handleLogoFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 500 * 1024) {
      toast.error("Logo must be smaller than 500 KB");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setPreviewLogo(result);
    };
    reader.readAsDataURL(file);
  }

  function handleRemoveLogo() {
    setPreviewLogo(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSaveSettings() {
    try {
      await updateSettings.mutateAsync({
        instituteName: nameInput.trim() || "My Academy",
        logoData: previewLogo ?? undefined,
      });
      toast.success("Settings saved");
      setSettingsOpen(false);
    } catch {
      toast.error("Failed to save settings");
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="app-header no-print fixed top-0 left-0 right-0 z-50 h-14 bg-card border-b border-border flex items-center px-4 gap-3 shadow-xs">
        {logo && (
          <img
            src={logo}
            alt="Academy Logo"
            className="h-8 w-8 object-contain rounded"
          />
        )}
        <span className="flex-1 text-lg font-semibold text-primary truncate">
          {instituteName}
        </span>
        <button
          type="button"
          className="relative p-2 rounded-full hover:bg-accent transition-colors"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5 text-muted-foreground" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full" />
        </button>
        <Sheet open={settingsOpen} onOpenChange={setSettingsOpen}>
          <SheetTrigger asChild>
            <button
              type="button"
              onClick={handleOpenSettings}
              className="p-1 rounded-full hover:opacity-80 transition-opacity"
              aria-label="Settings"
              data-ocid="settings.open_modal_button"
            >
              {logo ? (
                <img
                  src={logo}
                  alt="Logo"
                  className="w-8 h-8 object-contain rounded-full border border-border"
                />
              ) : (
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
                    {instituteLetter}
                  </AvatarFallback>
                </Avatar>
              )}
            </button>
          </SheetTrigger>
          <SheetContent data-ocid="settings.sheet">
            <SheetHeader>
              <SheetTitle>Settings</SheetTitle>
            </SheetHeader>
            <div className="mt-6 space-y-5">
              <div className="space-y-2">
                <Label htmlFor="institute-name">Academy / Institute Name</Label>
                <Input
                  id="institute-name"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="Enter institute name"
                  data-ocid="settings.input"
                />
              </div>

              {/* Logo Upload */}
              <div className="space-y-2">
                <Label>Academy Logo</Label>
                <p className="text-xs text-muted-foreground">
                  Shown on the home screen and printed reports. Max 500 KB.
                </p>
                {previewLogo ? (
                  <div className="flex items-center gap-3">
                    <img
                      src={previewLogo}
                      alt="Logo preview"
                      className="h-16 w-16 object-contain rounded-xl border border-border bg-accent/30"
                    />
                    <div className="flex flex-col gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <ImagePlus className="w-4 h-4 mr-1" />
                        Change
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={handleRemoveLogo}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Remove
                      </Button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full border-2 border-dashed border-border rounded-xl py-6 flex flex-col items-center gap-2 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                  >
                    <ImagePlus className="w-6 h-6" />
                    <span className="text-sm font-medium">Upload Logo</span>
                    <span className="text-xs">PNG, JPG, SVG</span>
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleLogoFileChange}
                />
              </div>

              <Button
                className="w-full"
                onClick={handleSaveSettings}
                disabled={updateSettings.isPending}
                data-ocid="settings.save_button"
              >
                {updateSettings.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : null}
                {updateSettings.isPending ? "Saving..." : "Save Settings"}
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </header>

      {/* Main Content */}
      <main className="flex-1 pt-14 pb-20 overflow-y-auto">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav className="bottom-nav no-print fixed bottom-0 left-0 right-0 z-50 h-16 bg-card border-t border-border px-2">
        <div className="flex h-full items-center justify-around">
          {navItems.map(({ path, label, icon: Icon }) => {
            const isActive =
              path === "/" ? pathname === "/" : pathname.startsWith(path);
            return (
              <button
                key={path}
                type="button"
                onClick={() => navigate({ to: path })}
                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors ${
                  isActive
                    ? "bg-accent text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                data-ocid={`nav.${label.toLowerCase()}.tab`}
              >
                <Icon className="w-5 h-5" />
                <span
                  className={`text-[11px] font-medium ${isActive ? "text-primary" : ""}`}
                >
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
