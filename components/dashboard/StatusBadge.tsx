import {
  LEAD_STATUS_LABEL,
  APPOINTMENT_STATUS_LABEL,
  PATIENT_STATUS_LABEL,
} from "@/lib/status";

type Props = {
  status: string;
  type?: "lead" | "appointment" | "patient";
};

const colors: Record<string, string> = {
  // Lead
  NEW: "bg-blue-100 text-blue-700",
  CONTACTED: "bg-yellow-100 text-yellow-700",
  QUALIFIED: "bg-purple-100 text-purple-700",
  CONVERTED: "bg-green-100 text-green-700",
  LOST: "bg-gray-100 text-gray-500",

  // Appointment
  SCHEDULED: "bg-blue-100 text-blue-700",
  CONFIRMED: "bg-indigo-100 text-indigo-700",
  IN_PROGRESS: "bg-yellow-100 text-yellow-700",
  COMPLETED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
  NO_SHOW: "bg-orange-100 text-orange-700",

  // Patient
  ACTIVE: "bg-green-100 text-green-700",
  INACTIVE: "bg-gray-100 text-gray-500",
};

export default function StatusBadge({ status, type = "lead" }: Props) {
  const normalized = String(status ?? "")
    .trim()
    .toUpperCase();

  const labelMap =
    type === "lead"
      ? LEAD_STATUS_LABEL
      : type === "appointment"
      ? APPOINTMENT_STATUS_LABEL
      : PATIENT_STATUS_LABEL;

  const label = (labelMap as Record<string, string>)[normalized] ?? status;

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
        colors[normalized] ?? "bg-gray-100 text-gray-700"
      }`}
    >
      {label}
    </span>
  );
}
