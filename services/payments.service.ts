import { createClient } from "@/lib/supabase/server";
import { logAction } from "@/services/audit.service";
import type { Database } from "@/types/database";

export type PaymentRow = Database["public"]["Tables"]["payments"]["Row"];
export type PaymentInsert = Database["public"]["Tables"]["payments"]["Insert"];
export type PaymentUpdate = Database["public"]["Tables"]["payments"]["Update"];
export type PatientRow = Database["public"]["Tables"]["patients"]["Row"];
export type PaymentStatus = NonNullable<PaymentRow["status"]>;

export type PaymentWithNames = PaymentRow & {
  patient_name: string;
};

export type MonthSummary = {
  totalRevenue: number;
  totalPending: number;
  paidCount: number;
  pendingCount: number;
};

export type CreatePaymentInput = {
  clinic_id: string;
  patient_id: string;
  appointment_id?: string | null;
  amount: number;
  payment_method?: string | null;
  notes?: string | null;
};

function serviceError(base: string, raw: unknown, ctx: string) {
  const msg =
    raw instanceof Error
      ? raw.message
      : typeof (raw as { message?: unknown })?.message === "string"
      ? (raw as { message: string }).message
      : JSON.stringify(raw);

  return new Error(`${base} [context: ${ctx}]: ${msg}`);
}

export async function listPayments(
  clinicId: string,
  options?: { status?: PaymentStatus; limit?: number }
): Promise<PaymentWithNames[]> {
  const supabase = createClient();

  let query = supabase
    .from("payments")
    .select("*")
    .eq("clinic_id", clinicId)
    .order("created_at", { ascending: false });

  if (options?.status) {
    query = query.eq("status", options.status);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) {
    throw serviceError("Falha ao listar pagamentos", error, "payments.select");
  }

  const payments: PaymentRow[] = data ?? [];

  if (payments.length === 0) {
    return [];
  }

  const patientIds = [
    ...new Set(payments.map((payment) => payment.patient_id)),
  ];

  const { data: patients, error: patientsError } = await supabase
    .from("patients")
    .select("id, full_name")
    .in("id", patientIds);

  if (patientsError) {
    throw serviceError(
      "Falha ao carregar pacientes dos pagamentos",
      patientsError,
      "patients.selectForPayments"
    );
  }

  const patientMap = new Map(
    (patients ?? []).map((patient: Pick<PatientRow, "id" | "full_name">) => [
      patient.id,
      patient.full_name,
    ])
  );

  return payments.map((payment) => ({
    ...payment,
    patient_name: patientMap.get(payment.patient_id) ?? "Paciente",
  }));
}

export async function createPayment(
  payload: CreatePaymentInput,
  userId: string
): Promise<PaymentRow> {
  if (!payload.clinic_id) {
    throw new Error("Clínica não identificada.");
  }

  if (!payload.patient_id) {
    throw new Error("Paciente não identificado.");
  }

  if (!payload.amount || payload.amount <= 0) {
    throw new Error("Informe o valor.");
  }

  const supabase = createClient();

  const insertPayload: PaymentInsert = {
    clinic_id: payload.clinic_id,
    patient_id: payload.patient_id,
    appointment_id: payload.appointment_id ?? null,
    amount: payload.amount,
    status: "PENDING",
    payment_method: payload.payment_method ?? null,
    notes: payload.notes ?? null,
    created_by: userId,
  };

  const { data, error } = await supabase
    .from("payments")
    .insert(insertPayload)
    .select("*")
    .single();

  if (error) {
    throw serviceError(
      "Falha ao registrar pagamento",
      error,
      "payments.insert"
    );
  }

  await logAction(
    "create_payment",
    "payment",
    data.id,
    { amount: payload.amount },
    userId,
    { softFail: true }
  );

  return data;
}

export async function markAsPaid(
  paymentId: string,
  clinicId: string,
  paymentMethod: string,
  userId: string
): Promise<PaymentRow> {
  const supabase = createClient();
  const now = new Date().toISOString();

  const updatePayload: PaymentUpdate = {
    status: "PAID",
    paid_at: now,
    payment_method: paymentMethod,
    updated_at: now,
  };

  const { data, error } = await supabase
    .from("payments")
    .update(updatePayload)
    .eq("id", paymentId)
    .eq("clinic_id", clinicId)
    .eq("status", "PENDING")
    .select("*")
    .single();

  if (error) {
    throw serviceError(
      "Falha ao confirmar pagamento",
      error,
      "payments.markPaid"
    );
  }

  await logAction(
    "mark_payment_paid",
    "payment",
    paymentId,
    { payment_method: paymentMethod },
    userId,
    { softFail: true }
  );

  return data;
}

export async function getMonthSummary(clinicId: string): Promise<MonthSummary> {
  const supabase = createClient();
  const monthStart = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    1
  ).toISOString();

  const { data, error } = await supabase
    .from("payments")
    .select("amount, status")
    .eq("clinic_id", clinicId)
    .gte("created_at", monthStart);

  if (error) {
    throw serviceError(
      "Falha ao gerar resumo mensal",
      error,
      "payments.monthSummary"
    );
  }

  const payments: Array<Pick<PaymentRow, "amount" | "status">> = data ?? [];

  const paid = payments.filter((payment) => payment.status === "PAID");
  const pending = payments.filter((payment) => payment.status === "PENDING");

  return {
    totalRevenue: paid.reduce(
      (sum, payment) => sum + Number(payment.amount),
      0
    ),
    totalPending: pending.reduce(
      (sum, payment) => sum + Number(payment.amount),
      0
    ),
    paidCount: paid.length,
    pendingCount: pending.length,
  };
}
