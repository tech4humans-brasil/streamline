import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import ReactFlow, {
  Background,
  Connection,
  ConnectionMode,
  Controls,
  Edge,
  MarkerType,
  Node,
  ReactFlowInstance,
  ReactFlowJsonObject,
  addEdge,
  useEdgesState,
  useNodesState,
  useReactFlow,
  IsValidConnection,
} from "reactflow";
import "reactflow/dist/style.css";
import NodeTypes from "@components/atoms/Workflow/Nodes";
import EdgeTypes from "@components/atoms/Workflow/Edges";
import FlowPanel from "@components/molecules/Workflow/FlowPanel";
import FlowHeader from "@components/organisms/Workflow/FlowHeader";
import { createOrUpdateWorkflow, getWorkflowDraft } from "@apis/workflowDraft";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { Center, Spinner, useToast } from "@chakra-ui/react";
import { IStep, IWorkflowDraft } from "@interfaces/WorkflowDraft";
import { AxiosError } from "axios";
import { workflowSchema } from "@pages/Portal/WorkflowDraft/nodesSchema";
import { useTranslation } from "react-i18next";

const convertReactFlowObject = (
  reactFlowObject: ReactFlowJsonObject
): IWorkflowDraft["steps"] => {
  return reactFlowObject.nodes.map((node) => {
    const edges = reactFlowObject.edges.filter(
      (edge) => edge.source === node.id
    );

    const defaultSource = edges.find(
      (edge) => edge.sourceHandle === "default-source"
    )?.target;

    const alternativeSource = edges.find(
      (edge) => edge.sourceHandle === "alternative-source"
    )?.target;

    return {
      id: node.id,
      position: node.position,
      data: node.data,
      type: node.type,
      deletable: node?.deletable,
      next: {
        ["default-source"]: defaultSource ?? null,
        ["alternative-source"]: alternativeSource,
      },
    } as IStep;
  });
};

const initialNodes: Node[] = [
  {
    id: "start",
    position: { x: 0, y: 0 },
    data: {
      label: "Inicio",
      hasHandleRight: true,
      hasMenu: true,
      visible: false,
    },
    type: "circle",
    deletable: false,
  },
];
const initialEdges: Edge[] = [];

interface FlowBoardProps {
  isView?: boolean;
}

const FlowBoard: React.FC<FlowBoardProps> = memo(({ isView }) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const params = useParams<{ id?: string; workflow_id: string; project: string }>();
  const id = params?.id ?? "";
  const isEditing = !!id;
  const workflow_id = params.workflow_id ?? "";

  const { data: workflow, isLoading } = useQuery({
    queryKey: ["workflow", id],
    queryFn: getWorkflowDraft,
    enabled: isEditing,
  });

  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { setViewport } = useReactFlow();
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [reactFlowInstance, setReactFlowInstance] =
    useState<ReactFlowInstance | null>(null);
  const navigate = useNavigate();
  const toast = useToast();

  const { mutateAsync, isPending } = useMutation({
    mutationFn: createOrUpdateWorkflow,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["forms"] });
      toast({
        title: t(`workflowDraft.${isEditing ? "updated" : "created"}`),
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      navigate(`/portal/project/${params.project}/workflow-draft/${data.parent}/${data._id}/view`);
    },
    onError: (error: AxiosError<{ message: string; statusCode: number }>) => {
      console.log(error);
      toast({
        title: t("workflowDraft.error"),
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    },
  });

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onSave = useCallback(() => {
    if (reactFlowInstance) {
      const flow = reactFlowInstance.toObject();

      const formState = workflowSchema.safeParse(flow);


      if (!formState.success) {
        toast({
          title: t("workflowDraft.error"),
          description: t("workflowDraft.invalid"),
          status: "error",
          duration: 3000,
          isClosable: true,

        });
        console.error(formState);
        return;
      }

      const steps = convertReactFlowObject(flow);

      const data = {
        parent: workflow?.parent ?? workflow_id,
        steps,
        viewport: flow.viewport,
      };

      mutateAsync(data);
    }
  }, [reactFlowInstance, mutateAsync, workflow?.parent, workflow_id, toast]);

  const onRestore = useCallback(() => {
    const restoreFlow = async () => {
      if (workflow) {
        const { x = 0, y = 0, zoom = 1 } = workflow.viewport;
        setNodes(workflow.nodes || []);
        setEdges(workflow.edges || []);
        setViewport({ x, y, zoom });
      }
    };
    restoreFlow();
  }, [setNodes, setViewport, workflow, setEdges]);

  const onDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      const type = event.dataTransfer.getData("application/reactflow");

      if (typeof type === "undefined" || !type) {
        return;
      }

      const position = reactFlowInstance?.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      }) ?? { x: 0, y: 0 };

      setNodes((nodes) => [
        ...nodes,
        {
          id: crypto.randomUUID(),
          type,
          position: position,
          data: {},
        },
      ]);
    },
    [reactFlowInstance, setNodes]
  );

  const isValidConnection: IsValidConnection = useCallback(
    (connection) => {
      if (isView) return false;

      if (connection.source === connection.target) return false;

      return true;
    },
    [isView]
  );

  useEffect(() => {
    onRestore();
  }, [workflow, onRestore]);

  if (isLoading) {
    return (
      <Center h="100%">
        <Spinner />
      </Center>
    );
  }

  return (
    <div
      className="reactflow-wrapper"
      ref={reactFlowWrapper}
      style={{ height: "100%" }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
        nodeTypes={NodeTypes}
        edgeTypes={EdgeTypes}
        proOptions={{
          hideAttribution: true,
        }}
        connectionMode={ConnectionMode.Loose}
        defaultEdgeOptions={{
          type: "default",
          labelStyle: { fill: "#fff", fontWeight: 700 },
          markerEnd: {
            type: MarkerType.Arrow,
          },
        }}
        elementsSelectable={!isView}
        nodesConnectable={!isView}
        nodesDraggable={!isView}
        onDrop={onDrop}
        onInit={setReactFlowInstance}
        onDragOver={onDragOver}
        isValidConnection={isValidConnection}
      >

        <FlowHeader
          status={workflow?.status}
          {...{ isView, isPending, onSave }}
        />
        <Background color="#aaa" gap={16} size={1} />
        {!isView && (
          <>
            <Controls />
            <FlowPanel />
          </>
        )}
      </ReactFlow>
    </div>
  );
});

export default FlowBoard;
