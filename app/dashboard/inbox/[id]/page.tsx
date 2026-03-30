import { notFound } from "next/navigation";
import { requireUser } from "@/services/auth.service";
import { getUserContext } from "@/services/clinic-memberships.service";
import { createClient } from "@/lib/supabase/server";
import type { ConversationRow, MessageRow } from "@/services/conversations.service";
import { formatarDataHora } from "@/lib/formatting";
import { validateUuid } from "@/lib/validation/ids";
import {
  sendManualMessageAction,
  escalateConversationAction,
  resolveConversationAction,
} from "@/app/actions/conversations.actions";

export const dynamic = "force-dynamic";

export default async function ConversationDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams?: { error?: string; success?: string };
}) {
  const user = await requireUser();
  const ctx  = await getUserContext(user.id);

  if (!validateUuid(params.id)) notFound();

  const errorMsg   = searchParams?.error   ? decodeURIComponent(searchParams.error)   : null;
  const successMsg = searchParams?.success ? decodeURIComponent(searchParams.success) : null;

  const supabase = createClient();

  const { data: conv, error: convError } = await supabase
    .from("conversations")
    .select("*")
    .eq("id", params.id)
    .eq("clinic_id", ctx.clinicId ?? "")
    .is("deleted_at", null)
    .single();

  if (convError || !conv) notFound();

  const conversation = conv as ConversationRow;

  const { data: rawMessages } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", params.id)
    .order("sent_at", { ascending: true })
    .limit(100);

  const messages = (rawMessages ?? []) as MessageRow[];

  const isResolved  = conversation.status === "RESOLVED";
  const isEscalated = conversation.status === "ESCALATED";

  return (
    <div className="flex h-full flex-col space-y-0">
      {/* Header */}
      <div className="flex items-center justify-between border-b bg-white px-6 py-4">
        <div className="flex items-center gap-3">
          <a
            href="/dashboard/inbox"
            className="text-sm text-slate-500 hover:text-slate-700"
          >
            ← Inbox
          </a>
          <div className="h-4 w-px bg-slate-200" />
          <div>
            <h1 className="text-base font-semibold text-slate-900">
              {conversation.contact_name ?? conversation.contact_identifier}
            </h1>
            <p className="text-xs text-slate-500">
              {conversation.contact_phone ?? conversation.contact_identifier}
              {conversation.channel === "WHATSAPP" && (
                <span className="ml-2 text-green-600">WhatsApp</span>
              )}
            </p>
          </div>
        </div>

        {/* Actions */}
        {!isResolved && (
          <div className="flex gap-2">
            {!isEscalated && (
              <form action={escalateConversationAction}>
                <input type="hidden" name="conversation_id" value={conversation.id} />
                <button
                  type="submit"
                  className="rounded-lg border border-orange-300 bg-orange-50 px-3 py-1.5 text-xs font-medium text-orange-700 transition hover:bg-orange-100"
                >
                  Escalar para humano
                </button>
              </form>
            )}
            <form action={resolveConversationAction}>
              <input type="hidden" name="conversation_id" value={conversation.id} />
              <button
                type="submit"
                className="rounded-lg border border-green-300 bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700 transition hover:bg-green-100"
              >
                Resolver
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Alerts */}
      {(errorMsg || successMsg) && (
        <div className="px-6 pt-3">
          {errorMsg && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
              {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-700">
              {successMsg}
            </div>
          )}
        </div>
      )}

      {/* Message history */}
      <div className="flex-1 overflow-y-auto space-y-3 px-6 py-4">
        {messages.length === 0 && (
          <p className="text-center text-sm text-slate-400">
            Nenhuma mensagem ainda.
          </p>
        )}

        {messages.map((msg) => {
          const isOutbound = msg.direction === "OUTBOUND";
          return (
            <div
              key={msg.id}
              className={["flex", isOutbound ? "justify-end" : "justify-start"].join(" ")}
            >
              <div
                className={[
                  "max-w-[75%] rounded-2xl px-4 py-2.5 text-sm",
                  isOutbound
                    ? "rounded-br-sm bg-blue-600 text-white"
                    : "rounded-bl-sm bg-slate-100 text-slate-900",
                ].join(" ")}
              >
                <p className="whitespace-pre-wrap break-words">
                  {msg.content ?? `[${msg.message_type}]`}
                </p>
                <div
                  className={[
                    "mt-1 flex items-center gap-1 text-xs",
                    isOutbound ? "justify-end text-blue-200" : "text-slate-400",
                  ].join(" ")}
                >
                  <span>{formatarDataHora(msg.sent_at)}</span>
                  {isOutbound && msg.sent_by_ai && (
                    <span className="rounded bg-blue-500 px-1 py-0.5">IA</span>
                  )}
                  {isOutbound && msg.delivery_status === "READ" && (
                    <span>✓✓</span>
                  )}
                  {isOutbound && msg.delivery_status === "DELIVERED" && (
                    <span>✓✓</span>
                  )}
                  {isOutbound && msg.delivery_status === "SENT" && (
                    <span>✓</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Reply box */}
      {!isResolved ? (
        <div className="border-t bg-white px-6 py-4">
          <form action={sendManualMessageAction} className="flex gap-3">
            <input type="hidden" name="conversation_id" value={conversation.id} />
            <input
              name="content"
              type="text"
              placeholder="Digite uma mensagem..."
              required
              autoComplete="off"
              className="flex-1 rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
            >
              Enviar
            </button>
          </form>
        </div>
      ) : (
        <div className="border-t bg-slate-50 px-6 py-3 text-center text-sm text-slate-500">
          Conversa resolvida em {formatarDataHora(conversation.resolved_at)}
        </div>
      )}
    </div>
  );
}
