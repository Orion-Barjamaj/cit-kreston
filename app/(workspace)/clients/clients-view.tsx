"use client";

import Link from "next/link";
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

function getSearchText(client: ClientRecord) {
  return [
    client.name,
    client.industry,
    client.status ?? "active",
    client.assigned_manager_id,
    client.created_at,
  ]
    .filter((value) => value !== null && value !== undefined)
    .join(" ")
    .toLowerCase();
}

export default function ClientsView({ clients, error, isConfigured }: ClientsViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const normalizedSearchTerm = searchTerm.trim().toLowerCase();
  const filteredClients = useMemo(() => {
    if (!normalizedSearchTerm) {
      return clients;
    }

    return clients.filter((client) => getSearchText(client).includes(normalizedSearchTerm));
  }, [clients, normalizedSearchTerm]);

  return (
    <>
      {!isConfigured ? (
        <div className={styles.noticeBox}>
          Add your Supabase URL and anon key to <code>.env</code> to load clients from the database.
        </div>
      ) : null}

      {error ? <div className={styles.errorBox}>{error}</div> : null}

      <input
        aria-label="Search clients"
        className={styles.fullSearch}
        onChange={(event) => setSearchTerm(event.target.value)}
        placeholder="Search clients"
        type="search"
        value={searchTerm}
      />

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
            {filteredClients.length > 0 ? (
              filteredClients.map((client) => (
                <tr key={client.id}>
                  <td>
                    <Link className={styles.tableLink} href={`/clients/${client.id}`}>
                      {client.name}
                    </Link>
                  </td>
                  <td>{formatField(client.industry)}</td>
                  <td>
                    <span className={styles.statusTag}>{client.status ?? "active"}</span>
                  </td>
                  <td>{formatField(client.assigned_manager_id)}</td>
                  <td>{formatDate(client.created_at)}</td>
                  <td>
                    <Link className={styles.textButton} href={`/clients/${client.id}`}>
                      Open file
                    </Link>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6}>
                  {normalizedSearchTerm ? `No clients match "${searchTerm}".` : "No clients found."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
