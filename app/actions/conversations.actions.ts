"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/services/auth.service";
import { getUserContext } from "@/services/clinic-memberships.service";
import {
  saveMessage,
  escalateToHuman,
  resolveConversation,
  linkConversationToEntity,
} from "@/services/conversations.service";
import { validateUuid } from "@/lib/validation/ids";

export async function sendManualMessageAction(formData: FormData) {
  const user = await requireUser();
  const ctx  = await getUserContext(user.id);

  if (!ctx.clinicId) redirect("/dashboard?error=Clinica%20nao%20encontrada");

  const conversationId = String(formData.get("conversation_id") ?? "").trim();
  const content        = String(formData.get("content") ?? "").trim();

  if (!validateUuid(conversationId)) {
    redirect(`/dashboard/inbox?error=Conversa%20invalida`);
  }
  if (!content) {
    redirect(`/dashboard/inbox/${conversationId}?error=Mensagem%20nao%20pode%20ser%20vazia`);
  }

  try {
    await saveMessage({
      conversation_id: conversationId,
      clinic_id: ctx.clinicId,
      direction: "OUTBOUND",
      message_type: "TEXT",
      content,
      sent_by_ai: false,
      sent_by_user_id: user.id,
      delivery_status: "PENDING",
    });
  } catch (err) {
    const msg = encodeURIComponent(
      err instanceof Error ? err.message : "Erro ao enviar mensagem"
    );
    redirect(`/dashboard/inbox/${conversationId}?error=${msg}`);
  }

  revalidatePath(`/dashboard/inbox/${conversationId}`);
}

export async function escalateConversationAction(formData: FormData) {
  const user = await requireUser();
  const ctx  = await getUserContext(user.id);

  if (!ctx.clinicId) redirect("/dashboard?error=Clinica%20nao%20encontrada");

  const conversationId = String(formData.get("conversation_id") ?? "").trim();
  const reason         = String(formData.get("reason") ?? "").trim() || null;

  if (!validateUuid(conversationId)) {
    redirect(`/dashboard/inbox?error=Conversa%20invalida`);
  }

  try {
    await escalateToHuman(conversationId, ctx.clinicId, user.id, { reason });
  } catch (err) {
    const msg = encodeURIComponent(
      err instanceof Error ? err.message : "Erro ao escalar conversa"
    );
    redirect(`/dashboard/inbox/${conversationId}?error=${msg}`);
  }

  revalidatePath(`/dashboard/inbox/${conversationId}`);
  revalidatePath("/dashboard/inbox");
}

export async function resolveConversationAction(formData: FormData) {
  const user = await requireUser();
  const ctx  = await getUserContext(user.id);

  if (!ctx.clinicId) redirect("/dashboard?error=Clinica%20nao%20encontrada");

  const conversationId = String(formData.get("conversation_id") ?? "").trim();

  if (!validateUuid(conversationId)) {
    redirect(`/dashboard/inbox?error=Conversa%20invalida`);
  }

  try {
    await resolveConversation(conversationId, ctx.clinicId, user.id);
  } catch (err) {
    const msg = encodeURIComponent(
      err instanceof Error ? err.message : "Erro ao resolver conversa"
    );
    redirect(`/dashboard/inbox/${conversationId}?error=${msg}`);
  }

  revalidatePath(`/dashboard/inbox/${conversationId}`);
  revalidatePath("/dashboard/inbox");
  redirect("/dashboard/inbox");
}

export async function assignConversationAction(formData: FormData) {
  const user = await requireUser();
  const ctx  = await getUserContext(user.id);

  if (!ctx.clinicId) redirect("/dashboard?error=Clinica%20nao%20encontrada");

  const conversationId = String(formData.get("conversation_id") ?? "").trim();
  const assignToId     = String(formData.get("assign_to") ?? "").trim() || null;

  if (!validateUuid(conversationId)) {
    redirect(`/dashboard/inbox?error=Conversa%20invalida`);
  }

  try {
    await escalateToHuman(conversationId, ctx.clinicId, user.id, {
      assignTo: assignToId,
      reason: "Atribuição manual",
    });
  } catch (err) {
    const msg = encodeURIComponent(
      err instanceof Error ? err.message : "Erro ao atribuir conversa"
    );
    redirect(`/dashboard/inbox/${conversationId}?error=${msg}`);
  }

  revalidatePath(`/dashboard/inbox/${conversationId}`);
  revalidatePath("/dashboard/inbox");
}
