"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/app/lib/supabase";

export type CreateClientState = {
  message: string;
  status: "idle" | "error" | "success";
};

export type CreateTaskState = CreateClientState;

const validStatuses = new Set([
  "active",
  "delayed",
  "onboarding",
  "completed",
]);
const validTaskStatuses = new Set(["todo", "progress", "review", "done"]);
const validTaskPriorities = new Set(["low", "medium", "high"]);

function getTextValue(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

export async function createClient(
  _previousState: CreateClientState,
  formData: FormData,
): Promise<CreateClientState> {
  const supabase = getSupabaseServerClient();

  if (!supabase) {
    return {
      status: "error",
      message: "Supabase is not configured.",
    };
  }

  const name = getTextValue(formData, "name");
  const industry = getTextValue(formData, "industry");
  const status = getTextValue(formData, "status") || "active";

  const managerIdValue = getTextValue(
    formData,
    "assigned_manager_id",
  );

  const assignedManagerId =
    managerIdValue !== ""
      ? parseInt(managerIdValue, 10)
      : null;

  if (!name) {
    return {
      status: "error",
      message: "Client name is required.",
    };
  }

  if (!validStatuses.has(status)) {
    return {
      status: "error",
      message: "Choose a valid client status.",
    };
  }

  if (
    assignedManagerId !== null &&
    (Number.isNaN(assignedManagerId) ||
      assignedManagerId <= 0)
  ) {
    return {
      status: "error",
      message: "Manager ID must be valid.",
    };
  }

  // VERIFY MANAGER EXISTS
  if (assignedManagerId !== null) {
    const { data: manager, error: managerError } =
      await supabase
        .from("users")
        .select("id")
        .eq("id", assignedManagerId)
        .eq("role", "manager")
        .single();

    if (managerError || !manager) {
      return {
        status: "error",
        message: "Selected manager does not exist.",
      };
    }
  }

  const { error } = await supabase
    .from("clients")
    .insert({
      name,
      industry: industry || null,
      status,
      assigned_manager_id: assignedManagerId,
    });

  if (error) {
    return {
      status: "error",
      message: error.message,
    };
  }

  revalidatePath("/clients");

  return {
    status: "success",
    message: `${name} was added.`,
  };
}

function getOptionalPositiveInt(formData: FormData, key: string) {
  const value = getTextValue(formData, key);

  if (!value) {
    return null;
  }

  const numberValue = parseInt(value, 10);

  return Number.isNaN(numberValue) || numberValue <= 0 ? undefined : numberValue;
}

export async function createClientTask(
  _previousState: CreateTaskState,
  formData: FormData,
): Promise<CreateTaskState> {
  const supabase = getSupabaseServerClient();

  if (!supabase) {
    return {
      status: "error",
      message: "Supabase is not configured.",
    };
  }

  const clientId = getOptionalPositiveInt(formData, "client_id");
  const title = getTextValue(formData, "title");
  const description = getTextValue(formData, "description");
  const status = getTextValue(formData, "status") || "todo";
  const priority = getTextValue(formData, "priority") || "medium";
  const deadline = getTextValue(formData, "deadline");
  const assignedTo = getOptionalPositiveInt(formData, "assigned_to");
  const departmentId = getOptionalPositiveInt(formData, "department_id");

  if (!clientId) {
    return {
      status: "error",
      message: "Client ID is invalid.",
    };
  }

  if (!title) {
    return {
      status: "error",
      message: "Task title is required.",
    };
  }

  if (!validTaskStatuses.has(status)) {
    return {
      status: "error",
      message: "Choose a valid task status.",
    };
  }

  if (!validTaskPriorities.has(priority)) {
    return {
      status: "error",
      message: "Choose a valid task priority.",
    };
  }

  if (assignedTo === undefined || departmentId === undefined) {
    return {
      status: "error",
      message: "Assigned user and department IDs must be positive numbers.",
    };
  }

  const { error } = await supabase.from("tasks").insert({
    title,
    description: description || null,
    status,
    priority,
    deadline: deadline ? `${deadline}T00:00:00` : null,
    client_id: clientId,
    assigned_to: assignedTo,
    department_id: departmentId,
    created_by: null,
  });

  if (error) {
    return {
      status: "error",
      message: error.message,
    };
  }

  revalidatePath(`/clients/${clientId}`);

  return {
    status: "success",
    message: `${title} was added.`,
  };
}
