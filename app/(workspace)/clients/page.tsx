import { connection } from "next/server";
import styles from "./clients.module.css";
import AddClientForm from "./add-client-form";
import ClientsView from "./clients-view";
import { ClientRecord, getSupabaseServerClient } from "@/app/lib/supabase";

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

  return {
    clients: data ?? [],
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
