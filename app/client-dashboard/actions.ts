"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/app/lib/supabase";
import { summarizeFile } from "@/app/lib/summarize";

export type ClientPortalActionState = {
  message: string;
  status: "idle" | "error" | "success";
};

const documentBucketName = "documents";

function getTextValue(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

function getClientId(formData: FormData) {
  const clientId = Number(getTextValue(formData, "client_id"));

  return Number.isInteger(clientId) && clientId > 0 ? clientId : null;
}

function getFileValue(formData: FormData, key: string) {
  const value = formData.get(key);

  return value instanceof File && value.size > 0 ? value : null;
}

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export async function uploadClientPortalDocument(
  _previousState: ClientPortalActionState,
  formData: FormData,
): Promise<ClientPortalActionState> {
  const supabase = getSupabaseServerClient();

  if (!supabase) {
    return { status: "error", message: "Supabase is not configured." };
  }

  const clientId = getClientId(formData);
  const file = getFileValue(formData, "file");
  const note = getTextValue(formData, "note");

  if (!clientId) {
    return { status: "error", message: "Client is invalid." };
  }

  if (!file) {
    return { status: "error", message: "Choose a file to upload." };
  }

  const safeFileName = sanitizeFileName(file.name);
  const storagePath = `${clientId}/client-${Date.now()}-${safeFileName}`;
  const fileBuffer = await file.arrayBuffer();
  const { error: uploadError } = await supabase.storage.from(documentBucketName).upload(storagePath, fileBuffer, {
    contentType: file.type || "application/octet-stream",
    upsert: false,
  });

  if (uploadError) {
    return { status: "error", message: uploadError.message };
  }

  const { data: publicUrlData } = supabase.storage.from(documentBucketName).getPublicUrl(storagePath);
  const summary = await summarizeFile(publicUrlData.publicUrl, file.name);
  const { error: documentError } = await supabase.from("documents").insert({
    client_id: clientId,
    uploaded_by: null,
    file_name: file.name,
    file_url: publicUrlData.publicUrl,
    type: "client upload",
    summary,
  });

  if (documentError) {
    return { status: "error", message: documentError.message };
  }

  if (note) {
    await supabase.from("notes").insert({
      client_id: clientId,
      uploaded_by: "Client",
      text: `Uploaded ${file.name}: ${note}`,
    });
  }

  revalidatePath("/client-dashboard");
  revalidatePath(`/clients/${clientId}`);

  return { status: "success", message: `${file.name} was sent.` };
}

export async function sendClientPortalQuestion(
  _previousState: ClientPortalActionState,
  formData: FormData,
): Promise<ClientPortalActionState> {
  const supabase = getSupabaseServerClient();

  if (!supabase) {
    return { status: "error", message: "Supabase is not configured." };
  }

  const clientId = getClientId(formData);
  const text = getTextValue(formData, "text");

  if (!clientId) {
    return { status: "error", message: "Client is invalid." };
  }

  if (!text) {
    return { status: "error", message: "Write a question or follow-up note." };
  }

  const { error } = await supabase.from("notes").insert({
    client_id: clientId,
    uploaded_by: "Client",
    text,
  });

  if (error) {
    return { status: "error", message: error.message };
  }

  revalidatePath("/client-dashboard");
  revalidatePath(`/clients/${clientId}`);

  return { status: "success", message: "Your note was sent." };
}
