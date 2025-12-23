import { Connection, ObjectId, Types } from "mongoose";
import ProjectRepository from "../repositories/Project";

/**
 * Interface for the where clause that might contain a project filter
 */
export interface WhereClauseWithProject {
  project?: string | ObjectId | { $in: (string | ObjectId | null)[] };
  [key: string]: any;
}

/**
 * Interface for the result of applying active projects filter
 */
export interface ActiveProjectsFilterResult {
  where: WhereClauseWithProject;
  activeProjectIds: (string | ObjectId)[];
}

/**
 * Fetches active projects and applies project filtering logic to a where clause.
 * 
 * This utility function centralizes the logic for handling active project filtering
 * across different API endpoints. It ensures that:
 * 1. Only active projects are considered (where active !== false)
 * 2. If a specific project is requested, it validates that the project is active
 * 3. If no project is specified, it filters by all active projects
 * 
 * @param conn - The database connection
 * @param where - The initial where clause (may contain a project filter)
 * @returns An object containing the modified where clause and list of active project IDs
 * 
 * @example
 * ```typescript
 * const where = { name: 'Example' };
 * const { where: filteredWhere, activeProjectIds } = 
 *   await applyActiveProjectsFilter(conn, where);
 * 
 * // Now filteredWhere includes: { name: 'Example', project: { $in: [activeIds...] } }
 * // activeProjectIds contains ObjectIds in their native format
 * ```
 * 
 * @example
 * ```typescript
 * const where = { project: someObjectId };
 * const { where: filteredWhere } = await applyActiveProjectsFilter(conn, where);
 * 
 * // If someObjectId is active, where.project remains unchanged
 * // If someObjectId is NOT active, where.project becomes { $in: [] }
 * ```
 */
export async function applyActiveProjectsFilter(
  conn: Connection,
  where: WhereClauseWithProject = {}
): Promise<ActiveProjectsFilterResult> {
  const projectRepository = new ProjectRepository(conn);

  // Fetch all active projects (where active is not explicitly false)
  const activeProjects = await projectRepository.find({
    where: { active: { $ne: false } },
    select: { _id: 1 },
  });

  // Extract project IDs in their native format
  const activeProjectIds = activeProjects.map(p => p._id);

  // Apply project filtering logic
  if (where.project) {
    // User specified a specific project filter
    const projectFilter = where.project;
    
    // Validate if the requested project is active
    // Compare IDs properly - ObjectIds use .equals(), strings use strict equality
    const isActiveProject = activeProjectIds.some(id => {
      // Handle ObjectId to ObjectId comparison
      if (id instanceof Types.ObjectId) {
        if (projectFilter instanceof Types.ObjectId) {
          return id.equals(projectFilter);
        }
        // ObjectId to string comparison
        if (typeof projectFilter === 'string') {
          return id.equals(projectFilter);
        }
      }
      // Handle string to string comparison
      if (typeof id === 'string' && typeof projectFilter === 'string') {
        return id === projectFilter;
      }
      // Fallback: direct equality
      return id === projectFilter;
    });
    
    if (!isActiveProject) {
      // Project is not active, return empty results by setting impossible filter
      where.project = { $in: [] };
    }
    // If project is active, leave where.project as is
  } else {
    // No specific project requested, filter by all active projects
    // Include null to maintain existing behavior for unassigned items
    where.project = { $in: [...activeProjectIds, null, undefined] };
  }

  return {
    where,
    activeProjectIds,
  };
}

