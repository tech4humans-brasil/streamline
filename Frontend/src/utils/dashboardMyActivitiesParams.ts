/**
 * Parâmetros de URL que afetam GET /dashboard/my-activities.
 * Exclui prefixo `pi*` (interações pendentes) e outras chaves partilhadas na mesma rota.
 */
const MY_ACTIVITIES_KEYS = [
  "page",
  "limit",
  "finished",
  "assignedToMe",
  "search",
  "automatic",
  "form",
] as const;

/**
 * Query string estável só com filtros de «Meus Tickets» — para cache React Query e pedidos à API.
 */
export function serializeDashboardMyActivitiesParams(
  searchParams: URLSearchParams
): string {
  const next = new URLSearchParams();
  for (const key of MY_ACTIVITIES_KEYS) {
    for (const value of searchParams.getAll(key)) {
      if (value !== "") {
        next.append(key, value);
      }
    }
  }
  return next.toString();
}
