export function convertDateTime(date?: string | null | Date): string {
  if (!date) return "Sem data";

  try {
    const d = new Date(date);
    return Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      minute: "2-digit",
      hour: "2-digit",
    }).format(d);
  } catch (error) {
    return date.toLocaleString();
  }
}
