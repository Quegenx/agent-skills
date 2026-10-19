import {
  app_recent_scans,
  app_scan_failed_short,
  app_scan_running,
  app_scan_skipped,
  app_scan_succeeded,
  app_scan_summary,
  app_scan_times,
  app_scans_load_failed,
  app_scans_none,
} from "#/paraglide/messages";
import { formatTimeAgo } from "@/lib/dates/relative-time";
import { useTrackingTaskScanRuns } from "@/lib/tasks/tracking-task-scan-run-atoms";
import type { TrackingTaskScanRun } from "@/lib/tasks/tracking-task-schema";

import { isNonEmptyText } from "../../../../backend/shared/text/non-empty-text";

const trackingTaskScanRunLabels: Record<TrackingTaskScanRun["status"], string> =
  {
    get running() {
      return app_scan_running();
    },
    get succeeded() {
      return app_scan_succeeded();
    },
    get failed() {
      return app_scan_failed_short();
    },
    get skipped() {
      return app_scan_skipped();
    },
  };

type TrackingTaskScanRunItem = TrackingTaskScanRun & { task?: string | null };

// Whether two scans ended alike: the same status, error and task.
const isSameScanOutcome = (
  first: TrackingTaskScanRunItem,
  second: TrackingTaskScanRunItem
) =>
  first.status === second.status &&
  first.error === second.error &&
  first.task === second.task;

// Back-to-back scans that ended the same way, failed or skipped for the same
// reason, as one entry with how many times: a task retrying a broken setup
// would otherwise fill the list with copies.
const groupRepeatedScanRuns = (runs: TrackingTaskScanRunItem[]) => {
  const groups: { run: TrackingTaskScanRunItem; times: number }[] = [];

  for (const run of runs) {
    const last = groups.at(-1);

    const unsuccessful = run.status === "failed" || run.status === "skipped";

    if (last && unsuccessful && isSameScanOutcome(last.run, run)) {
      last.times += 1;
    } else {
      groups.push({ run, times: 1 });
    }
  }

  return groups;
};

/**
 * Scans as a list, newest first: how each ended and when, how many groups,
 * new posts and matches, why it failed, and, when listing several tasks,
 * which task it was. The task sheet and the agent chat both show scans with
 * it.
 *
 * @returns The scans list.
 */
export const TrackingTaskScanRunList = ({
  runs,
}: {
  runs: TrackingTaskScanRunItem[];
}) => (
  <ol className="tracking-task-scan-runs" aria-label={app_recent_scans()}>
    {groupRepeatedScanRuns(runs).map(({ run, times }) => (
      <li key={run.id} data-status={run.status}>
        <span className="tracking-task-scan-run-head">
          <strong>
            {trackingTaskScanRunLabels[run.status]}
            {times > 1 && app_scan_times({ count: times })}
          </strong>
          <time dateTime={run.startedAt}>{formatTimeAgo(run.startedAt)}</time>
        </span>
        {isNonEmptyText(run.task) && <bdi>{run.task}</bdi>}
        {run.status !== "skipped" && (
          <span>
            {app_scan_summary({
              groups: run.groupsScanned,
              posts: run.postsScored,
              matches: run.matches,
            })}
          </span>
        )}
        {isNonEmptyText(run.error) && (
          <span className="tracking-task-scan-run-error">{run.error}</span>
        )}
      </li>
    ))}
  </ol>
);

/**
 * The task's latest scans by the monitor: when, how it ended, how many new
 * posts it scored and how many matches it found, and why it failed. Loaded
 * when the task's sheet opens.
 *
 * @returns The scans, or the load failure.
 */
export const TrackingTaskScanRuns = ({
  userId,
  taskId,
}: {
  userId: string;
  taskId: string;
}) => {
  const { runs, failed } = useTrackingTaskScanRuns(userId, taskId);

  if (failed) {
    return (
      <p className="text-sm text-destructive">{app_scans_load_failed()}</p>
    );
  }

  if (!runs) {
    return null;
  }

  if (runs.length === 0) {
    return <p className="text-sm text-muted-foreground">{app_scans_none()}</p>;
  }

  return <TrackingTaskScanRunList runs={runs} />;
};
