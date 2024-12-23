import {
  Box,
  Button,
  Divider,
  Flex,
  Modal,
  ModalCloseButton,
  ModalContent,
  ModalOverlay,
  Tag,
  Text,
  useDisclosure,
} from "@chakra-ui/react";
import { MilestoneEnd, MilestoneItem } from "@components/molecules/TimeLine";
import IActivity, {
  IActivityStep,
  IActivityInteractions,
} from "@interfaces/Activitiy";
import { IStep, NodeTypes } from "@interfaces/WorkflowDraft";
import React, { memo, useCallback, useMemo, useState } from "react";
import { GoMilestone, GoTag, GoWorkflow } from "react-icons/go";
import { FaWpforms } from "react-icons/fa";
import { BiGitRepoForked, BiMailSend } from "react-icons/bi";
import useActivity from "@hooks/useActivity";
import IFormDraft, { IField } from "@interfaces/FormDraft";
import ExtraFields from "./ExtraFields";
import { BsArrowsFullscreen, BsSend } from "react-icons/bs";
import { RiWebhookLine } from "react-icons/ri";
import Accordion from "@components/atoms/Accordion";
import useAuth from "@hooks/useAuth";
import { Link, useNavigate } from "react-router-dom";

const statusMap = {
  idle: "Aguardando Resposta",
  finished: "Não Enviada",
  error: "Erro",
  in_progress: "Em Progresso",
  in_queue: "Em Fila",
};

interface MilestoneItemProps {}

const Timeline: React.FC<MilestoneItemProps> = () => {
  const { activity } = useActivity();
  const [modalData, setModalData] = useState<IField[] | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();

  const workflows = activity?.workflows;

  const handleOpenModal = useCallback(
    (data: IField[]) => {
      setModalData(data);
      onOpen();
    },
    [onOpen]
  );

  return (
    <Box>
      {workflows?.map((workflow) => (
        <TimelineWorkflowItem
          key={workflow._id}
          {...{ workflow, handleOpenModal }}
        />
      ))}
      <MilestoneEnd />

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent p="5">
          <ModalCloseButton />

          <ExtraFields fields={modalData || []} />
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default Timeline;

const TimelineWorkflowItem = ({
  workflow,
  handleOpenModal,
}: {
  workflow: IActivity["workflows"][0];
  handleOpenModal: (data: IField[]) => void;
}) => {
  const getStep = useCallback(
    (stepId: string) => {
      return workflow.workflow_draft.steps.find((step) => step._id === stepId);
    },
    [workflow.workflow_draft.steps]
  );

  return (
    <div>
      {workflow?.steps?.map((step) => (
        <TimelineStepItem
          key={step._id}
          data={step}
          step={getStep(step.step)}
          handleOpenModal={handleOpenModal}
        />
      ))}
    </div>
  );
};

const TimelineStepItem = ({
  data,
  step,
  handleOpenModal,
}: {
  step: IStep | undefined;
  data: IActivityStep;
  handleOpenModal: (data: IField[]) => void;
}) => {
  const { activity } = useActivity();
  const interactions = activity?.interactions;

  const Icon = useMemo(() => {
    switch (step?.type) {
      case NodeTypes.Interaction:
        return FaWpforms;
      case NodeTypes.SendEmail:
        return BiMailSend;
      case NodeTypes.ChangeStatus:
        return GoTag;
      case NodeTypes.SwapWorkflow:
        return GoWorkflow;
      case NodeTypes.Conditional:
        return BiGitRepoForked;
      case NodeTypes.WebRequest:
        return RiWebhookLine;
      case NodeTypes.Circle:
        return GoMilestone;
      default:
        return FaWpforms;
    }
  }, [step?.type]);

  const interaction = useMemo(() => {
    if (step?.type === NodeTypes.Interaction) {
      return interactions?.find(
        (interaction) => interaction.activity_step_id === data._id
      );
    }

    return null;
  }, [data._id, step?.type, interactions]);

  const handleOpenModalItem = useCallback(
    (data: IFormDraft | null) => {
      const fields = data?.fields;
      if (!fields?.length) {
        return;
      }

      handleOpenModal(fields);
    },
    [handleOpenModal]
  );

  const { open, closed } = useMemo(() => {
    const open = interaction?.answers.filter((answer) => answer.data);
    const closed = interaction?.answers.filter((answer) => !answer.data);

    return { open, closed };
  }, [interaction]);

  if (!step || !step?.data.visible) return null;

  return (
    <MilestoneItem key={step._id} isStep status={data.status}>
      <Flex
        gap={2}
        px={4}
        py={3}
        borderRadius="lg"
        alignItems="start"
        direction="column"
        borderWidth={1}
        bg={"bg.card"}
        borderColor={"bg.border"}
      >
        <Flex direction="row" alignItems="center" gap={2}>
          <Icon size={20} />
          <Text fontSize="md" fontWeight={"bold"}>
            {step.data?.name}
          </Text>
        </Flex>
        <Divider my={2} />
        {interaction && (
          <Box w="100%">
            {open?.map((answer) => (
              <Box key={answer._id} p={2}>
                <Text fontWeight="bold">{answer.user.name}</Text>
                <Text fontSize={"sm"}>{answer.user.email}</Text>
                {answer?.data ? (
                  <Button
                    size="sm"
                    mt="1"
                    onClick={() => handleOpenModalItem(answer.data)}
                    variant={"outline"}
                    leftIcon={<BsArrowsFullscreen />}
                  >
                    Resposta Enviada
                  </Button>
                ) : (
                  <Tag size="sm" variant="subtle" colorScheme="gray" mt="2">
                    {statusMap[answer.status]}
                  </Tag>
                )}
                <Divider my={2} />
              </Box>
            ))}

            {!!closed?.length && (
              <Accordion.Container
                defaultIndex={interaction.finished ? [] : [0]}
                allowToggle
                allowMultiple
              >
                <Accordion.Item>
                  <Accordion.Button fontSize="sm">
                    {interaction.finished
                      ? "Respostas não enviadas"
                      : "Aguardando Respostas"}
                  </Accordion.Button>
                  <Accordion.Panel>
                    {closed.map((answer) => (
                      <Box key={answer._id}>
                        <Text fontWeight="bold">{answer.user.name}</Text>
                        <Text fontSize={"sm"}>{answer.user.email}</Text>
                        {answer?.data ? (
                          <Button
                            size="sm"
                            mt="1"
                            onClick={() => handleOpenModalItem(answer.data)}
                            variant={"outline"}
                            leftIcon={<BsArrowsFullscreen />}
                          >
                            Resposta Enviada
                          </Button>
                        ) : (
                          <PendencieTag
                            answer={answer}
                            activity_id={activity?._id}
                            slug={interaction.form.slug}
                          />
                        )}
                        <Divider my={2} />
                      </Box>
                    ))}
                  </Accordion.Panel>
                </Accordion.Item>
              </Accordion.Container>
            )}
          </Box>
        )}
      </Flex>
    </MilestoneItem>
  );
};

const PendencieTag = memo(
  ({
    answer,
    slug,
    activity_id,
  }: {
    answer: IActivityInteractions["answers"][0];
    slug: string;
    activity_id: string | undefined;
  }) => {
    const [auth] = useAuth();
    const navigate = useNavigate();

    const handleResponse = useCallback(() => {
      navigate(`/response/${slug}`, {
        state: {
          activity_id,
        },
      });
    }, [activity_id, slug]);

    if (auth?.id === answer.user._id && answer.status === "idle") {
      return (
        <Button
          size="sm"
          mt="2"
          colorScheme="blue"
          variant={"outline"}
          rightIcon={<BsSend />}
          onClick={handleResponse}
        >
          Responder
        </Button>
      );
    }

    return (
      <Tag size="sm" variant="subtle" colorScheme="gray" mt="2">
        {statusMap[answer.status]}
      </Tag>
    );
  }
);
