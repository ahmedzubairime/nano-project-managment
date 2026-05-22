"use client";

import { Link, usePathname } from "@/i18n/routing";
import { sidebarNavItems } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTranslations } from "next-intl";

interface MobileSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MobileSidebar({ open, onOpenChange }: MobileSidebarProps) {
  const pathname = usePathname();
  const t = useTranslations("navigation");

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-64 p-0">
        <SheetHeader className="px-4 h-14 flex flex-row items-center gap-2 border-b border-border">
          <div className="size-7 rounded-md bg-brand-primary flex items-center justify-center">
            <span className="text-xs font-bold text-brand-primary-foreground">
              FP
            </span>
          </div>
          <SheetTitle className="text-sm font-semibold">{t("fieldPm")}</SheetTitle>
        </SheetHeader>
        <ScrollArea className="flex-1 h-[calc(100vh-3.5rem)]">
          <nav className="layout-sidebar py-2">
            {sidebarNavItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => onOpenChange(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-accent text-accent-foreground"
                      : "text-foreground/70 hover:bg-accent/50 hover:text-foreground"
                  )}
                >
                  <item.icon className="size-4 shrink-0" />
                  <span>{t(item.title as any)}</span>
                </Link>
              );
            })}
          </nav>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
