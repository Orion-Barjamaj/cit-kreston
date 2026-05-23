"use client";

import { useActionState, useEffect, useRef } from "react";
import { createClient, type CreateClientState } from "./actions";
import styles from "./clients.module.css";

const initialState: CreateClientState = {
  message: "",
  status: "idle",
};

export type ClientManagerOption = {
  id: number;
  name: string;
  role: string;
};

export default function AddClientForm({
  isConfigured,
  managers,
}: {
  isConfigured: boolean;
  managers: ClientManagerOption[];
}) {
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
          Manager
          <select name="assigned_manager_id" defaultValue="" disabled={!isConfigured || isPending}>
            <option value="">Unassigned</option>
            {managers.map((manager) => (
              <option key={manager.id} value={manager.id}>
                {manager.name} - {manager.role.charAt(0).toUpperCase() + manager.role.slice(1)}
              </option>
            ))}
          </select>
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
