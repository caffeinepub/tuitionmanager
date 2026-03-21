import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import {
  AlertCircle,
  CalendarCheck,
  Clock,
  Loader2,
  Plus,
  Users,
  Wallet,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useActor } from "../hooks/useActor";
import {
  useAllStudents,
  usePendingFeesForMonth,
  useTotalIncomeForMonth,
} from "../hooks/useQueries";
import { seedSampleData } from "../lib/seedData";
import { topicLogStore } from "../lib/topicLogStore";

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

function formatCurrency(amount: bigint) {
  return `₹${Number(amount).toLocaleString("en-IN")}`;
}

function formatDate(dateStr: string) {
  const [y, m, d] = dateStr.split("-");
  return new Date(Number(y), Number(m) - 1, Number(d)).toLocaleDateString(
    "en-IN",
    {
      day: "numeric",
      month: "short",
    },
  );
}

const iconChipColors = [
  { bg: "bg-accent", iconColor: "text-primary" },
  { bg: "bg-green-50", iconColor: "text-green-600" },
  { bg: "bg-orange-50", iconColor: "text-orange-500" },
  { bg: "bg-purple-50", iconColor: "text-purple-600" },
];

export default function HomePage() {
  const navigate = useNavigate();
  const { actor } = useActor();
  const qc = useQueryClient();
  const month = currentMonth();

  const { data: students = [], isLoading: loadingStudents } = useAllStudents();
  const { data: pendingFees = [], isLoading: loadingPending } =
    usePendingFeesForMonth(month);
  const { data: totalIncome, isLoading: loadingIncome } =
    useTotalIncomeForMonth(month);
  const [seeding, setSeeding] = useState(false);

  const recentLogs = topicLogStore.getRecent(5);

  const stats = [
    {
      label: "Total Students",
      value: loadingStudents ? null : students.length.toString(),
      sub: "Active",
      icon: Users,
      ...iconChipColors[0],
    },
    {
      label: "Monthly Income",
      value: loadingIncome ? null : formatCurrency(totalIncome ?? 0n),
      sub: "Received",
      icon: Wallet,
      ...iconChipColors[1],
    },
    {
      label: "Pending Fees",
      value: loadingPending ? null : pendingFees.length.toString(),
      sub: "Students",
      icon: AlertCircle,
      ...iconChipColors[2],
    },
    {
      label: "Topic Logs",
      value: recentLogs.length.toString(),
      sub: "This month",
      icon: CalendarCheck,
      ...iconChipColors[3],
    },
  ];

  async function handleSeed() {
    if (!actor) return;
    setSeeding(true);
    try {
      await seedSampleData(actor, month);
      await qc.invalidateQueries({ queryKey: ["students"] });
      await qc.invalidateQueries({ queryKey: ["fees"] });
      await qc.invalidateQueries({ queryKey: ["income"] });
      toast.success("Sample data loaded!");
    } catch {
      toast.error("Failed to load sample data");
    } finally {
      setSeeding(false);
    }
  }

  return (
    <div className="min-h-full bg-background px-4 py-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-foreground mb-1">
        Home Dashboard
      </h1>
      <p className="text-muted-foreground text-sm mb-6">
        {new Date().toLocaleDateString("en-IN", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        })}
      </p>

      <section data-ocid="home.section">
        <h2 className="text-base font-semibold text-foreground mb-3">
          At a Glance
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {stats.map(({ label, value, sub, icon: Icon, bg, iconColor }) => (
            <div
              key={label}
              className="bg-card rounded-2xl shadow-card p-4 flex flex-col gap-2"
              data-ocid="home.card"
            >
              <div
                className={`w-9 h-9 rounded-full ${bg} flex items-center justify-center`}
              >
                <Icon className={`w-4 h-4 ${iconColor}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">
                  {label}
                </p>
                {value === null ? (
                  <Skeleton className="h-7 w-16 mt-1" />
                ) : (
                  <p className="text-2xl font-bold text-foreground leading-tight">
                    {value}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-6" data-ocid="home.section">
        <h2 className="text-base font-semibold text-foreground mb-3">
          Quick Actions
        </h2>
        <div className="flex gap-3">
          <Button
            className="flex-1"
            onClick={() => navigate({ to: "/attendance" })}
            data-ocid="home.attendance.primary_button"
          >
            <CalendarCheck className="w-4 h-4 mr-2" />
            Mark Attendance
          </Button>
          <Button
            variant="secondary"
            className="flex-1"
            onClick={() => navigate({ to: "/students" })}
            data-ocid="home.students.secondary_button"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Student
          </Button>
        </div>
      </section>

      <section className="mt-6">
        <h2 className="text-base font-semibold text-foreground mb-3">
          Recent Activities
        </h2>
        {recentLogs.length === 0 ? (
          <div
            className="bg-card rounded-2xl shadow-card p-6 text-center"
            data-ocid="home.topics.empty_state"
          >
            <p className="text-muted-foreground text-sm">No topic logs yet.</p>
            {students.length === 0 && (
              <Button
                variant="outline"
                className="mt-3"
                onClick={handleSeed}
                disabled={seeding || !actor}
                data-ocid="home.seed.button"
              >
                {seeding ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : null}
                Load Sample Data
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {recentLogs.map((log, i) => (
              <div
                key={log.id}
                className="bg-card rounded-2xl shadow-card p-4 flex items-start gap-3"
                data-ocid={`home.topics.item.${i + 1}`}
              >
                <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {log.topic}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {log.batch ?? ""} · {formatDate(log.date)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <footer className="mt-8 py-4 text-center">
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()}.{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-primary transition-colors"
          >
            Built with ❤️ using caffeine.ai
          </a>
        </p>
      </footer>
    </div>
  );
}
