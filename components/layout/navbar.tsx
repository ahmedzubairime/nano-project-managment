"use client";

import * as React from "react";
import { Menu, Languages } from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/theme-toggle";
import { ProjectSelector } from "@/components/layout/project-selector";
import { MobileSidebar } from "@/components/layout/mobile-sidebar";
import { NavbarNotifications } from "@/components/layout/navbar-notifications";

import { usePathname, useRouter } from "@/i18n/routing";
import { useLocale, useTranslations } from "next-intl";

export function Navbar() {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("navigation");

  const toggleLanguage = () => {
    const nextLocale = locale === "ar" ? "en" : "ar";
    router.replace(pathname, { locale: nextLocale });
  };

  return (
    <>
      <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-border bg-background/95 backdrop-blur-sm supports-backdrop-filter:bg-background/60 px-4">
        {/* Mobile menu trigger */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-label="Open menu"
          onClick={() => setMobileOpen(true)}
        >
          <Menu />
        </Button>

        {/* Project selector */}
        <ProjectSelector />

        {/* Spacer */}
        <div className="flex-1" />

        {/* Right-side controls */}
        <div className="flex items-center gap-1">
          {/* Language switcher */}
          <Button
            variant="ghost"
            size="icon"
            aria-label={t("switchLanguage")}
            onClick={toggleLanguage}
            title={t("switchLanguage")}
          >
            <Languages />
          </Button>

          {/* Theme toggle */}
          <ThemeToggle />

          {/* Notifications */}
          <NavbarNotifications />

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* Clerk UserButton */}
          <UserButton />
        </div>
      </header>

      {/* Mobile sidebar sheet */}
      <MobileSidebar open={mobileOpen} onOpenChange={setMobileOpen} />
    </>
  );
}
