"use client";

import { useState } from "react";
import styles from "../workspace.module.css";

type Task = {
  id: string;
  name: string;
  client: string;
  deadline: string;
  progress: number;
  doneBy: string;
};

type Role = "Senior" | "Manager" | "Junior";

type Person = {
  name: string;
  role: Role;
  department: string;
  workload: string;
  availability: string;
};

type TaskColumn = {
  title: Role;
  owner: string;
  tasks: Task[];
};

const people: Person[] = [
  {
    name: "Arber M.",
    role: "Manager",
    department: "Audit",
    workload: "78%",
    availability: "Available",
  },
  {
    name: "Besnik T.",
    role: "Manager",
    department: "Tax",
    workload: "64%",
    availability: "Available",
  },
  {
    name: "Dorian P.",
    role: "Senior",
    department: "Legal",
    workload: "86%",
    availability: "Overloaded",
  },
  {
    name: "Mira K.",
    role: "Senior",
    department: "Tax",
    workload: "91%",
    availability: "Waiting review",
  },
  {
    name: "Elira D.",
    role: "Junior",
    department: "Payroll",
    workload: "54%",
    availability: "Available",
  },
  {
    name: "Jon S.",
    role: "Junior",
    department: "Audit",
    workload: "42%",
    availability: "Available",
  },
];

const peopleByRole = people.reduce(
  (groups, person) => {
    groups[person.role].push(person);
    groups[person.role].sort((first, second) => first.name.localeCompare(second.name));
    return groups;
  },
  {
    Senior: [] as Person[],
    Manager: [] as Person[],
    Junior: [] as Person[],
  },
);

const initialColumns: TaskColumn[] = [
  {
    title: "Senior",
    owner: "Mira K.",
    tasks: [
      {
        id: "senior-audit",
        name: "Audit sampling - Balfin",
        client: "Balfin Group",
        deadline: "May 28",
        progress: 72,
        doneBy: "Mira K.",
      },
      {
        id: "senior-vat",
        name: "Review VAT return",
        client: "Tirana Retail",
        deadline: "May 30",
        progress: 45,
        doneBy: "Mira K.",
      },
    ],
  },
  {
    title: "Manager",
    owner: "Arber M.",
    tasks: [
      {
        id: "manager-payroll",
        name: "Approve payroll submission",
        client: "Vodafone Albania",
        deadline: "May 28",
        progress: 88,
        doneBy: "Arber M.",
      },
      {
        id: "manager-approvals",
        name: "Assign blocked approvals",
        client: "Albtelecom",
        deadline: "Jun 02",
        progress: 35,
        doneBy: "Arber M.",
      },
    ],
  },
  {
    title: "Junior",
    owner: "Elira D.",
    tasks: [
      {
        id: "junior-files",
        name: "Collect payroll files",
        client: "Vodafone Albania",
        deadline: "May 28",
        progress: 60,
        doneBy: "Elira D.",
      },
      {
        id: "junior-checklist",
        name: "Prepare tax checklist",
        client: "Tirana Retail",
        deadline: "Jun 03",
        progress: 25,
        doneBy: "Elira D.",
      },
    ],
  },
];

const emptyDraft = {
  job: "",
  deadline: "",
  assignee: "",
};

const roles: Role[] = ["Manager", "Senior", "Junior"];

export default function TasksPage() {
  const [columns, setColumns] = useState(initialColumns);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [openWorker, setOpenWorker] = useState<string | null>(null);
  const [draft, setDraft] = useState(emptyDraft);
  const selectedFormWorker = people.find((person) => person.name === draft.assignee);

  function openTaskForm() {
    const firstPerson = peopleByRole.Manager[0]?.name ?? "";

    setDraft({ ...emptyDraft, assignee: firstPerson });
    setIsFormOpen(true);
  }

  function closeTaskForm() {
    setIsFormOpen(false);
    setDraft(emptyDraft);
  }

  function getWorkerTasks(workerName: string) {
    return columns.flatMap((column) => column.tasks.filter((task) => task.doneBy === workerName));
  }

  function addTask() {
    const selectedPerson = people.find((person) => person.name === draft.assignee);
    const role = selectedPerson?.role;

    if (!role || !draft.job.trim()) {
      return;
    }

    const column = columns.find((item) => item.title === role);

    if (!column) {
      return;
    }

    const newTask: Task = {
      id: `${role}-${Date.now()}`,
      name: draft.job.trim(),
      client: "Internal work",
      deadline: draft.deadline.trim() || "No deadline",
      progress: 0,
      doneBy: selectedPerson.name,
    };

    setColumns((currentColumns) =>
      currentColumns.map((item) =>
        item.title === role
          ? {
              ...item,
              tasks: [newTask, ...item.tasks],
            }
          : item,
      ),
    );
    closeTaskForm();
  }

  return (
    <section className={styles.pageStack}>
      <div className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>Work tracking</p>
          <h2>Tasks</h2>
          <p>Create tasks by role and track progress by responsible teammate.</p>
        </div>
        <button className={styles.primaryButton} type="button" onClick={openTaskForm}>
          + New task
        </button>
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
                <p className={styles.eyebrow}>Assign work</p>
                <h3 id="new-task-title">New task</h3>
              </div>
              <button className={styles.textButton} type="button" onClick={closeTaskForm}>
                Close
              </button>
            </div>

            <div className={styles.workerGroups}>
              {roles.map((role) => (
                <section className={styles.workerGroup} key={role}>
                  <h4>{role}</h4>
                  {peopleByRole[role].map((person) => (
                    <button
                      className={`${styles.workerChoice} ${
                        draft.assignee === person.name ? styles.selectedAssignee : ""
                      }`}
                      key={person.name}
                      type="button"
                      onClick={() => {
                        setDraft({ ...draft, assignee: person.name });
                      }}
                    >
                      <strong>{person.name}</strong>
                      <span>{person.department} - {person.workload}</span>
                      <small>{person.availability}</small>
                    </button>
                  ))}
                </section>
              ))}
            </div>

            {selectedFormWorker ? (
              <div className={styles.personPreview}>
                <strong>{selectedFormWorker.name}</strong>
                <span>{selectedFormWorker.role} - {selectedFormWorker.department}</span>
                <span>Workload: {selectedFormWorker.workload}</span>
                <span>{selectedFormWorker.availability}</span>
              </div>
            ) : null}

            <label>
              Job
              <textarea
                placeholder="Describe the job"
                value={draft.job}
                onChange={(event) => setDraft({ ...draft, job: event.target.value })}
                required
              />
            </label>

            <label>
              Deadline
              <input
                aria-label="Deadline"
                type="date"
                value={draft.deadline}
                onChange={(event) => setDraft({ ...draft, deadline: event.target.value })}
              />
            </label>

            <div className={styles.cardActions}>
              <button type="submit">Add task</button>
              <button type="button" onClick={closeTaskForm}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      ) : null}

      <div className={styles.kanban}>
        {columns.map((column) => (
          <section className={styles.kanbanColumn} key={column.title}>
            <div className={styles.columnHeader}>
              <div>
                <h3>{column.title}</h3>
                <span>{column.owner}</span>
              </div>
            </div>

            {peopleByRole[column.title].map((person) => {
              const workerTasks = getWorkerTasks(person.name);
              const isOpen = openWorker === person.name;

              return (
                <article className={styles.workerTaskCard} key={person.name}>
                <button
                  className={styles.workerDropdownButton}
                  type="button"
                    onClick={() => setOpenWorker(isOpen ? null : person.name)}
                    aria-expanded={isOpen}
                >
                    <span>{person.name}</span>
                    <small>{workerTasks.length} works</small>
                </button>

                  {isOpen ? (
                    <div className={styles.workerDropdown}>
                      {workerTasks.map((task) => (
                        <div className={styles.workerDropdownItem} key={task.id}>
                          <strong>{task.name}</strong>
                          <span>Deadline: {task.deadline}</span>
                          <div
                            className={styles.progressTrack}
                            aria-label={`${task.progress}% complete`}
                          >
                            <span style={{ width: `${task.progress}%` }} />
                          </div>
                          <span>{task.progress}% complete</span>
                        </div>
                      ))}
                      {workerTasks.length === 0 ? <span>No active work.</span> : null}
                    </div>
                  ) : null}
              </article>
              );
            })}
          </section>
        ))}
      </div>
    </section>
  );
}
