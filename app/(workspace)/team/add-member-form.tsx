"use client";

import { useActionState, useEffect, useRef } from "react";
import { addTeamMember, type AddTeamMemberState } from "./actions";
import styles from "./team.module.css";

type DepartmentOption = {
  id: number;
  name: string;
};

type AddMemberFormProps = {
  departments: DepartmentOption[];
  isConfigured: boolean;
  roles: string[];
};

const initialState: AddTeamMemberState = {
  message: "",
  status: "idle",
};

export default function AddMemberForm({ departments, isConfigured, roles }: AddMemberFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, isPending] = useActionState(addTeamMember, initialState);

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
    }
  }, [state.status]);

  return (
    <form action={action} className={styles.addMemberForm} ref={formRef}>
      <label>
        Name
        <input name="name" placeholder="Sara Berisha" required disabled={!isConfigured || isPending} />
      </label>
      <label>
        Email
        <input name="email" placeholder="sara@company.com" required type="email" disabled={!isConfigured || isPending} />
      </label>
      <label>
        Role
        <select name="role" defaultValue="Manager" disabled={!isConfigured || isPending}>
          {roles.map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </select>
      </label>
      <label>
        Department
        <select name="department_id" required disabled={!isConfigured || isPending || departments.length === 0}>
          {departments.map((department) => (
            <option key={department.id} value={department.id}>
              {department.name}
            </option>
          ))}
        </select>
      </label>
      <button className={styles.primaryButton} type="submit" disabled={!isConfigured || isPending || departments.length === 0}>
        {isPending ? "Adding..." : "Add Member"}
      </button>
      {state.message ? (
        <p className={state.status === "error" ? styles.formError : styles.formSuccess}>{state.message}</p>
      ) : null}
    </form>
  );
}
