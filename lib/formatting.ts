/**
 * Utilitários de formatação para pt-BR.
 * Seguro para uso em Server Components e Client Components.
 * NÃO importe módulos server-only aqui.
 */

/** Formata data longa: "28 de março de 2026". Retorna "-" para datas inválidas. */
export function formatarData(dateString: string): string {
  if (!dateString) return "-";
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** Formata data curta: "28/03/2026". Retorna "-" para datas inválidas. */
export function formatarDataCurta(dateString: string): string {
  if (!dateString) return "-";
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("pt-BR");
}

/** Formata moeda: "R$ 1.234,56". */
export function formatarMoeda(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/** Formata hora: "14:30". Retorna "" para datas inválidas. */
export function formatarHora(dateString: string): string {
  if (!dateString) return "";
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

/** Formata data e hora curtas: "28/03/2026 14:30". Retorna "-" para datas inválidas. */
export function formatarDataHora(dateString?: string | null): string {
  if (!dateString) return "-";
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return "-";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(d);
}
