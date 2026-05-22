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
  { title: "dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "activities", href: "/activities", icon: Activity },
  { title: "sessions", href: "/sessions", icon: CalendarDays },
  { title: "timeline", href: "/timeline", icon: GanttChart },
  { title: "centers", href: "/centers", icon: Building2 },
  { title: "approvals", href: "/approvals", icon: ClipboardCheck },
  { title: "reports", href: "/reports", icon: BarChart3 },
  { title: "notifications", href: "/notifications", icon: Bell },
  { title: "settings", href: "/settings", icon: Settings },
];
