import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { DragOverEvent, UniqueIdentifier } from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState } from "react";
import type { CSSProperties, ReactNode } from "react";

import { app_task_drag_instructions } from "#/paraglide/messages";
import { useTrackingTaskActions } from "@/lib/tasks/tracking-task-atoms";
import { trackingTaskStatuses } from "@/lib/tasks/tracking-task-schema";
import type {
  TrackingTask,
  TrackingTaskStatus,
} from "@/lib/tasks/tracking-task-schema";
import type { TrackingTaskColumns } from "@/lib/tasks/tracking-task-view";

type TrackingTaskColumnIds = Record<TrackingTaskStatus, UniqueIdentifier[]>;

type TrackingTaskDragStyle = CSSProperties & {
  "--tracking-task-drag-transform": string;
  "--tracking-task-drag-transition": string;
};

const trackingTaskDropZoneId = (status: TrackingTaskStatus) =>
  `column:${status}`;

const trackingTaskColumnOf = (
  columns: TrackingTaskColumnIds,
  id: UniqueIdentifier
) =>
  trackingTaskStatuses.find(
    (status) =>
      trackingTaskDropZoneId(status) === id || columns[status].includes(id)
  );

const trackingTaskColumnIds = (
  columns: TrackingTaskColumns
): TrackingTaskColumnIds => ({
  suggested: columns.suggested.map((task) => task.id),
  active: columns.active.map((task) => task.id),
  paused: columns.paused.map((task) => task.id),
  finished: columns.finished.map((task) => task.id),
});

/**
 * The drag-and-drop board on `@dnd-kit`, shared by the board and the list:
 * tasks drag within a status to reorder and into another to change status.
 * While dragging, children get the moving order; dropping saves it. The
 * dragged task stays in place at half opacity while a dashed outline
 * follows the pointer.
 *
 * @returns The drag-and-drop context around the view.
 */
export const TrackingTaskDnd = ({
  columns,
  children,
}: {
  columns: TrackingTaskColumns;
  children: (
    tasksIn: (status: TrackingTaskStatus) => TrackingTask[]
  ) => ReactNode;
}) => {
  const { arrangeTrackingTasks } = useTrackingTaskActions();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // The order while a task is dragged; null otherwise.
  const [dragIds, setDragIds] = useState<TrackingTaskColumnIds | null>(null);

  const byId = new Map(
    trackingTaskStatuses.flatMap((status) =>
      columns[status].map((task) => [task.id, task] as const)
    )
  );

  const tasksIn = (status: TrackingTaskStatus) =>
    dragIds
      ? dragIds[status].flatMap((id) => {
          const task = byId.get(String(id));

          return task ? [task] : [];
        })
      : columns[status];

  // Moving over another status takes the task into it, before the task it
  // is over or at the end.
  const moveAcross = ({ active, over }: DragOverEvent) => {
    if (!(over && dragIds)) {
      return;
    }

    const from = trackingTaskColumnOf(dragIds, active.id);
    const to = trackingTaskColumnOf(dragIds, over.id);

    if (!(from && to) || from === to) {
      return;
    }

    const overIndex = dragIds[to].indexOf(over.id);
    const target = dragIds[to].filter((id) => id !== active.id);
    target.splice(overIndex === -1 ? target.length : overIndex, 0, active.id);
    setDragIds({
      ...dragIds,
      [from]: dragIds[from].filter((id) => id !== active.id),
      [to]: target,
    });
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      accessibility={{
        screenReaderInstructions: {
          draggable: app_task_drag_instructions(),
        },
      }}
      onDragStart={() => {
        setDragIds(trackingTaskColumnIds(columns));
      }}
      onDragOver={moveAcross}
      onDragCancel={() => {
        setDragIds(null);
      }}
      onDragEnd={({ active, over }) => {
        if (dragIds && over) {
          const status = trackingTaskColumnOf(dragIds, active.id);
          const ids = status ? dragIds[status] : [];
          const from = ids.indexOf(active.id);
          const to = ids.indexOf(over.id);

          const moved = from !== -1 && to !== -1 && from !== to;

          const arranged =
            status && moved
              ? { ...dragIds, [status]: arrayMove(ids, from, to) }
              : dragIds;

          arrangeTrackingTasks({
            suggested: arranged.suggested.map(String),
            active: arranged.active.map(String),
            paused: arranged.paused.map(String),
            finished: arranged.finished.map(String),
          });
        }

        setDragIds(null);
      }}
    >
      {children(tasksIn)}
      <DragOverlay className="tracking-task-drag-overlay">
        <span aria-hidden="true" />
      </DragOverlay>
    </DndContext>
  );
};

/**
 * A status's tasks as a drop zone and sortable list.
 *
 * @returns The drop zone.
 */
export const TrackingTaskDropZone = ({
  status,
  tasks,
  className,
  children,
}: {
  status: TrackingTaskStatus;
  tasks: TrackingTask[];
  className: string;
  children: ReactNode;
}) => {
  const { setNodeRef } = useDroppable({ id: trackingTaskDropZoneId(status) });

  return (
    <SortableContext
      id={status}
      items={tasks.map((task) => task.id)}
      strategy={verticalListSortingStrategy}
    >
      <div ref={setNodeRef} className={className}>
        {children}
      </div>
    </SortableContext>
  );
};

/**
 * One task that can be dragged; off while the order cannot change.
 *
 * @returns The sortable task.
 */
export const TrackingTaskSortable = ({
  taskId,
  disabled,
  children,
}: {
  taskId: string;
  disabled: boolean;
  children: ReactNode;
}) => {
  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: taskId, disabled });

  const style: TrackingTaskDragStyle = {
    "--tracking-task-drag-transform":
      CSS.Transform.toString(transform) ?? "none",
    "--tracking-task-drag-transition": transition ?? "none",
  };

  // dnd-kit's attributes make the wrapper a button with aria-disabled while
  // dragging is off, which marks the task's own buttons and checkbox inside
  // it disabled to screen readers; without drag, the wrapper is plain.
  const dragProps = disabled ? undefined : { ...attributes, ...listeners };

  return (
    <div
      ref={setNodeRef}
      className="tracking-task-draggable"
      data-dragging={isDragging || undefined}
      data-drag-disabled={disabled || undefined}
      style={style}
      {...dragProps}
    >
      {children}
    </div>
  );
};
