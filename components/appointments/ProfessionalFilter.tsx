"use client";

import type { ProfessionalRow } from "@/services/professionals.service";

type Props = {
  professionals: ProfessionalRow[];
  selected: string;
  onChange: (professionalId: string) => void;
};

export default function ProfessionalFilter({
  professionals,
  selected,
  onChange,
}: Props) {
  return (
    <div className="flex items-center gap-2">
      <label
        htmlFor="professional-filter"
        className="hidden text-xs font-medium text-slate-500 sm:block"
      >
        Profissional:
      </label>
      <select
        id="professional-filter"
        value={selected}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      >
        <option value="">Todos</option>
        {professionals.map((p) => (
          <option key={p.id} value={p.id}>
            {p.full_name} — {p.specialty}
          </option>
        ))}
      </select>

      {/* Color chips */}
      <div className="hidden items-center gap-1 sm:flex">
        {selected === "" ? (
          professionals.slice(0, 5).map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => onChange(p.id)}
              className="h-4 w-4 rounded-full border border-white shadow-sm transition hover:scale-125"
              style={{ backgroundColor: p.color }}
              title={p.full_name}
            />
          ))
        ) : (
          <button
            type="button"
            onClick={() => onChange("")}
            className="text-xs text-blue-600 hover:underline"
          >
            Limpar
          </button>
        )}
      </div>
    </div>
  );
}
