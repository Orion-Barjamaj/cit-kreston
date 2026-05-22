"use client";

import { useActionState, useEffect, useRef } from "react";
import { createClient, type CreateClientState } from "./actions";
import styles from "./clients.module.css";

const initialState: CreateClientState = {
  message: "",
  status: "idle",
};

export default function AddClientForm({ isConfigured }: { isConfigured: boolean }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, isPending] = useActionState(createClient, initialState);
  const actionStatus = state.status;

  useEffect(() => {
    if (actionStatus === "success") {
      formRef.current?.reset();
    }
  }, [actionStatus]);

  return (
    <form className={styles.addClientForm} action={formAction} ref={formRef}>
      <div>
        <label>
          Client name
          <input name="name" placeholder="Acme Albania" required disabled={!isConfigured || isPending} />
        </label>
        <label>
          Industry
          <input name="industry" placeholder="Audit, Payroll, Tax..." disabled={!isConfigured || isPending} />
        </label>
        <label>
          Status
          <select name="status" defaultValue="active" disabled={!isConfigured || isPending}>
            <option value="active">Active</option>
            <option value="delayed">Delayed</option>
            <option value="onboarding">Onboarding</option>
            <option value="completed">Completed</option>
          </select>
        </label>
        <label>
          Manager ID
          <input
            min="1"
            name="assigned_manager_id"
            placeholder="Optional"
            type="number"
            disabled={!isConfigured || isPending}
          />
        </label>
      </div>

      <div className={styles.addClientActions}>
        <button className={styles.primaryButton} type="submit" disabled={!isConfigured || isPending}>
          {isPending ? "Adding..." : "+ Add client"}
        </button>
      </div>
    </form>
  );
}
