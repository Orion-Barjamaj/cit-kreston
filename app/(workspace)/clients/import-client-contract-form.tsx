"use client";

import { useActionState, useEffect, useRef } from "react";
import { createClientFromContract, type CreateDocumentState } from "./actions";
import styles from "./clients.module.css";

const initialState: CreateDocumentState = {
  message: "",
  status: "idle",
};

export default function ImportClientContractForm({
  isConfigured,
}: {
  isConfigured: boolean;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, isPending] = useActionState(
    createClientFromContract,
    initialState,
  );

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
    }
  }, [state.status]);

  return (
    <form className={styles.importClientForm} action={formAction} ref={formRef}>
      <label className={styles.filePicker}>
        <input
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          disabled={!isConfigured || isPending}
          name="file"
          required
          type="file"
        />
        <span>Drop PDF or DOCX</span>
        <small>Create a client automatically from a contract</small>
      </label>

      <div className={styles.importClientActions}>
        <button
          className={styles.secondaryButton}
          disabled={!isConfigured || isPending}
          type="submit"
        >
          {isPending ? "Extracting..." : "Create from document"}
        </button>
        {state.message ? (
          <p className={state.status === "error" ? styles.formError : styles.formSuccess}>
            {state.message}
          </p>
        ) : null}
      </div>
    </form>
  );
}
