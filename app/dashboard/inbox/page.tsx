import Link from "next/link";
import { requireUser } from "@/services/auth.service";
import { getUserContext } from "@/services/clinic-memberships.service";
import { listConversations } from "@/services/conversations.service";
import type { ConversationRow, ConversationStatus } from "@/services/conversations.service";
import { formatarDataHora } from "@/lib/formatting";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<ConversationStatus, string> = {
  OPEN:            "Aberta",
  IN_PROGRESS:     "Em andamento",
  WAITING_PATIENT: "Aguardando paciente",
  RESOLVED:        "Resolvida",
  ESCALATED:       "Escalada para humano",
};

const STATUS_COLOR: Record<ConversationStatus, string> = {
  OPEN:            "bg-blue-100 text-blue-700",
  IN_PROGRESS:     "bg-yellow-100 text-yellow-700",
  WAITING_PATIENT: "bg-orange-100 text-orange-700",
  RESOLVED:        "bg-green-100 text-green-700",
  ESCALATED:       "bg-red-100 text-red-700",
};

export default async function InboxPage({
  searchParams,
}: {
  searchParams?: { status?: string; error?: string };
}) {
  const user = await requireUser();
  const ctx  = await getUserContext(user.id);

  const filterStatus = (searchParams?.status as ConversationStatus | undefined) ?? undefined;
  const errorMsg = searchParams?.error ? decodeURIComponent(searchParams.error) : null;

  let conversations: ConversationRow[] = [];
  if (ctx.clinicId) {
    try {
      conversations = await listConversations(ctx.clinicId, { status: filterStatus, limit: 100 });
    } catch {
      conversations = [];
    }
  }

  const tabs: { key: ConversationStatus | ""; label: string }[] = [
    { key: "",             label: "Todas"            },
    { key: "OPEN",         label: "Abertas"          },
    { key: "IN_PROGRESS",  label: "Em andamento"     },
    { key: "ESCALATED",    label: "Escaladas"        },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Inbox</h1>
          <p className="text-sm text-slate-600">
            {conversations.length} conversa{conversations.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMsg}
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-1 overflow-x-auto rounded-lg border bg-slate-100 p-1">
        {tabs.map((tab) => (
          <Link
            key={tab.key}
            href={tab.key ? `/dashboard/inbox?status=${tab.key}` : "/dashboard/inbox"}
            className={[
              "flex items-center gap-2 whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium transition",
              (filterStatus ?? "") === tab.key
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900",
            ].join(" ")}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {/* Conversation list */}
      {conversations.length === 0 ? (
        <div className="rounded-xl border bg-white py-16 text-center text-slate-500">
          <p className="text-4xl">💬</p>
          <p className="mt-3 text-base font-medium">Nenhuma conversa encontrada</p>
          <p className="text-sm">
            As mensagens do WhatsApp aparecerão aqui automaticamente.
          </p>
        </div>
      ) : (
        <div className="divide-y rounded-xl border bg-white">
          {conversations.map((conv) => (
            <Link
              key={conv.id}
              href={`/dashboard/inbox/${conv.id}`}
              className="flex items-center gap-4 p-4 transition hover:bg-slate-50"
            >
              {/* Avatar */}
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-base font-semibold text-blue-700">
                {conv.contact_name
                  ? conv.contact_name.charAt(0).toUpperCase()
                  : conv.contact_identifier.charAt(0)}
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate font-medium text-slate-900">
                    {conv.contact_name ?? conv.contact_identifier}
                  </span>
                  <span
                    className={[
                      "flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-medium",
                      STATUS_COLOR[conv.status],
                    ].join(" ")}
                  >
                    {STATUS_LABEL[conv.status]}
                  </span>
                </div>
                <p className="truncate text-sm text-slate-500">
                  {conv.contact_phone ?? conv.contact_identifier}
                </p>
              </div>

              {/* Time */}
              <div className="flex-shrink-0 text-right">
                <p className="text-xs text-slate-400">
                  {formatarDataHora(conv.last_message_at ?? conv.created_at)}
                </p>
                {conv.channel === "WHATSAPP" && (
                  <span className="mt-1 inline-block text-xs text-green-600">WhatsApp</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
