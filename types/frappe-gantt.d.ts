declare module "frappe-gantt" {
  interface FrappeGanttTask {
    id: string;
    name: string;
    start: string;
    end: string;
    progress: number;
    custom_class?: string;
    dependencies?: string;
    important?: boolean;
    _start?: Date;
    _end?: Date;
  }

  interface FrappeGanttOptions {
    view_mode?: string;
    date_format?: string;
    popup_trigger?: "click" | "hover";
    readonly?: boolean;
    move_dependencies?: boolean;
    today_button?: boolean;
    view_mode_select?: boolean;
    holidays?: null | string[];
    on_click?: (task: FrappeGanttTask) => void;
    on_date_change?: (task: FrappeGanttTask, start: Date, end: Date) => void;
    on_progress_change?: (task: FrappeGanttTask, progress: number) => void;
    custom_popup_html?: (task: FrappeGanttTask) => string;
  }

  class Gantt {
    constructor(
      element: string | HTMLElement,
      tasks: FrappeGanttTask[],
      options?: FrappeGanttOptions
    );
    change_view_mode(mode: string, maintain_pos?: boolean): void;
    refresh(tasks: FrappeGanttTask[]): void;
  }

  export default Gantt;
}
