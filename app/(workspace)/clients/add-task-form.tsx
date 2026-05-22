"use client";

import { useActionState, useEffect, useRef } from "react";
import { createClientTask, type CreateTaskState } from "./actions";
import styles from "./clients.module.css";

const initialState: CreateTaskState = {
  message: "",
  status: "idle",
};

export default function AddTaskForm({ clientId }: { clientId: number }) {
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
          Status
          <select name="status" defaultValue="todo" disabled={isPending}>
            <option value="todo">To do</option>
            <option value="progress">Progress</option>
            <option value="review">Review</option>
            <option value="done">Done</option>
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
        <label>
          Assigned user ID
          <input min="1" name="assigned_to" placeholder="Optional" type="number" disabled={isPending} />
        </label>
        <label>
          Department ID
          <input min="1" name="department_id" placeholder="Optional" type="number" disabled={isPending} />
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
