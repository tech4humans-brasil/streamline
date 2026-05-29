import { Connection } from "mongoose";
import FormRepository from "../repositories/Form";
import { IFormType } from "../models/client/Form";
import { IUserRoles } from "../models/client/User";
import { HttpHandler } from "../middlewares/http";

type ActivityListRequest = Parameters<HttpHandler>[1];

function intersectIds(visibility: string[], other: string[]): string[] {
  const otherSet = new Set(other.map(String));
  return visibility.filter((id) => otherSet.has(String(id)));
}

type ApplyResult = "empty" | "ok";

/**
 * Applies institute / project form visibility to list filters (`filters.form`).
 * Returns `empty` when the caller should return an empty list.
 */
export async function applyActivityListVisibility(
  conn: Connection,
  req: ActivityListRequest,
  filters: Record<string, string | boolean | number | undefined>,
  project?: string,
  formType?: IFormType
): Promise<ApplyResult> {
  const isAdmin = req.user.roles.includes(IUserRoles.admin);
  const formRepository = new FormRepository(conn);

  let visibilityFormIds: string[] | null = null;

  if (!isAdmin) {
    const visibilities = await formRepository.find({
      select: { _id: 1 },
      where: {
        visibilities: {
          $in: req.user.institutes.map((institute) => institute._id),
        },
      },
    });

    if (!visibilities.length) {
      return "empty";
    }

    visibilityFormIds = visibilities.map((v) => String(v._id));
  }

  if (project) {
    const formWhere: Record<string, unknown> = { project };
    if (formType) {
      formWhere.type = formType;
    }

    const projectForms = await formRepository.find({
      select: { _id: 1 },
      where: formWhere,
      limit: 5000,
    });

    const projectFormIds = projectForms.map((f) => String(f._id));

    if (!projectFormIds.length) {
      return "empty";
    }

    if (!isAdmin && visibilityFormIds) {
      const crossed = intersectIds(visibilityFormIds, projectFormIds);
      if (!crossed.length) {
        return "empty";
      }
      filters.form = crossed.join(",");
    } else if (isAdmin) {
      filters.form = projectFormIds.join(",");
    }
  } else if (!isAdmin && visibilityFormIds) {
    filters.form = visibilityFormIds.join(",");
  }

  return "ok";
}

export function buildActivityVisibilityWhere(
  filters: Record<string, string | boolean | number | undefined>
): Record<string, unknown> {
  const where: Record<string, unknown> = {};
  if (filters.form) {
    const ids = String(filters.form).split(",").filter(Boolean);
    if (ids.length) {
      where.form = { $in: ids };
    }
  }
  return where;
}
