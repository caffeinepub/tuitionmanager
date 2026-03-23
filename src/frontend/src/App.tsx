import { Toaster } from "@/components/ui/sonner";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import AppShellLayout from "./components/AppShell";
import InstallPrompt from "./components/InstallPrompt";
import AttendancePage from "./pages/AttendancePage";
import FeesPage from "./pages/FeesPage";
import HomePage from "./pages/HomePage";
import ReportsPage from "./pages/ReportsPage";
import StudentProfilePage from "./pages/StudentProfilePage";
import StudentsPage from "./pages/StudentsPage";

const rootRoute = createRootRoute({
  component: () => (
    <>
      <Toaster position="top-center" richColors />
      <AppShellLayout />
      <InstallPrompt />
    </>
  ),
});

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: HomePage,
});
const studentsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/students",
  component: StudentsPage,
});
const studentProfileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/students/$id",
  component: StudentProfilePage,
});
const attendanceRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/attendance",
  component: AttendancePage,
});
const feesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/fees",
  component: FeesPage,
});
const reportsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/reports",
  component: ReportsPage,
});

const routeTree = rootRoute.addChildren([
  homeRoute,
  studentsRoute,
  studentProfileRoute,
  attendanceRoute,
  feesRoute,
  reportsRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export { Outlet };

export default function App() {
  return <RouterProvider router={router} />;
}
