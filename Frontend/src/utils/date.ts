export function convertDateTime(
  date?: string | null | Date,
  options: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "short",
    year: "numeric",
    minute: "2-digit",
    hour: "2-digit",
  },
  timeZone = "America/Sao_Paulo"
): string {
  if (!date) return "Sem data";

  try {
    const d = new Date(date);
    return Intl.DateTimeFormat("pt-BR", { ...options, timeZone }).format(d);
  } catch (error) {
    return date.toLocaleString();
  }
}
