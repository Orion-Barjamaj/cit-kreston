import { connection } from "next/server";
import styles from "./clients.module.css";
import AddClientForm from "./add-client-form";
import ClientsView from "./clients-view";
import { ClientRecord, getSupabaseServerClient } from "@/app/lib/supabase";

type ClientListRecord = ClientRecord & {
  last_updated_at: string | null;
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
  const status = client.status?.toLowerCase();
  let score = 9;

  if (status === "delayed") {
    score = 2;
  }

  if (status === "onboarding") {
    score = 5;
  }

  if (status === "completed") {
    score = 10;
  }

  if (lastUpdatedAt) {
    const daysSinceUpdate = (Date.now() - new Date(lastUpdatedAt).getTime()) / (1000 * 60 * 60 * 24);

    if (daysSinceUpdate > 7) {
      score = Math.min(score, 4);
    }
  }

  return score;
}

async function getClients() {
  await connection();

  const supabase = getSupabaseServerClient();

  if (!supabase) {
    return {
      clients: [] as ClientRecord[],
      isConfigured: false,
    };
  }

  const { data, error } = await supabase
    .from("clients")
    .select("id, name, industry, status, assigned_manager_id, created_at")
    .order("created_at", { ascending: false });

  const clients = (data ?? []) as ClientRecord[];
  const [tasksResult, activitiesResult, documentsResult] = await Promise.all([
    supabase.from("tasks").select("client_id, created_at"),
    supabase.from("activities").select("client_id, created_at"),
    supabase.from("documents").select("client_id, created_at"),
  ]);

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
      risk_score: getRiskScore(client, lastUpdatedAt),
    };
  });

  return {
    clients: clientList,
    error: error?.message,
    isConfigured: true,
  };
}

export default async function ClientsPage() {
  const { clients, error, isConfigured } = await getClients();

  return (
    <section className={styles.pageStack}>
      <div className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>Client workspace</p>
          <h2>Clients</h2>
          <p>Search, filter, and open a simple client file.</p>
        </div>
      </div>

      <AddClientForm isConfigured={isConfigured} />

      <ClientsView clients={clients} error={error} isConfigured={isConfigured} />
    </section>
  );
}
