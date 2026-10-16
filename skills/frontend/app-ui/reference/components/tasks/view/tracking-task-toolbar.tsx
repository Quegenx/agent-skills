import { Tabs } from "@base-ui/react/tabs";

import {
  app_clear,
  app_created,
  app_filter_view,
  app_reset,
  app_sort,
  app_task_priority,
  app_task_status,
  app_tasks_search,
  app_tasks_search_placeholder,
  app_view,
  app_view_board,
  app_view_list,
} from "#/paraglide/messages";
import {
  TrackingTaskPriorityIcon,
  TrackingTaskStatusIcon,
} from "@/components/tasks/editor/tracking-task-icons";
import { trackingTaskViewSwitchMs } from "@/components/tasks/view/tracking-task-view-switch";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/display/tooltip";
import { DateRangePicker } from "@/components/ui/forms/date-range/date-range-picker";
import { FilterChipOptions } from "@/components/ui/forms/filters/filter-chip";
import { SearchInput } from "@/components/ui/forms/filters/search-input";
import { AppIcon } from "@/components/ui/general/app-icon";
import { SmoothDropdown } from "@/components/ui/navigation/dropdown/smooth-dropdown";
import { SmoothSelect } from "@/components/ui/navigation/dropdown/smooth-select";
import { SegmentedTabsList } from "@/components/ui/navigation/tabs/segmented-tabs-list";
import { toIsoDate, useCalendarToday } from "@/lib/dates/calendar-dates";
import {
  trackingTaskPriorityItems,
  trackingTaskStatusItems,
} from "@/lib/tasks/tracking-task-labels";
import type { TrackingTask } from "@/lib/tasks/tracking-task-schema";
import {
  trackingTaskFiltersActive,
  trackingTaskSortLabels,
  trackingTaskSorts,
  trackingTaskVisibleStatuses,
  useTrackingTaskViewActions,
} from "@/lib/tasks/tracking-task-view";
import type { TrackingTaskViewState } from "@/lib/tasks/tracking-task-view";

/**
 * A calendar day (YYYY-MM-DD) is read and shown in UTC, so the server and the
 * browser render the same day.
 * The tasks toolbar: search, filters for priority, status and the
 * day created (with a reset once any is set), then which columns show, the
 * sort, and the board or list (onViewChange, which animates the switch).
 *
 * @returns The toolbar.
 */
export const TrackingTaskToolbar = ({
  view,
  tasks,
  onViewChange,
}: {
  view: TrackingTaskViewState;
  tasks: readonly TrackingTask[];
  onViewChange: (next: TrackingTaskViewState["view"]) => void;
}) => {
  const { setTrackingTaskView, resetTrackingTaskFilters } =
    useTrackingTaskViewActions();

  const visible = new Set(trackingTaskVisibleStatuses(view));
  // Days can be picked from the first task's day to today.
  const today = toIsoDate(useCalendarToday());
  let earliest = today;

  for (const task of tasks) {
    const day = task.createdAt.slice(0, 10);

    if (day < earliest) {
      earliest = day;
    }
  }

  const createdLimits = { min: earliest, max: today };

  return (
    <div
      className="tracking-task-toolbar"
      role="toolbar"
      aria-label={app_filter_view()}
    >
      <div className="tracking-task-toolbar-filters">
        <div className="toolbar-search">
          <SearchInput
            id="tracking-task-search"
            size="sm"
            aria-label={app_tasks_search()}
            placeholder={app_tasks_search_placeholder()}
            value={view.query}
            onChange={(event) => {
              setTrackingTaskView({ query: event.target.value });
            }}
          />
        </div>
        <FilterChipOptions
          label={app_task_priority()}
          options={trackingTaskPriorityItems.map((item) => ({
            ...item,
            icon: <TrackingTaskPriorityIcon priority={item.value} />,
          }))}
          values={view.priorities}
          count={(priority) =>
            tasks.filter((task) => task.priority === priority).length
          }
          onChange={(priorities) => {
            setTrackingTaskView({ priorities });
          }}
        />
        <FilterChipOptions
          label={app_task_status()}
          options={trackingTaskStatusItems.map((item) => ({
            ...item,
            icon: <TrackingTaskStatusIcon status={item.value} />,
          }))}
          values={view.statuses}
          count={(status) =>
            tasks.filter((task) => task.status === status).length
          }
          onChange={(statuses) => {
            setTrackingTaskView({ statuses });
          }}
        />
        <DateRangePicker
          id="tracking-task-created"
          appearance="chip"
          label={app_created()}
          placeholder={app_created()}
          clearLabel={app_clear()}
          from={view.createdFrom}
          to={view.createdTo}
          limits={createdLimits}
          onChange={(range) => {
            setTrackingTaskView({
              createdFrom: range.from,
              createdTo: range.to,
            });
          }}
        />
        {trackingTaskFiltersActive(view) && (
          <button
            type="button"
            className="filter-chip"
            data-variant="reset"
            onClick={resetTrackingTaskFilters}
          >
            <AppIcon icon="agent-close" data-icon="inline-start" />
            {app_reset()}
          </button>
        )}
      </div>
      <div className="tracking-task-toolbar-view">
        <span className="tracking-task-columns-button">
          <SmoothDropdown
            label={app_view()}
            appearance="chip"
            multiple
            options={trackingTaskStatusItems.map((item) => ({
              value: item.value,
              label: item.label,
              selected: visible.has(item.value),
              // The last shown column stays.
              disabled:
                visible.has(item.value) &&
                view.hiddenStatuses.length ===
                  trackingTaskStatusItems.length - 1,
            }))}
            onSelect={(next) => {
              const status = trackingTaskStatusItems.find(
                (item) => item.value === next
              )?.value;

              if (status) {
                setTrackingTaskView({
                  hiddenStatuses: visible.has(status)
                    ? [...view.hiddenStatuses, status]
                    : view.hiddenStatuses.filter((hidden) => hidden !== status),
                });
              }
            }}
          >
            <AppIcon icon="tasks-view" />
            {app_view()}
          </SmoothDropdown>
        </span>
        <SmoothSelect
          appearance="chip"
          label={app_sort()}
          items={trackingTaskSorts.map((sort) => ({
            value: sort,
            label: trackingTaskSortLabels[sort],
          }))}
          value={view.sort}
          onChange={(sort) => {
            setTrackingTaskView({ sort });
          }}
        />
        {/* The tooltips wait out the switch's morph before closing: while a
            view transition runs, the pointer hits its overlay, so the tab
            sees the mouse leave, and a tooltip closing then (in a flushSync)
            skips the transition and the switch shows at once. */}
        <Tabs.Root value={view.view} onValueChange={onViewChange}>
          <SegmentedTabsList index={view.view === "board" ? 0 : 1}>
            <Tooltip>
              <TooltipTrigger
                closeDelay={trackingTaskViewSwitchMs}
                render={
                  <Tabs.Tab value="board" aria-label={app_view_board()} />
                }
              >
                <AppIcon icon="tasks-kanban" />
              </TooltipTrigger>
              <TooltipContent>{app_view_board()}</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger
                closeDelay={trackingTaskViewSwitchMs}
                render={<Tabs.Tab value="list" aria-label={app_view_list()} />}
              >
                <AppIcon icon="tasks-list" />
              </TooltipTrigger>
              <TooltipContent>{app_view_list()}</TooltipContent>
            </Tooltip>
          </SegmentedTabsList>
        </Tabs.Root>
      </div>
    </div>
  );
};
