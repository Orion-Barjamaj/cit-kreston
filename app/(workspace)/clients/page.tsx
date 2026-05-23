import { connection } from "next/server";
import styles from "./clients.module.css";
import AddClientForm, { type ClientManagerOption } from "./add-client-form";
import ClientsView from "./clients-view";
import ImportClientContractForm from "./import-client-contract-form";
import { ClientRecord, getSupabaseServerClient } from "@/app/lib/supabase";

type ClientListRecord = ClientRecord & {
  last_updated_at: string | null;
  manager_name: string | null;
  risk_score: number;
};

type ClientUpdateRecord = {
  client_id: number | null;
  created_at: string | null;
};

function getLatestDate(values: Array<string | null | undefined>) {
  const dates = values
    .filter((value): value is string => Boolean(value))
    .map((value) => new Date(value))
    .filter((date) => !Number.isNaN(date.getTime()))
    .sort((first, second) => second.getTime() - first.getTime());

  return dates[0]?.toISOString() ?? null;
}

function getRiskScore(client: ClientRecord, lastUpdatedAt: string | null) {
  const extractedRisk = client.risk?.toLowerCase();
  const status = client.status?.toLowerCase();
  let score = 2;

  if (extractedRisk === "medium") {
    score = 5;
  }

  if (extractedRisk === "high") {
    score = 9;
  }

  if (status === "delayed") {
    score = Math.max(score, 9);
  }

  if (status === "onboarding") {
    score = Math.max(score, 5);
  }

  if (status === "completed") {
    score = 1;
  }

  if (lastUpdatedAt) {
    const daysSinceUpdate = (Date.now() - new Date(lastUpdatedAt).getTime()) / (1000 * 60 * 60 * 24);

    if (daysSinceUpdate > 7) {
      score = Math.max(score, 7);
    }
  }

  return score;
}

async function getClients() {
  await connection();

  const supabase = getSupabaseServerClient();

  if (!supabase) {
    return {
      clients: [] as ClientListRecord[],
      managers: [] as ClientManagerOption[],
      isConfigured: false,
    };
  }

  const { data, error } = await supabase
    .from("clients")
    .select("id, name, industry, risk, status, assigned_manager_id, created_at")
    .order("created_at", { ascending: false });

  const clients = (data ?? []) as ClientRecord[];
  const [tasksResult, activitiesResult, documentsResult, usersResult] = await Promise.all([
    supabase.from("tasks").select("client_id, created_at"),
    supabase.from("activities").select("client_id, created_at"),
    supabase.from("documents").select("client_id, created_at"),
    supabase.from("users").select("id, name, role"),
  ]);
  const usersById = new Map(((usersResult.data ?? []) as { id: number; name: string }[]).map((user) => [user.id, user.name]));
  const managers = ((usersResult.data ?? []) as Array<{ id: number; name: string; role?: string | null }>)
    .filter((user) => (user.role ?? "").toLowerCase() === "manager")
    .map((user) => ({
      id: user.id,
      name: user.name,
      role: user.role ?? "manager",
    }));

  const updatesByClient = new Map<number, Array<string | null>>();

  clients.forEach((client) => {
    updatesByClient.set(client.id, [client.created_at]);
  });

  [tasksResult.data, activitiesResult.data, documentsResult.data].forEach((records) => {
    ((records ?? []) as ClientUpdateRecord[]).forEach((record) => {
      if (!record.client_id) {
        return;
      }

      updatesByClient.set(record.client_id, [...(updatesByClient.get(record.client_id) ?? []), record.created_at]);
    });
  });

  const clientList = clients.map((client): ClientListRecord => {
    const lastUpdatedAt = getLatestDate(updatesByClient.get(client.id) ?? [client.created_at]);

    return {
      ...client,
      last_updated_at: lastUpdatedAt,
      manager_name: client.assigned_manager_id ? usersById.get(client.assigned_manager_id) ?? null : null,
      risk_score: getRiskScore(client, lastUpdatedAt),
    };
  });

  return {
    clients: clientList,
    error: error?.message,
    isConfigured: true,
    managers,
  };
}

export default async function ClientsPage() {
  const { clients, error, isConfigured, managers } = await getClients();

  return (
    <section className={styles.pageStack}>
      <div className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>Client workspace</p>
          <h2>Clients</h2>
          <p>Search, filter, and open a simple client file.</p>
        </div>
      </div>

      <ClientsView
        actions={
          <>
            <AddClientForm isConfigured={isConfigured} managers={managers} />
            <ImportClientContractForm isConfigured={isConfigured} />
          </>
        }
        clients={clients}
        error={error}
        isConfigured={isConfigured}
      />
    </section>
  );
}
