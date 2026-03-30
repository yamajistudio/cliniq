"use client";

import { useRouter } from "next/navigation";

const TABS = [
  { key: "clinic",     label: "Dados da clínica",    icon: "🏥" },
  { key: "schedule",   label: "Operação",             icon: "🕐" },
  { key: "notifications", label: "Notificações",      icon: "🔔" },
  { key: "team",       label: "Equipe e permissões",  icon: "👥" },
  { key: "whatsapp",   label: "WhatsApp",             icon: "💬" },
];

type Props = {
  activeTab: string;
};

export default function SettingsTabs({ activeTab }: Props) {
  const router = useRouter();

  return (
    <div className="flex gap-1 overflow-x-auto rounded-lg border bg-slate-100 p-1">
      {TABS.map((tab) => (
        <button
          key={tab.key}
          type="button"
          onClick={() => router.push(`/dashboard/settings?tab=${tab.key}`)}
          className={[
            "flex items-center gap-2 whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium transition",
            activeTab === tab.key
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-600 hover:text-slate-900",
          ].join(" ")}
        >
          <span>{tab.icon}</span>
          <span className="hidden sm:inline">{tab.label}</span>
          <span className="sm:hidden">{tab.label.split(" ")[0]}</span>
        </button>
      ))}
    </div>
  );
}
