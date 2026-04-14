import type { getMyActivitiesPendingInteractions } from "@apis/dashboard";

export type PendingInteractionListItem = Awaited<
  ReturnType<typeof getMyActivitiesPendingInteractions>
>[number];

function isOverdue(due: string | Date | null | undefined): boolean {
  if (!due) return false;
  return new Date(due).getTime() < Date.now();
}

/** Ordem dentro de uma coluna Kanban: atrasados primeiro, depois prazo, depois atualização. */
export function sortPendingInteractionsInColumn(
  items: PendingInteractionListItem[]
): PendingInteractionListItem[] {
  return [...items].sort((a, b) => {
    const aOver = isOverdue(a.due_date);
    const bOver = isOverdue(b.due_date);
    if (aOver !== bOver) return aOver ? -1 : 1;
    const ad = a.due_date ? new Date(a.due_date).getTime() : Infinity;
    const bd = b.due_date ? new Date(b.due_date).getTime() : Infinity;
    if (ad !== bd) return ad - bd;
    return (
      new Date(b.updatedAt ?? 0).getTime() -
      new Date(a.updatedAt ?? 0).getTime()
    );
  });
}

export function pendingInteractionMatchesFilters(
  item: PendingInteractionListItem,
  piStatus: string | null,
  piAssignee: string | null,
  piSearch: string | null
): boolean {
  if (piStatus && item.ticketStatus?._id !== piStatus) return false;
  if (piAssignee === "unassigned") {
    if (item.assignee?._id) return false;
  } else if (piAssignee && item.assignee?._id !== piAssignee) {
    return false;
  }
  if (piSearch?.trim()) {
    const q = piSearch.trim().toLowerCase();
    const hay = [item.protocol, item.name, item.description]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    if (!hay.includes(q)) return false;
  }
  return true;
}
