import {
  Box,
  Button,
  Circle,
  Divider,
  Flex,
  Tag,
  Text,
  Tooltip,
  VStack,
} from "@chakra-ui/react";
import IActivity, {
  IActivityInteractions,
  IActivityStep,
  IActivityStepStatus,
} from "@interfaces/Activitiy";
import { IStep, NodeTypes } from "@interfaces/WorkflowDraft";
import React, { memo, useCallback, useMemo } from "react";
import { GoMilestone, GoTag, GoWorkflow } from "react-icons/go";
import { FaEye, FaPlusSquare, FaWpforms } from "react-icons/fa";
import {
  BiGitRepoForked,
  BiLogoJavascript,
  BiMailSend,
  BiTime,
} from "react-icons/bi";
import useActivity from "@hooks/useActivity";
import ExtraFields from "./ExtraFields";
import { BsExclamationTriangle, BsSend } from "react-icons/bs";
import { RiWebhookLine } from "react-icons/ri";
import useAuth from "@hooks/useAuth";
import { Link, useNavigate } from "react-router-dom";
import AddInteractionUser from "./AddInteractionUser";
import { AiFillSignature } from "react-icons/ai";
import { ClicksignRequirements } from "@utils/clicksign";
import { convertDateTime } from "@utils/date";
import { useTranslation } from "react-i18next";
import type { IconType } from "react-icons";

const statusMap = {
  idle: "activityDetails.timelineStatus.waitingResponse",
  finished: "activityDetails.timelineStatus.notSent",
  error: "activityDetails.timelineStatus.error",
  in_progress: "activityDetails.timelineStatus.inProgress",
  in_queue: "activityDetails.timelineStatus.inQueue",
} as const;

function useStepIconAndColor(step: IStep | undefined): {
  Icon: IconType;
  color: string;
} {
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
      case NodeTypes.Delay:
        return BiTime;
      default:
        return FaWpforms;
    }
  }, [step?.type]);

  const color = useMemo(() => {
    switch (step?.type) {
      case NodeTypes.Interaction:
        return "yellow";
      case NodeTypes.SendEmail:
        return "blue";
      case NodeTypes.ChangeStatus:
        return "orange";
      case NodeTypes.SwapWorkflow:
        return "cyan";
      case NodeTypes.Conditional:
        return "purple";
      case NodeTypes.WebRequest:
        return "green";
      case NodeTypes.Circle:
        return "gray";
      case NodeTypes.NewTicket:
        return "red";
      case NodeTypes.Clicksign:
        return "pink";
      case NodeTypes.Script:
        return "purple";
      case NodeTypes.Delay:
        return "teal";
      default:
        return "gray";
    }
  }, [step?.type]);

  return { Icon, color };
}

export const TimelineStepMarker: React.FC<{ step: IStep | undefined }> = ({
  step,
}) => {
  const { Icon, color } = useStepIconAndColor(step);
  return (
    <Circle
      p={2}
      boxShadow="sm"
      borderWidth={1}
      bg="bg.card"
      borderColor="gray.500"
      color={`${color}.500`}
    >
      <Icon size={22} />
    </Circle>
  );
};

export const TimelineStepItem: React.FC<{
  data: IActivityStep;
  step: IStep | undefined;
  /** When true, only the body is rendered (parent draws rail + marker). */
  hideSideMarker?: boolean;
}> = ({ data, step, hideSideMarker }) => {
  const { activity } = useActivity();
  const interactions = activity?.interactions;
  const { t } = useTranslation();
  const { Icon, color } = useStepIconAndColor(step);

  const interaction = useMemo(() => {
    if (step?.type === NodeTypes.Interaction) {
      return interactions?.find(
        (i) => i.activity_step_id === data._id
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

  if (!step) return null;

  const body = (
    <Box ml={hideSideMarker ? 0 : 4}>
      <VStack align="stretch" spacing={3} mt={hideSideMarker ? 0 : 2}>
        <Box>
          <Text fontSize="md" fontWeight="bold" mb={1}>
            {step.data?.name}
          </Text>
          <Text fontSize="sm">
            {getStepDescription(step, interaction || null)}
          </Text>
        </Box>

        {data.data?.error && (
          <Text fontSize="sm" color="red.500">
            {data.data?.error}
          </Text>
        )}

        {interaction && (
          <InteractionContent
            interaction={interaction}
            activity={activity}
          />
        )}

        {step.type === NodeTypes.NewTicket && !!data.data?.new_ticket && (
          <Link to={`/portal/activity/${data.data.new_ticket}`}>
            <Button size="sm" colorScheme="blue" rightIcon={<FaEye />}>
              {t("activityDetails.timelineStatus.accessTicket")}
            </Button>
          </Link>
        )}
        {documents && <DocumentsContent documents={documents} t={t} />}
        {data.status === IActivityStepStatus.error && (
          <Text fontSize="sm" color="red.500">
            {t("activityDetails.timelineStatus.errorMessage")}
          </Text>
        )}
      </VStack>
    </Box>
  );

  if (hideSideMarker) {
    return (
      <Box opacity={data.status === IActivityStepStatus.inQueue ? 0.5 : 1}>
        {body}
      </Box>
    );
  }

  return (
    <Box
      position="relative"
      opacity={data.status === IActivityStepStatus.inQueue ? 0.5 : 1}
    >
      <Box position="absolute" left="-9" top={2} zIndex={1}>
        <Circle
          p={2}
          boxShadow="sm"
          borderWidth={1}
          bg="bg.card"
          borderColor="gray.500"
          color={`${color}.500`}
        >
          <Icon size={22} />
        </Circle>
      </Box>
      {body}
    </Box>
  );
};

function getStepDescription(
  step: IStep,
  interaction: IActivityInteractions | null
): string {
  switch (step.type) {
    case NodeTypes.Interaction:
      return interaction?.form?.name || "Interação solicitada";
    case NodeTypes.SendEmail:
      return "Email enviado";
    case NodeTypes.ChangeStatus:
      return "Status alterado";
    case NodeTypes.NewTicket:
      return "Novo ticket criado";
    case NodeTypes.Clicksign:
      return "Documento para assinatura";
    case NodeTypes.Delay:
      return "Aguardando temporizador";
    default:
      return step.data?.name || "Ação executada";
  }
}

const InteractionContent = ({
  interaction,
  activity,
}: {
  interaction: IActivityInteractions;
  activity: IActivity | null;
}) => {
  const { t } = useTranslation();
  const [auth] = useAuth();

  const { open, closed } = useMemo(() => {
    const open = interaction.answers.filter((answer) => answer.data);
    const closed = interaction.answers.filter((answer) => !answer.data);
    return { open, closed };
  }, [interaction]);

  const myPendingAnswers = useMemo(() => {
    return closed.filter((answer) => answer.user._id === auth?.id);
  }, [closed, auth?.id]);

  const otherPendingAnswers = useMemo(() => {
    return closed.filter((answer) => answer.user._id !== auth?.id);
  }, [closed, auth?.id]);

  const pendingPeopleTooltip = useMemo(() => {
    if (otherPendingAnswers.length === 0) return "";
    const peopleList = otherPendingAnswers
      .map((answer) => answer.user.name)
      .join(", ");
    return `${t("activityDetails.timelineStatus.waitingResponses")}: ${peopleList}`;
  }, [otherPendingAnswers, t]);

  return (
    <VStack align="stretch" spacing={3} maxW="300px">
      {open?.map((answer, index) => (
        <Box
          key={answer._id}
          borderColor="bg.page"
          borderRadius="md"
          p={2}
          borderWidth={2}
        >
          <Text fontWeight="bold">{answer.user.name}</Text>
          <Text fontSize="sm">{answer.user.email}</Text>
          {answer?.data ? (
            <Box p={2}>
              <Text fontSize="xs" color="gray.500" as="span">
                {t("activityDetails.timelineStatus.sentResponse")}
              </Text>
              <ExtraFields fields={answer.data.fields} />
              <Text fontSize="xs" color="gray.500" as="span">
                {answer.responseAt && convertDateTime(answer.responseAt)}
              </Text>
            </Box>
          ) : (
            <Tag size="sm" variant="subtle" colorScheme="gray" mt="2">
              {t(statusMap[answer.status])}
            </Tag>
          )}

          {index !== open.length - 1 && <Divider my={2} />}
        </Box>
      ))}

      {myPendingAnswers.map((answer) => (
        <Box key={answer._id} p={0} borderRadius="md">
          <Flex align="center" gap={2}>
            <Text fontWeight="bold" fontSize="md">
              {answer.user.name}
            </Text>
            <BsExclamationTriangle color="#F6AD55" size={18} />
          </Flex>
          <Text fontSize="xs" mb={2}>
            {answer.user.email}
          </Text>
          <PendencieTag
            answer={answer}
            activity_id={activity?._id}
            slug={interaction.form.slug}
          />
        </Box>
      ))}

      {otherPendingAnswers.length > 0 && (
        <Tooltip label={pendingPeopleTooltip} placement="top">
          <Box>
            <Tag size="sm" variant="subtle" colorScheme="orange">
              {t("activityDetails.timelineStatus.waitingResponses")} (
              {otherPendingAnswers.length})
            </Tag>
          </Box>
        </Tooltip>
      )}

      <AddInteractionUser interaction={interaction} />

      {interaction.dueDate && !interaction.finished && (
        <Tag size="sm" variant="subtle" colorScheme="gray" w="fit-content">
          {`${t("activityDetails.timelineStatus.dueDate")}${convertDateTime(interaction.dueDate)}`}
        </Tag>
      )}
    </VStack>
  );
};

const DocumentsContent = ({
  documents,
  t,
}: {
  documents: Array<{
    id: string;
    name: string;
    users: Array<{
      id: string;
      name: string;
      email: string;
      role: string;
    }>;
  }>;
  t: (key: string) => string;
}) => {
  return (
    <VStack align="stretch" spacing={3}>
      {documents?.map((document) => (
        <Box key={document.id}>
          <Text fontWeight="bold" fontSize="sm" mb={2}>
            {document.name}
          </Text>
          <VStack align="stretch" spacing={2}>
            {document.users.map((signer) => (
              <Box key={signer.id} p={0} borderRadius="md">
                <Text fontWeight="bold" fontSize="sm">
                  {signer.name}
                </Text>
                <Text fontSize="xs" color="gray.600" mb={2}>
                  {signer.email}
                </Text>
                <Tag size="sm" variant="subtle" colorScheme="gray">
                  {ClicksignRequirements.find((req) => req.value === signer.role)
                    ?.label || t("activityDetails.timelineStatus.signatory")}
                </Tag>
              </Box>
            ))}
          </VStack>
        </Box>
      ))}
    </VStack>
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
    }, [activity_id, slug, navigate]);

    if (auth?.id === answer.user._id && answer.status === "idle") {
      return (
        <VStack align="stretch" spacing={2}>
          {answer.observation && (
            <Text fontSize="sm" color="gray.600">
              {answer.observation}
            </Text>
          )}
          <Button
            size="sm"
            colorScheme="red"
            variant="outline"
            rightIcon={<BsSend />}
            onClick={handleResponse}
          >
            {t("activityDetails.timelineStatus.respond")}
          </Button>
        </VStack>
      );
    }

    return (
      <Tooltip label={t("activityDetails.timelineStatus.pendingResponse")}>
        <Tag size="sm" variant="subtle" colorScheme="gray">
          {t(statusMap[answer.status])}
        </Tag>
      </Tooltip>
    );
  }
);
