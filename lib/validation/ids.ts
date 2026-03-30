export function isValidUuid(v: string): boolean {
  if (!v) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v.trim());
}

/** Valida UUID v4 (gerado pelo Supabase). Aceita `unknown` para uso direto com params. */
export function validateUuid(value: unknown): value is string {
  if (typeof value !== "string") return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export function readRequiredString(formData: FormData, key: string): string {
  const raw = formData.get(key);
  const val = typeof raw === "string" ? raw.trim() : "";
  if (!val) throw new Error(`${key} ausente/vazio.`);
  return val;
}

export function readAndValidateProjectId(formData: FormData): string {
  const id = readRequiredString(formData, "project_id");
  if (!isValidUuid(id)) throw new Error("Project ID invalido: formato UUID esperado.");
  return id;
}

export function readAndValidateReportId(formData: FormData): string {
  const id = readRequiredString(formData, "report_id");
  if (!isValidUuid(id)) throw new Error("Report ID invalido: formato UUID esperado.");
  return id;
}
