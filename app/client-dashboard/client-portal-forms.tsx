"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import {
  sendClientPortalQuestion,
  uploadClientPortalDocument,
  type ClientPortalActionState,
} from "./actions";
import styles from "./client-dashboard.module.css";

const initialState: ClientPortalActionState = {
  message: "",
  status: "idle",
};

export function ClientUploadForm({ clientId }: { clientId: number }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [selectedFileName, setSelectedFileName] = useState("");
  const [state, action, isPending] = useActionState(uploadClientPortalDocument, initialState);

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
    }
  }, [state.status]);

  return (
    <form action={action} className={styles.clientForm} ref={formRef}>
      <input name="client_id" type="hidden" value={clientId} />
      <label className={styles.filePicker}>
        <input
          disabled={isPending}
          name="file"
          onChange={(event) => setSelectedFileName(event.target.files?.[0]?.name ?? "")}
          required
          type="file"
        />
        <span>{selectedFileName && state.status !== "success" ? "File chosen" : "Choose file"}</span>
        <small>{selectedFileName && state.status !== "success" ? selectedFileName : "Upload a document requested by the team"}</small>
      </label>
      <label>
        Message for the team
        <textarea disabled={isPending} name="note" placeholder="Add context for this file" />
      </label>
      <button type="submit" disabled={isPending}>
        {isPending ? "Sending..." : "Send file"}
      </button>
      {state.message ? <p className={state.status === "error" ? styles.formError : styles.formSuccess}>{state.message}</p> : null}
    </form>
  );
}

export function ClientQuestionForm({ clientId }: { clientId: number }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, isPending] = useActionState(sendClientPortalQuestion, initialState);

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
    }
  }, [state.status]);

  return (
    <form action={action} className={styles.clientForm} ref={formRef}>
      <input name="client_id" type="hidden" value={clientId} />
      <label>
        Question or follow-up note
        <textarea disabled={isPending} name="text" placeholder="Ask a question or send an update" required />
      </label>
      <button type="submit" disabled={isPending}>
        {isPending ? "Sending..." : "Send note"}
      </button>
      {state.message ? <p className={state.status === "error" ? styles.formError : styles.formSuccess}>{state.message}</p> : null}
    </form>
  );
}
