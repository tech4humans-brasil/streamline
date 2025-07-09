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
import { FaEye, FaPlusSquare, FaWpforms } from "react-icons/fa";
import { BiGitRepoForked, BiLogoJavascript, BiMailSend } from "react-icons/bi";
import useActivity from "@hooks/useActivity";
import IFormDraft, { IField } from "@interfaces/FormDraft";
import ExtraFields from "./ExtraFields";
import { BsArrowsFullscreen, BsSend } from "react-icons/bs";
import { RiWebhookLine } from "react-icons/ri";
import Accordion from "@components/atoms/Accordion";
import useAuth from "@hooks/useAuth";
import { Link, useNavigate } from "react-router-dom";
import AddInteractionUser from "./AddInteractionUser";
import { AiFillSignature } from "react-icons/ai";
import { ClicksignRequirements } from "@utils/clicksign";
import { convertDateTime } from "@utils/date";
import { useTranslation } from "react-i18next";

const statusMap = {
  idle: "activityDetails.timelineStatus.waitingResponse",
  finished: "activityDetails.timelineStatus.notSent",
  error: "activityDetails.timelineStatus.error",
  in_progress: "activityDetails.timelineStatus.inProgress",
  in_queue: "activityDetails.timelineStatus.inQueue",
};

interface MilestoneItemProps { }

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
  const { t } = useTranslation();

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
      case NodeTypes.NewTicket:
        return FaPlusSquare;
      case NodeTypes.Clicksign:
        return AiFillSignature;
      case NodeTypes.Script:
        return BiLogoJavascript;
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

  const documents = useMemo(() => {
    if (step?.type !== NodeTypes.Clicksign) {
      return null;
    }

    return activity?.documents.find((doc) => doc.activity_step_id === data._id)
      ?.documents;
  }, [activity?.documents, data._id, step?.type]);

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

  if (!step) return null;

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

        {data.data?.error && <Text fontSize="sm">{data.data?.error}</Text>}

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
                    {t('activityDetails.timelineStatus.sentResponse')}
                  </Button>
                ) : (
                  <Tag size="sm" variant="subtle" colorScheme="gray" mt="2">
                    {t(statusMap[answer.status])}
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
                      ? t('activityDetails.timelineStatus.unfilledResponses')
                      : t('activityDetails.timelineStatus.waitingResponses')}
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
                            {t('activityDetails.timelineStatus.sentResponse')}
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

            <AddInteractionUser interaction={interaction} />

            {interaction.dueDate && (
              <Tag size="sm" variant="subtle" colorScheme="gray" mt="2">
                {`${t('activityDetails.timelineStatus.dueDate')}${convertDateTime(interaction.dueDate)}`}
              </Tag>
            )}
          </Box>
        )}
        {step.type === NodeTypes.NewTicket && !!data.data?.new_ticket && (
          <Link to={`/portal/activity/${data.data.new_ticket}`}>
            <Button size="sm" mt="2" colorScheme="blue" rightIcon={<FaEye />}>
              {t('activityDetails.timelineStatus.accessTicket')}
            </Button>
          </Link>
        )}

        {documents && (
          <Box w="100%">
            {documents?.map((document) => (
              <>
                <Text fontWeight="bold">{document.name}</Text>
                <Flex gap={2} alignItems="center">
                  {document.users.map((signer) => (
                    <Box key={signer.id} p={2}>
                      <Text fontWeight="bold">{signer.name}</Text>
                      <Text fontSize={"sm"}>{signer.email}</Text>
                      <Tag size="sm" variant="subtle" colorScheme="gray" mt="2">
                        {ClicksignRequirements.find(
                          (req) => req.value === signer.role
                        )?.label || t('activityDetails.timelineStatus.signatory')}
                      </Tag>
                      <Divider my={2} />
                    </Box>
                  ))}
                </Flex>
                <Divider my={2} />
              </>
            ))}
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
    const { t } = useTranslation();

    const handleResponse = useCallback(() => {
      navigate(`/response/${slug}`, {
        state: {
          activity_id,
        },
      });
    }, [activity_id, slug]);

    if (auth?.id === answer.user._id && answer.status === "idle") {
      return (
        <>
          {answer.observation && (
            <>
              <Divider my={2} />
              <Text fontSize={"sm"}>{answer.observation}</Text>
            </>
          )}
          <Button
            size="sm"
            mt="2"
            colorScheme="blue"
            variant={"outline"}
            rightIcon={<BsSend />}
            onClick={handleResponse}
          >
            {t('activityDetails.timelineStatus.respond')}
          </Button>
        </>
      );
    }

    return (
      <Tag size="sm" variant="subtle" colorScheme="gray" mt="2">
        {t(statusMap[answer.status])}
      </Tag>
    );
  }
);
