"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/app/lib/supabase";
import { extractClientFromDocument, summarizeFile } from "@/app/lib/summarize";

export type CreateClientState = {
  message: string;
  status: "idle" | "error" | "success";
};

export type CreateTaskState = CreateClientState;
export type CreateDocumentState = CreateClientState;
export type CreateActivityState = CreateClientState;
export type CreateTimelineNoteState = CreateClientState;

const validStatuses = new Set(["active", "delayed", "onboarding", "completed"]);
const validTaskStatuses = new Set(["todo", "progress", "review", "done"]);
const validTaskPriorities = new Set(["low", "medium", "high"]);
const validDocumentTypes = new Set([
  "contract",
  "payroll",
  "audit",
  "tax",
  "report",
]);
const validActivityTypes = new Set(["comment", "meeting", "update", "alert"]);
const documentBucketName = "documents";

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

  const managerIdValue = getTextValue(formData, "assigned_manager_id");

  const assignedManagerId =
    managerIdValue !== "" ? parseInt(managerIdValue, 10) : null;

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
    (Number.isNaN(assignedManagerId) || assignedManagerId <= 0)
  ) {
    return {
      status: "error",
      message: "Manager ID must be valid.",
    };
  }

  // VERIFY MANAGER EXISTS
  if (assignedManagerId !== null) {
    const { data: manager, error: managerError } = await supabase
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

  const { error } = await supabase.from("clients").insert({
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

  return Number.isNaN(numberValue) || numberValue <= 0
    ? undefined
    : numberValue;
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

function getFileValue(formData: FormData, key: string) {
  const value = formData.get(key);

  return value instanceof File && value.size > 0 ? value : null;
}

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export async function createClientDocument(
  _previousState: CreateDocumentState,
  formData: FormData,
): Promise<CreateDocumentState> {
  const supabase = getSupabaseServerClient();

  if (!supabase) {
    return {
      status: "error",
      message: "Supabase is not configured.",
    };
  }

  const clientId = getOptionalPositiveInt(formData, "client_id");
  const file = getFileValue(formData, "file");
  const type = getTextValue(formData, "type") || "report";

  if (!clientId) {
    return {
      status: "error",
      message: "Client ID is invalid.",
    };
  }

  if (!file) {
    return {
      status: "error",
      message: "Choose a file from your computer.",
    };
  }

  if (!validDocumentTypes.has(type)) {
    return {
      status: "error",
      message: "Choose a valid document type.",
    };
  }

  const safeFileName = sanitizeFileName(file.name);
  const storagePath = `${clientId}/${Date.now()}-${safeFileName}`;
  const fileBuffer = await file.arrayBuffer();

  const { error: uploadError } = await supabase.storage
    .from(documentBucketName)
    .upload(storagePath, fileBuffer, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });

  if (uploadError) {
    return {
      status: "error",
      message: uploadError.message,
    };
  }

  const { data: publicUrlData } = supabase.storage
    .from(documentBucketName)
    .getPublicUrl(storagePath);

  const summary = await summarizeFile(publicUrlData.publicUrl, file.name);

  const insertPayload = {
    client_id: clientId,
    uploaded_by: null,
    file_name: file.name,
    file_url: publicUrlData.publicUrl,
    type,
    summary,
  };


  const { error } = await supabase
    .from("documents")
    .insert(insertPayload)
    .select();

  if (error) {
    return {
      status: "error",
      message: error.message,
    };
  }

  revalidatePath(`/clients/${clientId}`);

  return {
    status: "success",
    message: `${file.name} was added.`,
  };
}

export async function createClientActivity(
  _previousState: CreateActivityState,
  formData: FormData,
): Promise<CreateActivityState> {
  const supabase = getSupabaseServerClient();

  if (!supabase) {
    return {
      status: "error",
      message: "Supabase is not configured.",
    };
  }

  const clientId = getOptionalPositiveInt(formData, "client_id");
  const content = getTextValue(formData, "content");
  const type = getTextValue(formData, "type") || "comment";

  if (!clientId) {
    return {
      status: "error",
      message: "Client ID is invalid.",
    };
  }

  if (!content) {
    return {
      status: "error",
      message: "Note content is required.",
    };
  }

  if (!validActivityTypes.has(type)) {
    return {
      status: "error",
      message: "Choose a valid activity type.",
    };
  }

  const { error } = await supabase.from("activities").insert({
    client_id: clientId,
    user_id: null,
    type,
    content,
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
    message: "Note was added.",
  };
}

export async function createClientTimelineNote(
  _previousState: CreateTimelineNoteState,
  formData: FormData,
): Promise<CreateTimelineNoteState> {
  const supabase = getSupabaseServerClient();

  if (!supabase) {
    return {
      status: "error",
      message: "Supabase is not configured.",
    };
  }

  const clientId = getOptionalPositiveInt(formData, "client_id");
  const text = getTextValue(formData, "text");

  if (!clientId) {
    return {
      status: "error",
      message: "Client ID is invalid.",
    };
  }

  if (!text) {
    return {
      status: "error",
      message: "Note content is required.",
    };
  }

  const { error } = await supabase.from("notes").insert({
    client_id: clientId,
    uploaded_by: null,
    text,
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
    message: "Timeline note was added.",
  };
}

export async function createClientFromContract(
  _previousState: CreateDocumentState,
  formData: FormData,
): Promise<CreateDocumentState> {
  const supabase = getSupabaseServerClient();

  if (!supabase) {
    return { status: "error", message: "Supabase is not configured." };
  }

  const file = getFileValue(formData, "file");

  if (!file) {
    return { status: "error", message: "Choose a contract file." };
  }

  const safeFileName = sanitizeFileName(file.name);
  const storagePath = `contracts/${Date.now()}-${safeFileName}`;
  const fileBuffer = await file.arrayBuffer();

  // upload to storage
  const { error: uploadError } = await supabase.storage
    .from(documentBucketName)
    .upload(storagePath, fileBuffer, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });

  if (uploadError) {
    return { status: "error", message: uploadError.message };
  }

  const { data: publicUrlData } = supabase.storage
    .from(documentBucketName)
    .getPublicUrl(storagePath);

  // extract client data with Gemini
  const extracted = await extractClientFromDocument(
    publicUrlData.publicUrl,
    file.name
  );

  if (!extracted) {
    return { status: "error", message: "Could not extract client data from document." };
  }

  // create the client
  const { data: newClient, error: clientError } = await supabase
    .from("clients")
    .insert({
      name: extracted.name,
      industry: extracted.industry,
      status: "active",
      risk: extracted.risk,
      assigned_manager_id: null,
    })
    .select("id")
    .single();

  if (clientError || !newClient) {
    return { status: "error", message: clientError?.message ?? "Failed to create client." };
  }

  // save the contract document linked to the new client
  const summary = await summarizeFile(publicUrlData.publicUrl, file.name);

  const { error: docError } = await supabase.from("documents").insert({
    client_id: newClient.id,
    uploaded_by: null,
    file_name: file.name,
    file_url: publicUrlData.publicUrl,
    type: "contract",
    summary,
  });

  if (docError) {
    return { status: "error", message: docError.message };
  }

  revalidatePath("/clients");

  return {
    status: "success",
    message: `Client "${extracted.name}" created from contract.`,
  };
}