"use client";

import { useActionState, useEffect, useRef } from "react";
import { createClientTask, type CreateTaskState } from "./actions";
import styles from "./clients.module.css";

export type TaskAssignee = {
  id: number;
  name: string;
  role: string;
};

const initialState: CreateTaskState = {
  message: "",
  status: "idle",
};

function formatRole(role: string) {
  return role.charAt(0).toUpperCase() + role.slice(1);
}

export default function AddTaskForm({
  assignees,
  clientId,
}: {
  assignees: TaskAssignee[];
  clientId: number;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, isPending] = useActionState(createClientTask, initialState);
  const actionStatus = state.status;

  useEffect(() => {
    if (actionStatus === "success") {
      formRef.current?.reset();
    }
  }, [actionStatus]);

  return (
    <form className={styles.addTaskForm} action={formAction} ref={formRef}>
      <input name="client_id" type="hidden" value={clientId} />
      <div className={styles.taskFormGrid}>
        <label>
          Task title
          <input name="title" placeholder="Review monthly documents" required disabled={isPending} />
        </label>
        <label>
          Deadline
          <input name="deadline" type="date" disabled={isPending} />
        </label>
        <label>
          Assigned team member
          <select name="assigned_to" required disabled={isPending || assignees.length === 0}>
            <option value="">Choose a person</option>
            {assignees.map((assignee) => (
              <option key={assignee.id} value={assignee.id}>
                {assignee.name} - {formatRole(assignee.role)}
              </option>
            ))}
          </select>
        </label>
        <label>
          Priority
          <select name="priority" defaultValue="medium" disabled={isPending}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </label>
      </div>
      <label>
        Description
        <textarea name="description" placeholder="Add context for the task" disabled={isPending} />
      </label>
      <div className={styles.addClientActions}>
        <button className={styles.primaryButton} type="submit" disabled={isPending}>
          {isPending ? "Adding..." : "+ Add task"}
        </button>
        {state.message ? (
          <p className={state.status === "error" ? styles.formError : styles.formSuccess}>{state.message}</p>
        ) : null}
      </div>
    </form>
  );
}
