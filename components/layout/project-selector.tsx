"use client";

import * as React from "react";
import { ChevronsUpDown, FolderOpen, Check } from "lucide-react";
import { useProject, type Project } from "@/lib/project-context";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";

export function ProjectSelector() {
  const { activeProject, setActiveProject, projects } = useProject();
  const [open, setOpen] = React.useState(false);

  const activeProjects = projects.filter((p) => p.status === "active");
  const archivedProjects = projects.filter((p) => p.status === "archived");

  function handleSelect(project: Project) {
    setActiveProject(project);
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-label="Select project"
            className="w-[220px] justify-between gap-2 text-sm font-normal"
          />
        }
      >
        <FolderOpen className="shrink-0 text-muted-foreground" />
        <span className="truncate flex-1 text-start">
          {activeProject?.name ?? "Select project"}
        </span>
        <ChevronsUpDown className="shrink-0 text-muted-foreground opacity-50" />
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search projects..." />
          <CommandList>
            <CommandEmpty>No projects found.</CommandEmpty>
            {activeProjects.length > 0 && (
              <CommandGroup heading="Active Projects">
                {activeProjects.map((project) => (
                  <CommandItem
                    key={project.id}
                    value={project.name}
                    onSelect={() => handleSelect(project)}
                  >
                    <Check
                      className={cn(
                        "shrink-0",
                        activeProject?.id === project.id
                          ? "opacity-100"
                          : "opacity-0"
                      )}
                    />
                    <span className="truncate">{project.name}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {archivedProjects.length > 0 && (
              <CommandGroup heading="Archived">
                {archivedProjects.map((project) => (
                  <CommandItem
                    key={project.id}
                    value={project.name}
                    onSelect={() => handleSelect(project)}
                  >
                    <Check
                      className={cn(
                        "shrink-0",
                        activeProject?.id === project.id
                          ? "opacity-100"
                          : "opacity-0"
                      )}
                    />
                    <span className="truncate">{project.name}</span>
                    <Badge variant="secondary" className="ml-auto text-xs">
                      archived
                    </Badge>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
