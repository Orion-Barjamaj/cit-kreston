"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import styles from "./clients.module.css";
import type { ClientRecord } from "@/app/lib/supabase";

type ClientListRecord = ClientRecord & {
  last_updated?: string | null;
  risk?: number;
};

type ClientsViewProps = {
  clients: ClientListRecord[];
  error?: string;
  isConfigured: boolean;
};

type SortKey = "name" | "industry" | "status" | "manager" | "created" | "updated" | "risk";
type SortDirection = "asc" | "desc";

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

function getSearchText(client: ClientListRecord) {
  return [
    client.name,
    client.industry,
    client.status ?? "active",
    client.assigned_manager_id,
    client.created_at,
    client.last_updated,
    client.risk,
  ]
    .filter((value) => value !== null && value !== undefined)
    .join(" ")
    .toLowerCase();
}

function getClientStatus(client: ClientListRecord) {
  return client.status?.trim() || "active";
}

function getStatusClassName(status: string) {
  const normalizedStatus = status.toLowerCase();

  if (normalizedStatus === "active") {
    return `${styles.statusTag} ${styles.statusActive}`;
  }

  if (normalizedStatus === "delayed") {
    return `${styles.statusTag} ${styles.statusDelayed}`;
  }

  if (normalizedStatus === "onboarding") {
    return `${styles.statusTag} ${styles.statusOnboarding}`;
  }

  return styles.statusTag;
}

function getRiskClassName(riskScore = 9) {
  if (riskScore <= 3) {
    return `${styles.riskTag} ${styles.riskRed}`;
  }

  if (riskScore <= 6) {
    return `${styles.riskTag} ${styles.riskOrange}`;
  }

  return `${styles.riskTag} ${styles.riskGreen}`;
}

function getSortValue(client: ClientListRecord, key: SortKey) {
  if (key === "name") {
    return client.name;
  }

  if (key === "industry") {
    return client.industry ?? "";
  }

  if (key === "status") {
    return client.status ?? "active";
  }

  if (key === "manager") {
    return client.assigned_manager_id ?? 0;
  }

  if (key === "created") {
    return new Date(client.created_at ?? 0).getTime();
  }

  if (key === "updated") {
    return new Date(client.last_updated ?? client.created_at ?? 0).getTime();
  }

  return client.risk ?? 9;
}

function compareClients(first: ClientListRecord, second: ClientListRecord, key: SortKey) {
  const firstValue = getSortValue(first, key);
  const secondValue = getSortValue(second, key);

  if (typeof firstValue === "number" && typeof secondValue === "number") {
    return firstValue - secondValue;
  }

  return String(firstValue).localeCompare(String(secondValue));
}

export default function ClientsView({
  clients,
  error,
  isConfigured,
}: ClientsViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("updated");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const normalizedSearchTerm = searchTerm.trim().toLowerCase();
  const filteredClients = useMemo(() => {
    const visibleClients = !normalizedSearchTerm
      ? clients
      : clients.filter((client) =>
          getSearchText(client).includes(normalizedSearchTerm),
        );

    const sortedClients = [...visibleClients].sort((first, second) =>
      compareClients(first, second, sortKey),
    );

    return sortDirection === "asc" ? sortedClients : sortedClients.reverse();
  }, [clients, normalizedSearchTerm, sortDirection, sortKey]);

  function changeSort(nextKey: SortKey) {
    if (nextKey === sortKey) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }

    setSortKey(nextKey);
    setSortDirection("asc");
  }

  function sortLabel(key: SortKey) {
    if (key !== sortKey) {
      return "";
    }

    return sortDirection === "asc" ? " (asc)" : " (desc)";
  }

  return (
    <>
      {!isConfigured ? (
        <div className={styles.noticeBox}>
          Add your Supabase URL and anon key to <code>.env</code> to load
          clients from the database.
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
              <th>
                <button className={styles.sortHeader} type="button" onClick={() => changeSort("name")}>
                  Client{sortLabel("name")}
                </button>
              </th>
              <th>
                <button className={styles.sortHeader} type="button" onClick={() => changeSort("industry")}>
                  Industry{sortLabel("industry")}
                </button>
              </th>
              <th>
                <button className={styles.sortHeader} type="button" onClick={() => changeSort("status")}>
                  Status{sortLabel("status")}
                </button>
              </th>
              <th>
                <button className={styles.sortHeader} type="button" onClick={() => changeSort("manager")}>
                  Manager ID{sortLabel("manager")}
                </button>
              </th>
              <th>
                <button className={styles.sortHeader} type="button" onClick={() => changeSort("created")}>
                  Created{sortLabel("created")}
                </button>
              </th>
              <th>
                <button className={styles.sortHeader} type="button" onClick={() => changeSort("updated")}>
                  Last Updated{sortLabel("updated")}
                </button>
              </th>
              <th>
                <button className={styles.sortHeader} type="button" onClick={() => changeSort("risk")}>
                  Risk{sortLabel("risk")}
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredClients.length > 0 ? (
              filteredClients.map((client) => {
                const status = getClientStatus(client);

                return (
                  <tr key={client.id}>
                    <td>
                      <Link
                        className={styles.tableLink}
                        href={`/clients/${client.id}`}
                      >
                        {client.name}
                      </Link>
                    </td>
                    <td>{formatField(client.industry)}</td>
                    <td>
                      <span className={getStatusClassName(status)}>
                        {status}
                      </span>
                    </td>
                    <td>{formatField(client.assigned_manager_id)}</td>
                    <td>{formatDate(client.created_at)}</td>
                    <td>
                      {formatDate(client.last_updated ?? client.created_at)}
                    </td>
                    <td>
                      <span className={getRiskClassName(client.risk)}>
                        {client.risk ?? 9}/10
                      </span>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7}>
                  {normalizedSearchTerm
                    ? `No clients match "${searchTerm}".`
                    : "No clients found."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
