import { ProjectProvider } from "@/lib/project-context";
import { Navbar } from "@/components/layout/navbar";
import { Sidebar } from "@/components/layout/sidebar";
import { ArchiveBanner } from "@/components/layout/archive-banner";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProjectProvider>
      <div className="flex h-screen overflow-hidden">
        {/* Desktop sidebar */}
        <Sidebar />

        {/* Main content area */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Navbar */}
          <Navbar />

          {/* Archive Warning Banner */}
          <ArchiveBanner />

          {/* Workspace */}
          <main className="flex-1 overflow-y-auto p-4 md:p-6">
            {children}
          </main>
        </div>
      </div>
    </ProjectProvider>
  );
}

