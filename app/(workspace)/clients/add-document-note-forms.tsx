"use client";

import { useActionState, useEffect, useRef } from "react";
import { useState } from "react";
import {
  createClientActivity,
  createClientDocument,
  type CreateActivityState,
  type CreateDocumentState,
} from "./actions";
import styles from "./clients.module.css";

const initialDocumentState: CreateDocumentState = {
  message: "",
  status: "idle",
};

const initialActivityState: CreateActivityState = {
  message: "",
  status: "idle",
};

export default function AddDocumentNoteForms({ clientId }: { clientId: number }) {
  const documentFormRef = useRef<HTMLFormElement>(null);
  const activityFormRef = useRef<HTMLFormElement>(null);
  const [selectedFileName, setSelectedFileName] = useState("");
  const [documentState, documentAction, isDocumentPending] = useActionState(
    createClientDocument,
    initialDocumentState,
  );
  const [activityState, activityAction, isActivityPending] = useActionState(
    createClientActivity,
    initialActivityState,
  );

  useEffect(() => {
    if (documentState.status === "success") {
      documentFormRef.current?.reset();
    }
  }, [documentState.status]);

  useEffect(() => {
    if (activityState.status === "success") {
      activityFormRef.current?.reset();
    }
  }, [activityState.status]);

  return (
    <div className={styles.documentNoteForms}>
      <details className={styles.inlineFormPanel}>
        <summary>+ Add document</summary>
        <form action={documentAction} ref={documentFormRef}>
          <input name="client_id" type="hidden" value={clientId} />
          <div className={styles.documentFormGrid}>
            <label className={styles.filePicker}>
              <input
                name="file"
                required
                type="file"
                disabled={isDocumentPending}
                onChange={(event) => {
                  setSelectedFileName(event.target.files?.[0]?.name ?? "");
                }}
              />
              <span>{selectedFileName && documentState.status !== "success" ? "File chosen" : "Choose file"}</span>
              {selectedFileName && documentState.status !== "success" ? (
                <small>{selectedFileName}</small>
              ) : (
                <small>Select a document from your computer</small>
              )}
            </label>
            <label className={styles.documentTypeField}>
              Type
              <select name="type" defaultValue="report" disabled={isDocumentPending}>
                <option value="contract">Contract</option>
                <option value="payroll">Payroll</option>
                <option value="audit">Audit</option>
                <option value="tax">Tax</option>
                <option value="report">Report</option>
              </select>
            </label>
          </div>
          <div className={`${styles.addClientActions} ${styles.documentSubmitActions}`}>
            <button className={styles.primaryButton} type="submit" disabled={isDocumentPending}>
              {isDocumentPending ? "Adding..." : "Add document"}
            </button>
            {documentState.message ? (
              <p className={documentState.status === "error" ? styles.formError : styles.formSuccess}>
                {documentState.message}
              </p>
            ) : null}
          </div>
        </form>
      </details>

      <details className={styles.inlineFormPanel}>
        <summary>+ Add note</summary>
        <form action={activityAction} ref={activityFormRef}>
          <input name="client_id" type="hidden" value={clientId} />
          <div className={styles.noteFormGrid}>
            <label>
              Note
              <textarea name="content" placeholder="Add client activity or note" required disabled={isActivityPending} />
            </label>
            <label>
              Type
              <select name="type" defaultValue="comment" disabled={isActivityPending}>
                <option value="comment">Comment</option>
                <option value="meeting">Meeting</option>
                <option value="update">Update</option>
                <option value="alert">Alert</option>
              </select>
            </label>
          </div>
          <div className={styles.addClientActions}>
            <button className={styles.primaryButton} type="submit" disabled={isActivityPending}>
              {isActivityPending ? "Adding..." : "Add note"}
            </button>
            {activityState.message ? (
              <p className={activityState.status === "error" ? styles.formError : styles.formSuccess}>
                {activityState.message}
              </p>
            ) : null}
          </div>
        </form>
      </details>
    </div>
  );
}
