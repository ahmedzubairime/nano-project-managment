"use client";

import { Link, usePathname } from "@/i18n/routing";
import { sidebarNavItems } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useTranslations } from "next-intl";

export function Sidebar() {
  const pathname = usePathname();
  const t = useTranslations("navigation");

  return (
    <aside className="hidden md:flex md:w-56 lg:w-60 flex-col border-e border-border bg-sidebar">
      <div className="flex items-center gap-2 px-4 h-14 border-b border-border">
        <div className="size-7 rounded-md bg-brand-primary flex items-center justify-center">
          <span className="text-xs font-bold text-brand-primary-foreground">
            FP
          </span>
        </div>
        <span className="font-semibold text-sm text-sidebar-foreground truncate">
          {t("fieldPm")}
        </span>
      </div>
      <ScrollArea className="flex-1">
        <nav className="layout-sidebar py-2">
          {sidebarNavItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                )}
              >
                <item.icon className="size-4 shrink-0" />
                <span>{t(item.title as any)}</span>
              </Link>
            );
          })}
        </nav>
      </ScrollArea>
      <Separator />
      <div className="px-4 py-3">
        <p className="text-xs text-text-muted">Field PM v0.1</p>
      </div>
    </aside>
  );
}
