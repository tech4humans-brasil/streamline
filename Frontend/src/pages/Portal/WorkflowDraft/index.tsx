import FlowBoard from "@components/organisms/Workflow/FlowBoard";
import FlowDrawer from "@components/organisms/Workflow/FlowDrawer";
import DrawerContext from "@contexts/DrawerContext";
import { ReactFlowProvider } from "reactflow";

interface WorkflowDraftProps {
  readonly isView?: boolean;
}

export default function WorkflowDraft({ isView }: WorkflowDraftProps) {
  return (
    <div style={{ height: "100%", width: "100%" }}>
      <ReactFlowProvider>
        <DrawerContext>
          <FlowBoard isView={isView} />
          <FlowDrawer />
        </DrawerContext>
      </ReactFlowProvider>
    </div>
  );
}
