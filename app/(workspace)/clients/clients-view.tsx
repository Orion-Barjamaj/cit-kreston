"use client";

import { useMemo, useState } from "react";
import styles from "../workspace.module.css";
import type { ClientRecord } from "@/app/lib/supabase";

type ClientsViewProps = {
  clients: ClientRecord[];
  error?: string;
  isConfigured: boolean;
};

const dateFormatter = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "2-digit",
  year: "numeric",
});

function formatDate(value: string | null) {
  if (!value) {
    return "Not recorded";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not recorded";
  }

  return dateFormatter.format(date);
}

function formatField(value: string | number | null) {
  if (value === null || value === "") {
    return "Not assigned";
  }

  return value;
}

export default function ClientsView({ clients, error, isConfigured }: ClientsViewProps) {
  const [selectedClientId, setSelectedClientId] = useState(clients[0]?.id ?? null);

  const selectedClient = useMemo(
    () => clients.find((client) => client.id === selectedClientId) ?? clients[0] ?? null,
    [clients, selectedClientId],
  );

  return (
    <>
      {!isConfigured ? (
        <div className={styles.noticeBox}>
          Add your Supabase URL and anon key to <code>.env</code> to load clients from the database.
        </div>
      ) : null}

      {error ? <div className={styles.errorBox}>{error}</div> : null}

      <input className={styles.fullSearch} type="search" placeholder="Search clients" />

      <div className={styles.tableWrap}>
        <table className={styles.dataTable}>
          <thead>
            <tr>
              <th>Client</th>
              <th>Industry</th>
              <th>Status</th>
              <th>Manager ID</th>
              <th>Created</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {clients.length > 0 ? (
              clients.map((client) => {
                const isSelected = client.id === selectedClient?.id;

                return (
                  <tr className={isSelected ? styles.selectedRow : undefined} key={client.id}>
                    <td>{client.name}</td>
                    <td>{formatField(client.industry)}</td>
                    <td>
                      <span className={styles.statusTag}>{client.status ?? "active"}</span>
                    </td>
                    <td>{formatField(client.assigned_manager_id)}</td>
                    <td>{formatDate(client.created_at)}</td>
                    <td>
                      <button
                        className={styles.textButton}
                        type="button"
                        onClick={() => setSelectedClientId(client.id)}
                      >
                        Open file
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={6}>No clients found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <article className={styles.panel}>
        <div className={styles.clientFileHeader}>
          <div>
            <p className={styles.eyebrow}>Client file</p>
            <h3>{selectedClient?.name ?? "Select a client"}</h3>
          </div>
          {selectedClient ? <span className={styles.statusTag}>{selectedClient.status ?? "active"}</span> : null}
        </div>

        {selectedClient ? (
          <dl className={styles.detailGrid}>
            <div>
              <dt>Industry</dt>
              <dd>{formatField(selectedClient.industry)}</dd>
            </div>
            <div>
              <dt>Assigned manager ID</dt>
              <dd>{formatField(selectedClient.assigned_manager_id)}</dd>
            </div>
            <div>
              <dt>Created</dt>
              <dd>{formatDate(selectedClient.created_at)}</dd>
            </div>
            <div>
              <dt>Client ID</dt>
              <dd>{selectedClient.id}</dd>
            </div>
          </dl>
        ) : (
          <p>Choose a client from the table to open its file.</p>
        )}
      </article>
    </>
  );
}
