"use client";

import { useState, useTransition } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  type DragEndEvent,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import type { TaskRecord } from "@/app/lib/supabase";
import { createTask, updateTaskStatus, type TaskStatus } from "./actions";
import styles from "./tasks.module.css";

type BoardTask = {
  id: number;
  title: string;
  description: string;
  priority: string;
  assignee: string;
  deadline: string;
  status: TaskStatus;
};

type TaskDraft = {
  title: string;
  description: string;
  priority: string;
  deadline: string;
  clientId: string;
  assignedTo: string;
  departmentId: string;
  status: TaskStatus;
};

type TasksBoardProps = {
  error?: string;
  initialTasks: TaskRecord[];
  isConfigured: boolean;
};

const statusColumns: { id: TaskStatus; title: string }[] = [
  { id: "juniors", title: "Juniors" },
  { id: "seniors", title: "Seniors" },
  { id: "managers", title: "Managers" },
];

const validStatuses = new Set<TaskStatus>(statusColumns.map((column) => column.id));

const emptyDraft: TaskDraft = {
  title: "",
  description: "",
  priority: "medium",
  deadline: "",
  clientId: "",
  assignedTo: "",
  departmentId: "",
  status: "juniors",
};

const dateFormatter = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "2-digit",
});

function normalizeStatus(status: string | null): TaskStatus {
  return validStatuses.has(status as TaskStatus) ? (status as TaskStatus) : "juniors";
}

function formatDeadline(value: string | null) {
  if (!value) {
    return "No date";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "No date";
  }

  return dateFormatter.format(date);
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function mapTaskRecord(task: TaskRecord): BoardTask {
  const assignee = task.assigned_to ? `User ${task.assigned_to}` : "Unassigned";

  return {
    id: task.id,
    title: task.title,
    description: task.description?.trim() || "No description",
    priority: task.priority?.trim() || "medium",
    assignee,
    deadline: formatDeadline(task.deadline),
    status: normalizeStatus(task.status),
  };
}

function TaskCard({ task }: { task: BoardTask }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
  });

  return (
    <article
      className={`${styles.taskCard} ${isDragging ? styles.taskCardDragging : ""}`}
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform) }}
      {...listeners}
      {...attributes}
    >
      <div className={styles.taskCardTop}>
        <span className={styles.categoryTag}>{task.priority}</span>
        <span className={styles.avatar}>{getInitials(task.assignee)}</span>
      </div>
      <h4>{task.title}</h4>
      <p className={styles.taskDescription}>{task.description}</p>
      <div className={styles.taskMeta}>
        <span>{task.deadline}</span>
        <span>{task.assignee}</span>
      </div>
    </article>
  );
}

function KanbanColumn({
  column,
  tasks,
  openTaskForm,
}: {
  column: (typeof statusColumns)[number];
  tasks: BoardTask[];
  openTaskForm: (status: TaskStatus) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  });

  return (
    <section className={`${styles.kanbanColumn} ${isOver ? styles.kanbanColumnOver : ""}`} ref={setNodeRef}>
      <header className={styles.columnHeader}>
        <div>
          <h3>{column.title}</h3>
          <span>{tasks.length}</span>
        </div>
        <button type="button" onClick={() => openTaskForm(column.id)} aria-label={`Add ${column.title} task`}>
          +
        </button>
      </header>

      <div className={styles.columnBody}>
        {tasks.length > 0 ? (
          tasks.map((task) => <TaskCard key={task.id} task={task} />)
        ) : (
          <div className={styles.emptyColumn}>
            <span aria-hidden="true" />
            <p>No tasks currently. Board is empty</p>
            <button type="button" onClick={() => openTaskForm(column.id)}>
              Create Task
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

export default function TasksBoard({ error, initialTasks, isConfigured }: TasksBoardProps) {
  const [tasks, setTasks] = useState<BoardTask[]>(() => initialTasks.map(mapTaskRecord));
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [draft, setDraft] = useState(emptyDraft);
  const [message, setMessage] = useState(error ?? "");
  const [isPending, startTransition] = useTransition();
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor),
  );

  function openTaskForm(status: TaskStatus = "juniors") {
    setDraft({ ...emptyDraft, status });
    setMessage("");
    setIsFormOpen(true);
  }

  function closeTaskForm() {
    setIsFormOpen(false);
    setDraft(emptyDraft);
  }

  function addTask() {
    startTransition(async () => {
      const result = await createTask(draft);

      if (result.status === "error") {
        setMessage(result.message);
        return;
      }

      const createdTask = result.task;

      if (createdTask) {
        setTasks((currentTasks) => [mapTaskRecord(createdTask), ...currentTasks]);
      }

      closeTaskForm();
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over) {
      return;
    }

    const taskId = Number(active.id);
    const nextStatus = over.id as TaskStatus;
    const previousTasks = tasks;

    if (!Number.isInteger(taskId) || !validStatuses.has(nextStatus)) {
      return;
    }

    setTasks((currentTasks) =>
      currentTasks.map((task) => (task.id === taskId && task.status !== nextStatus ? { ...task, status: nextStatus } : task)),
    );

    startTransition(async () => {
      const result = await updateTaskStatus(taskId, nextStatus);

      if (result.status === "error") {
        setTasks(previousTasks);
        setMessage(result.message);
      }
    });
  }

  return (
    <>
      <div className={styles.boardHeader}>
        <div>
          <p className={styles.eyebrow}>Workspace</p>
          <h2>Tasks</h2>
        </div>
        <button className={styles.darkButton} type="button" onClick={() => openTaskForm()} disabled={isPending}>
          Add Task
        </button>
      </div>

      {!isConfigured ? (
        <div className={styles.noticeBox}>
          Add your Supabase URL and anon key to <code>.env</code> to load tasks from the database.
        </div>
      ) : null}

      {message ? <div className={styles.errorBox}>{message}</div> : null}

      {isFormOpen ? (
        <div className={styles.modalLayer} role="dialog" aria-modal="true" aria-labelledby="new-task-title">
          <form
            className={styles.taskModal}
            onSubmit={(event) => {
              event.preventDefault();
              addTask();
            }}
          >
            <div className={styles.modalHeader}>
              <div>
                <p className={styles.eyebrow}>Create task</p>
                <h3 id="new-task-title">New board card</h3>
              </div>
              <button className={styles.textButton} type="button" onClick={closeTaskForm} disabled={isPending}>
                Close
              </button>
            </div>

            <div className={styles.modalGrid}>
              <label>
                Task
                <input
                  placeholder="Task name"
                  value={draft.title}
                  onChange={(event) => setDraft({ ...draft, title: event.target.value })}
                  required
                  disabled={isPending}
                />
              </label>
              <label>
                Deadline
                <input
                  type="date"
                  value={draft.deadline}
                  onChange={(event) => setDraft({ ...draft, deadline: event.target.value })}
                  disabled={isPending}
                />
              </label>
              <label>
                Priority
                <select
                  value={draft.priority}
                  onChange={(event) => setDraft({ ...draft, priority: event.target.value })}
                  disabled={isPending}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </label>
              <label>
                Assigned user ID
                <input
                  min="1"
                  placeholder="Leave blank or enter existing user ID"
                  type="number"
                  value={draft.assignedTo}
                  onChange={(event) => setDraft({ ...draft, assignedTo: event.target.value })}
                  disabled={isPending}
                />
              </label>
              <label>
                Client ID
                <input
                  min="1"
                  placeholder="Leave blank or enter existing client ID"
                  type="number"
                  value={draft.clientId}
                  onChange={(event) => setDraft({ ...draft, clientId: event.target.value })}
                  disabled={isPending}
                />
              </label>
              <label>
                Department ID
                <input
                  min="1"
                  placeholder="Leave blank or enter existing department ID"
                  type="number"
                  value={draft.departmentId}
                  onChange={(event) => setDraft({ ...draft, departmentId: event.target.value })}
                  disabled={isPending}
                />
              </label>
              <label>
                Status
                <select
                  value={draft.status}
                  onChange={(event) => setDraft({ ...draft, status: event.target.value as TaskStatus })}
                  disabled={isPending}
                >
                  {statusColumns.map((column) => (
                    <option key={column.id} value={column.id}>
                      {column.title}
                    </option>
                  ))}
                </select>
              </label>
              <label className={styles.fullField}>
                Description
                <textarea
                  placeholder="Add context for the task"
                  value={draft.description}
                  onChange={(event) => setDraft({ ...draft, description: event.target.value })}
                  disabled={isPending}
                />
              </label>
            </div>

            <div className={styles.cardActions}>
              <button type="submit" disabled={isPending}>
                {isPending ? "Creating..." : "Create Task"}
              </button>
              <button type="button" onClick={closeTaskForm} disabled={isPending}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      ) : null}

      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className={styles.kanban} aria-label="Task board">
          {statusColumns.map((column) => (
            <KanbanColumn
              key={column.id}
              column={column}
              tasks={tasks.filter((task) => task.status === column.id)}
              openTaskForm={openTaskForm}
            />
          ))}
        </div>
      </DndContext>
    </>
  );
}
