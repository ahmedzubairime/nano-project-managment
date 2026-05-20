import {
  LayoutDashboard,
  Activity,
  CalendarDays,
  GanttChart,
  Building2,
  ClipboardCheck,
  BarChart3,
  Bell,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
}

export const sidebarNavItems: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Activities", href: "/activities", icon: Activity },
  { title: "Sessions", href: "/sessions", icon: CalendarDays },
  { title: "Timeline", href: "/timeline", icon: GanttChart },
  { title: "Centers", href: "/centers", icon: Building2 },
  { title: "Approvals", href: "/approvals", icon: ClipboardCheck },
  { title: "Reports", href: "/reports", icon: BarChart3 },
  { title: "Notifications", href: "/notifications", icon: Bell },
  { title: "Settings", href: "/settings", icon: Settings },
];
