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
import type { TaskDepartmentOption, TaskMemberOption } from "./page";
import styles from "./tasks.module.css";

type BoardTask = {
  assignedTo: number | null;
  departmentId: number | null;
  departmentName: string;
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
};

type HandoffDraft = {
  assignedTo: string;
  nextStatus: TaskStatus;
  taskId: number;
};

type TasksBoardProps = {
  departments: TaskDepartmentOption[];
  error?: string;
  initialTasks: TaskRecord[];
  isConfigured: boolean;
  members: TaskMemberOption[];
};

type DepartmentTab = {
  id: string;
  label: string;
  departmentId: number | "all";
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

function getMemberLabel(member: TaskMemberOption) {
  return `${member.name} - ${member.role.charAt(0).toUpperCase() + member.role.slice(1)}`;
}

function getStatusFromRole(role: string): TaskStatus {
  const normalizedRole = role.toLowerCase();

  if (normalizedRole === "senior") {
    return "seniors";
  }

  if (normalizedRole === "manager" || normalizedRole === "partner") {
    return "managers";
  }

  return "juniors";
}

function getMembersForStatus(members: TaskMemberOption[], status: TaskStatus) {
  return members.filter((member) => getStatusFromRole(member.role) === status);
}

function getDepartmentTabs(departments: TaskDepartmentOption[]): DepartmentTab[] {
  return [
    { departmentId: "all", id: "all", label: "All" },
    ...departments.map((department) => ({
      departmentId: department.id,
      id: String(department.id),
      label: department.name,
    })),
  ];
}

function getPriorityClassName(priority: string) {
  const normalizedPriority = priority.toLowerCase();

  if (normalizedPriority === "high") {
    return `${styles.categoryTag} ${styles.priorityHigh}`;
  }

  if (normalizedPriority === "low") {
    return `${styles.categoryTag} ${styles.priorityLow}`;
  }

  return `${styles.categoryTag} ${styles.priorityMedium}`;
}

function mapTaskRecord(
  task: TaskRecord,
  membersById: Map<number, TaskMemberOption>,
  departmentsById: Map<number, TaskDepartmentOption>,
): BoardTask {
  const assignedMember = task.assigned_to ? membersById.get(task.assigned_to) : null;
  const assignee = assignedMember ? assignedMember.name : "Unassigned";

  return {
    assignedTo: task.assigned_to,
    departmentId: task.department_id,
    departmentName: task.department_id ? departmentsById.get(task.department_id)?.name ?? "Unassigned department" : "Unassigned department",
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
      <div className={styles.taskCardSwing}>
        <div className={styles.taskCardTop}>
          <span className={getPriorityClassName(task.priority)}>{task.priority}</span>
          <span className={styles.avatar}>{getInitials(task.assignee)}</span>
        </div>
        <h4>{task.title}</h4>
        <p className={styles.taskDescription}>{task.description}</p>
        <div className={styles.taskMeta}>
          <span>{task.deadline}</span>
          <span>{task.departmentName}</span>
          <strong>{task.assignee}</strong>
        </div>
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
  openTaskForm: () => void;
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
        <button type="button" onClick={openTaskForm} aria-label={`Add ${column.title} task`}>
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
            <button type="button" onClick={openTaskForm}>
              Create Task
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

export default function TasksBoard({ departments, error, initialTasks, isConfigured, members }: TasksBoardProps) {
  const membersById = new Map(members.map((member) => [member.id, member]));
  const departmentsById = new Map(departments.map((department) => [department.id, department]));
  const [tasks, setTasks] = useState<BoardTask[]>(() =>
    initialTasks.map((task) => mapTaskRecord(task, membersById, departmentsById)),
  );
  const [selectedDepartmentTab, setSelectedDepartmentTab] = useState("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [handoffDraft, setHandoffDraft] = useState<HandoffDraft | null>(null);
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
  const departmentTabs = getDepartmentTabs(departments);
  const selectedDepartment = departmentTabs.find((tab) => tab.id === selectedDepartmentTab) ?? departmentTabs[0];
  const selectedDepartmentId = selectedDepartment.departmentId;
  const filteredTasks =
    selectedDepartmentId === "all" ? tasks : tasks.filter((task) => task.departmentId === selectedDepartmentId);

  function openTaskForm() {
    const defaultDepartmentId = selectedDepartmentId !== "all" && selectedDepartmentId !== undefined ? String(selectedDepartmentId) : "";
    setDraft({ ...emptyDraft, departmentId: defaultDepartmentId });
    setMessage("");
    setIsFormOpen(true);
  }

  function closeTaskForm() {
    setIsFormOpen(false);
    setDraft(emptyDraft);
  }

  function closeHandoffForm() {
    setHandoffDraft(null);
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
        setTasks((currentTasks) => [mapTaskRecord(createdTask, membersById, departmentsById), ...currentTasks]);
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
    const task = tasks.find((currentTask) => currentTask.id === taskId);

    if (!Number.isInteger(taskId) || !validStatuses.has(nextStatus)) {
      return;
    }

    if (!task || task.status === nextStatus) {
      return;
    }

    setMessage("");
    setHandoffDraft({
      assignedTo: "",
      nextStatus,
      taskId,
    });
  }

  function submitHandoff() {
    if (!handoffDraft) {
      return;
    }

    const assignedTo = Number(handoffDraft.assignedTo);
    const assignedMember = membersById.get(assignedTo);
    const previousTasks = tasks;

    if (!assignedMember || getStatusFromRole(assignedMember.role) !== handoffDraft.nextStatus) {
      setMessage("Choose a team member from the selected category.");
      return;
    }

    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.id === handoffDraft.taskId
          ? {
              ...task,
              assignedTo,
              assignee: assignedMember.name,
              status: handoffDraft.nextStatus,
            }
          : task,
      ),
    );
    closeHandoffForm();
    startTransition(async () => {
      const result = await updateTaskStatus(handoffDraft.taskId, handoffDraft.nextStatus, assignedTo);

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

      <div className={styles.departmentTabs} aria-label="Filter tasks by department" role="tablist">
        {departmentTabs.map((tab) => {
          const isActive = selectedDepartmentTab === tab.id;

          return (
            <button
              aria-selected={isActive}
              className={isActive ? styles.activeDepartmentTab : ""}
              key={tab.id}
              onClick={() => setSelectedDepartmentTab(tab.id)}
              role="tab"
              type="button"
            >
              {tab.label}
            </button>
          );
        })}
      </div>

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
	                Department
	                <select
	                  value={draft.departmentId}
	                  onChange={(event) => setDraft({ ...draft, assignedTo: "", departmentId: event.target.value })}
	                  required
	                  disabled={isPending || departments.length === 0}
	                >
	                  <option value="">Choose a department</option>
	                  {departments.map((department) => (
	                    <option key={department.id} value={department.id}>
	                      {department.name}
	                    </option>
	                  ))}
	                </select>
	              </label>
	              <label>
	                Assigned team member
	                <select
	                  value={draft.assignedTo}
	                  onChange={(event) => setDraft({ ...draft, assignedTo: event.target.value })}
	                  required
	                  disabled={isPending}
	                >
	                  <option value="">Choose a person</option>
	                  {members.map((member) => (
	                    <option key={member.id} value={member.id}>
	                      {getMemberLabel(member)}
	                    </option>
	                  ))}
	                </select>
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

      {handoffDraft ? (
        <div className={styles.modalLayer} role="dialog" aria-modal="true" aria-labelledby="handoff-title">
          <form
            className={styles.handoffModal}
            onSubmit={(event) => {
              event.preventDefault();
              submitHandoff();
            }}
          >
            <div className={styles.modalHeader}>
              <div>
                <p className={styles.eyebrow}>Task handoff</p>
                <h3 id="handoff-title">
                  Move to {statusColumns.find((column) => column.id === handoffDraft.nextStatus)?.title}
                </h3>
              </div>
            </div>

            <label>
              Assigned team member
              <select
                value={handoffDraft.assignedTo}
                onChange={(event) =>
                  setHandoffDraft({
                    ...handoffDraft,
                    assignedTo: event.target.value,
                  })
                }
                required
                disabled={isPending}
              >
                <option value="">Choose a person</option>
                {getMembersForStatus(members, handoffDraft.nextStatus).map((member) => (
                  <option key={member.id} value={member.id}>
                    {getMemberLabel(member)}
                  </option>
                ))}
              </select>
            </label>

            {getMembersForStatus(members, handoffDraft.nextStatus).length === 0 ? (
              <p className={styles.formHint}>No team members are available in this category.</p>
            ) : null}

            <div className={styles.cardActions}>
              <button
                type="submit"
                disabled={
                  isPending ||
                  getMembersForStatus(members, handoffDraft.nextStatus).length === 0
                }
              >
                {isPending ? "Moving..." : "Move task"}
              </button>
              <button type="button" onClick={closeHandoffForm} disabled={isPending}>
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
              tasks={filteredTasks.filter((task) => task.status === column.id)}
              openTaskForm={openTaskForm}
            />
          ))}
        </div>
      </DndContext>
    </>
  );
}
