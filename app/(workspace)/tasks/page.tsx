"use client";

import { useState } from "react";
import styles from "./tasks.module.css";

type TaskStatus = "juniors" | "seniors" | "managers" | "todo";

type Task = {
  id: string;
  title: string;
  category: string;
  assignee: string;
  deadline: string;
  estimate: string;
  logged: string;
  comments: number;
  status: TaskStatus;
};

type TaskDraft = Omit<Task, "id" | "logged" | "comments">;

const statusColumns: { id: TaskStatus; title: string }[] = [
  { id: "juniors", title: "Juniors" },
  { id: "seniors", title: "Seniors" },
  { id: "managers", title: "Managers" },
];

const emptyDraft: TaskDraft = {
  title: "",
  category: "",
  assignee: "",
  deadline: "",
  estimate: "",
  status: "todo",
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [draft, setDraft] = useState(emptyDraft);

  function openTaskForm(status: TaskStatus = "todo") {
    setDraft({ ...emptyDraft, status });
    setIsFormOpen(true);
  }

  function closeTaskForm() {
    setIsFormOpen(false);
    setDraft(emptyDraft);
  }

  function addTask() {
    if (!draft.title.trim()) {
      return;
    }

    const newTask: Task = {
      id: `${draft.status}-${Date.now()}`,
      title: draft.title.trim(),
      category: draft.category.trim() || "General",
      assignee: draft.assignee.trim() || "Unassigned",
      deadline: draft.deadline.trim() || "No date",
      estimate: draft.estimate.trim() || "1h",
      logged: "0h",
      comments: 0,
      status: draft.status,
    };

    setTasks((currentTasks) => [newTask, ...currentTasks]);
    closeTaskForm();
  }

  return (
    <section className={styles.pageStack}>
      <div className={styles.boardHeader}>
        <div>
          <p className={styles.eyebrow}>Workspace</p>
          <h2>Tasks</h2>
        </div>
        <button className={styles.darkButton} type="button" onClick={() => openTaskForm()}>
          Add Task
        </button>
      </div>

      <div className={styles.boardToolbar} aria-label="Board tools">
        <div className={styles.viewTabs}>
          <button className={styles.activeTab} type="button">
            Board
          </button>
          <button type="button">List</button>
          <button type="button">Table</button>
        </div>
        <div className={styles.boardActions}>
          <button type="button">Share</button>
          <button type="button">Filters</button>
          <button type="button">Group by: Status</button>
        </div>
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
              <button className={styles.textButton} type="button" onClick={closeTaskForm}>
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
                />
              </label>
              <label>
                Category
                <input
                  placeholder="Audit"
                  value={draft.category}
                  onChange={(event) => setDraft({ ...draft, category: event.target.value })}
                />
              </label>
              <label>
                Assignee
                <input
                  placeholder="Arber M."
                  value={draft.assignee}
                  onChange={(event) => setDraft({ ...draft, assignee: event.target.value })}
                />
              </label>
              <label>
                Deadline
                <input
                  placeholder="Aug 29"
                  value={draft.deadline}
                  onChange={(event) => setDraft({ ...draft, deadline: event.target.value })}
                />
              </label>
              <label>
                Estimate
                <input
                  placeholder="3h"
                  value={draft.estimate}
                  onChange={(event) => setDraft({ ...draft, estimate: event.target.value })}
                />
              </label>
              <label>
                Status
                <select
                  value={draft.status}
                  onChange={(event) => setDraft({ ...draft, status: event.target.value as TaskStatus })}
                >
                  {statusColumns.map((column) => (
                    <option key={column.id} value={column.id}>
                      {column.title}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className={styles.cardActions}>
              <button type="submit">Create Task</button>
              <button type="button" onClick={closeTaskForm}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      ) : null}

      <div className={styles.kanban} aria-label="Task board">
        {statusColumns.map((column) => {
          const columnTasks = tasks.filter((task) => task.status === column.id);

          return (
            <section className={styles.kanbanColumn} key={column.id}>
              <header className={styles.columnHeader}>
                <div>
                  <h3>{column.title}</h3>
                  <span>{columnTasks.length}</span>
                </div>
                <button type="button" onClick={() => openTaskForm(column.id)} aria-label={`Add ${column.title} task`}>
                  +
                </button>
              </header>

              <div className={styles.columnBody}>
                {columnTasks.length > 0 ? (
                  columnTasks.map((task) => (
                    <article className={styles.taskCard} key={task.id}>
                      <div className={styles.taskCardTop}>
                        <span className={styles.categoryTag}>{task.category}</span>
                        <span className={styles.avatar}>{getInitials(task.assignee)}</span>
                      </div>
                      <h4>{task.title}</h4>
                      <div className={styles.taskMeta}>
                        <span>{task.deadline}</span>
                        <span>{task.estimate}</span>
                      </div>
                      <div className={styles.taskFooter}>
                        <span>Log: {task.logged}</span>
                        <small>{task.comments}</small>
                      </div>
                    </article>
                  ))
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
        })}
      </div>
    </section>
  );
}
