import {
  TrackingTaskPriorityIcon,
  TrackingTaskStatusIcon,
} from "@/components/tasks/editor/tracking-task-icons";
import {
  trackingTaskPriorityItems,
  trackingTaskStatusItems,
} from "@/lib/tasks/tracking-task-labels";

/**
 * The statuses and priorities with their icons, as the choices of any task
 * status or priority dropdown. Built on render: the labels follow the
 * page's language.
 *
 * @returns The status choices.
 */
export const trackingTaskStatusChoices = () =>
  trackingTaskStatusItems.map((item) => ({
    ...item,
    icon: <TrackingTaskStatusIcon status={item.value} />,
  }));

/**
 * The task priorities with their icons, as the choices of any priority
 * dropdown; built on render so the labels follow the page's language.
 *
 * @returns The priority choices.
 */
export const trackingTaskPriorityChoices = () =>
  trackingTaskPriorityItems.map((item) => ({
    ...item,
    icon: <TrackingTaskPriorityIcon priority={item.value} />,
  }));
