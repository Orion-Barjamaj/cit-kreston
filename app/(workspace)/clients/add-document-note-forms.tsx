"use client";

import { useActionState, useEffect, useRef } from "react";
import { useState } from "react";
import {
  createClientDocument,
  createClientTimelineNote,
  type CreateDocumentState,
  type CreateTimelineNoteState,
} from "./actions";
import styles from "./clients.module.css";

const initialDocumentState: CreateDocumentState = {
  message: "",
  status: "idle",
};

const initialTimelineNoteState: CreateTimelineNoteState = {
  message: "",
  status: "idle",
};

export function AddDocumentForm({ clientId }: { clientId: number }) {
  const documentFormRef = useRef<HTMLFormElement>(null);
  const [selectedFileName, setSelectedFileName] = useState("");
  const [documentState, documentAction, isDocumentPending] = useActionState(
    createClientDocument,
    initialDocumentState,
  );

  useEffect(() => {
    if (documentState.status === "success") {
      documentFormRef.current?.reset();
    }
  }, [documentState.status]);

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
    </div>
  );
}

export function AddTimelineNoteForm({ clientId }: { clientId: number }) {
  const timelineFormRef = useRef<HTMLFormElement>(null);
  const [timelineNoteState, timelineNoteAction, isTimelineNotePending] = useActionState(
    createClientTimelineNote,
    initialTimelineNoteState,
  );

  useEffect(() => {
    if (timelineNoteState.status === "success") {
      timelineFormRef.current?.reset();
    }
  }, [timelineNoteState.status]);

  return (
    <div className={styles.documentNoteForms}>
      <details className={styles.inlineFormPanel}>
        <summary>+ Add timeline note</summary>
        <form action={timelineNoteAction} ref={timelineFormRef}>
          <input name="client_id" type="hidden" value={clientId} />
          <div className={styles.timelineNoteGrid}>
            <label>
              Timeline note
              <textarea name="text" placeholder="Add a client timeline note" required disabled={isTimelineNotePending} />
            </label>
          </div>
          <div className={styles.addClientActions}>
            <button className={styles.primaryButton} type="submit" disabled={isTimelineNotePending}>
              {isTimelineNotePending ? "Adding..." : "Add note"}
            </button>
            {timelineNoteState.message ? (
              <p className={timelineNoteState.status === "error" ? styles.formError : styles.formSuccess}>
                {timelineNoteState.message}
              </p>
            ) : null}
          </div>
        </form>
      </details>
    </div>
  );
}
