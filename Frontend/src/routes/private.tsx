import { RouteType } from ".";

import Portal from "@pages/Portal";
import Dashboard from "@pages/Portal/Dashboard";
import Workflows from "@pages/Portal/Workflows";
import Workflow from "@pages/Portal/Workflows/Workflow";
import WorkflowDraft from "@pages/Portal/WorkflowDraft";
import EmailsTemplate from "@pages/Portal/Emails";
import EmailTemplate from "@pages/Portal/Emails/Emails";
import Users from "@pages/Portal/Users";
import Institutes from "@pages/Portal/Institutes";
import Institute from "@pages/Portal/Institutes/Institute";
import User from "@pages/Portal/Users/User";
import Statuses from "@pages/Portal/Statuses";
import Status from "@pages/Portal/Statuses/Status";
import Forms from "@pages/Portal/Forms";
import Form from "@pages/Portal/Forms/Form";
import Response from "@pages/Response";
import FormDraft from "@pages/Portal/FormDrafts";
import Activity from "@pages/Portal/Activity";
import ActivityProcess from "@pages/Portal/ActivityCommit";
import EditResponse from "@pages/Edit";
import Activities from "@pages/Portal/Activities";
import FirstPage from "@pages/Welcome/Firstpage";
import SecondPage from "@pages/Welcome/SecondPage";
import Welcome from "@pages/Welcome";
import NewTickets from "@pages/Portal/NewTickets";
import NewTicket from "@pages/Portal/NewTickets/NewTicket";
import Projects from "@pages/Portal/Project";
import Project from "@pages/Portal/Project/Project";
import Schedules from "@pages/Portal/Schedules";
import Schedule from "@pages/Portal/Schedules/Schedule";

import Equipments from "@pages/Equipment/Equipments";
import Equipment from "@pages/Equipment/Equipments/Equipment";
import Allocations from "@pages/Equipment/Allocations";
import Admin from "@pages/Portal/Admin";

const routes: RouteType = [
  {
    path: "/portal",
    element: <Portal />,
    children: [
      {
        element: <Dashboard />,
        index: true,
      },
      {
        path: "/portal/project/:project/workflows",
        element: <Workflows />,
        permission: "workflow.view",
      },
      {
        path: "/portal/project/:project/workflow",
        element: <Workflow />,
        permission: "workflow.create",
      },
      {
        path: "/portal/project/:project/workflow/:id",
        element: <Workflow />,
        permission: "workflow.update",
      },
      {
        path: "/portal/project/:project/workflow-draft/:workflow_id/:id/view",
        element: <WorkflowDraft isView />,
        permission: "workflowDraft.view",
      },
      {
        path: "/portal/project/:project/workflow-draft/:workflow_id/:id/edit",
        element: <WorkflowDraft />,
        permission: "workflowDraft.create",
      },
      {
        path: "/portal/project/:project/workflow-draft/:workflow_id",
        element: <WorkflowDraft />,
        permission: "workflowDraft.create",
      },
      {
        path: "/portal/project/:project/emails",
        element: <EmailsTemplate />,
        permission: "email.view",
      },
      {
        path: "/portal/project/:project/email",
        element: <EmailTemplate />,
        permission: "email.create",
      },
      {
        path: "/portal/project/:project/email/:id",
        element: <EmailTemplate />,
        permission: "email.update",
      },
      {
        path: "/portal/users",
        element: <Users />,
        permission: "user.view",
      },
      {
        path: "/portal/user",
        element: <User />,
        permission: "user.create",
      },
      {
        path: "/portal/user/:id",
        element: <User />,
        permission: "user.update",
      },
      {
        path: "/portal/institutes",
        element: <Institutes />,
        permission: "institute.view",
      },
      {
        path: "/portal/institute",
        element: <Institute />,
        permission: "institute.create",
      },
      {
        path: "/portal/institute/:id",
        element: <Institute />,
        permission: "institute.update",
      },
      {
        path: "/portal/project/:project/statuses",
        element: <Statuses />,
        permission: "status.view",
      },
      {
        path: "/portal/project/:project/status",
        element: <Status />,
        permission: "status.create",
      },
      {
        path: "/portal/project/:project/status/:id",
        element: <Status />,
        permission: "status.update",
      },
      {
        path: "/portal/project/:project/forms",
        element: <Forms />,
        permission: "form.view",
      },
      {
        path: "/portal/project/:project/form",
        element: <Form />,
        permission: "form.create",
      },
      {
        path: "/portal/project/:project/form/:id",
        element: <Form />,
        permission: "form.update",
      },
      {
        path: "/portal/project/:project/form-draft/:form_id/:id?",
        element: <FormDraft />,
        permission: "formDraft.create",
      },
      {
        path: "/portal/activities",
        element: <Activities />,
        permission: "activity.view",
      },
      {
        path: "/portal/activity/:id",
        element: <Activity />,
        permission: "activity.read",
      },
      {
        path: "/portal/activity-process/:id",
        element: <ActivityProcess />,
        permission: "activity.committed",
      },
      {
        path: "/portal/new/:institute_id",
        element: <NewTicket />,
        permission: "activity.create",
      },
      {
        path: "/portal/new",
        element: <NewTickets />,
        permission: "activity.create",
      },
      {
        path: "/portal/projects/:project?",
        element: <Projects />,
        permission: "project.read",
      },
      {
        path: "/portal/project/:id",
        element: <Project />,
        permission: "project.update",
      },
      {
        path: "/portal/project",
        element: <Project />,
        permission: "project.create",
      },
      {
        path: "/portal/project/:project/schedules",
        element: <Schedules />,
        permission: "schedule.view",
      },
      {
        path: "/portal/project/:project/schedule/:id?",
        element: <Schedule />,
      },
      {
        path: "/portal/equipments",
        element: <Equipments />,
        permission: "equipment.view",
      },
      {
        path: "/portal/equipment/:id?",
        element: <Equipment />,
        permission: "equipment.create",
      },
      {
        path: "/portal/allocations/:id",
        element: <Allocations />,
        permission: "allocation.view",
      },
      {
        path: "/portal/admin",
        element: <Admin />,
        permission: "admin.view",
      },
    ],
  },
  {
    path: "/response/:slug",
    element: <Response />,
  },
  {
    path: "/welcome",
    element: <Welcome />,
    children: [
      {
        element: <FirstPage />,
        index: true,
      },
      {
        element: <SecondPage />,
        path: "/welcome/second-page",
      },
    ],
  },
  {
    path: "/response/:id/edit",
    element: <EditResponse />,
  },
];

export default routes;
