import {
  Breadcrumb as BreadcrumbChackra,
  BreadcrumbItem,
  BreadcrumbLink,
  Text,
} from "@chakra-ui/react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

const Breadcrumb = () => {
  const { t } = useTranslation();
  const params = useParams<{ project: string, workflow_id: string, form_id: string, status_id: string, email_id: string, schedule_id: string, id: string }>();
  const project = params.project;

  const pathname = window.location.pathname;
  const paths = pathname.split("/").filter(Boolean).filter(path => path !== "portal");

  const getCurrentRoute = () => {
    const routeTypes = ["workflow", "form", "status", "email", "schedule"];
    return paths.find(path => routeTypes.some(type => path.includes(type)));
  };

  const getRouteType = (path: string) => {
    if (path.includes("workflow")) return "workflow";
    if (path.includes("form")) return "form";
    if (path.includes("status")) return "status";
    if (path.includes("email")) return "email";
    if (path.includes("schedule")) return "schedule";
  };

  const getRouteId = (path: string) => {
    if (path.includes("workflow")) return params.workflow_id || params.id;
    if (path.includes("form")) return params.form_id || params.id;
    if (path.includes("status")) return params.status_id || params.id;
    if (path.includes("email")) return params.email_id || params.id;
    if (path.includes("schedule")) return params.schedule_id || params.id;
  };

  const isDraft = (path: string) => {
    if (path?.includes("draft")) return true;

    return false;
  };

  return (
    <BreadcrumbChackra separator=">" px={4}>
      {project && (
        <BreadcrumbItem>
          <BreadcrumbLink as={Link} to={`/portal/projects/${project}`}>
            <Text fontSize="sm">{t("projects.title")}</Text>
          </BreadcrumbLink>
        </BreadcrumbItem>
      )}

      {getCurrentRoute() && (
        <BreadcrumbItem>
          <BreadcrumbLink as={Link} to={`/portal/project/${project}/${getRouteType(getCurrentRoute()!)}/${getRouteId(getCurrentRoute()!)}`}>
            <Text fontSize="sm">{t(`${getRouteType(getCurrentRoute()!)}.title`)}</Text>
          </BreadcrumbLink>
        </BreadcrumbItem>
      )}

      {isDraft(getCurrentRoute()!) && (
        <BreadcrumbItem>
          <Text fontSize="sm">{t("workflow-draft.title")}</Text>
        </BreadcrumbItem>
      )}
    </BreadcrumbChackra>
  );
};

export default Breadcrumb;
