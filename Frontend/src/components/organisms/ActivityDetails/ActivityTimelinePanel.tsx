import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Badge,
  Box,
  Button,
  Card,
  Flex,
  HStack,
  Icon,
  Text,
  VStack,
  Wrap,
  WrapItem,
  useColorModeValue,
} from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import useActivity from "@hooks/useActivity";
import useAuth from "@hooks/useAuth";
import IComment from "@interfaces/Comments";
import IUser from "@interfaces/User";
import CommentItem from "@components/atoms/CommentItem";
import {
  CommentComposerPanel,
  SystemCommentRow,
} from "./components/CommentsSection";
import { useActivityDetailCardProps } from "./useActivityDetailCardProps";
import {
  TimelineStepItem,
  TimelineStepMarker,
} from "./sections/TimelineStepItem";
import {
  buildSortedUnifiedTimelineEvents,
  type UnifiedTimelineEvent,
} from "@utils/buildActivityUnifiedTimelineEvents";
import { unifiedStepEventNeedsAttention } from "@utils/timelineFlowAttention";
import { objectIdToDate } from "@utils/objectIdTimestamp";
import { convertDateTime } from "@utils/date";
import { FaCommentDots, FaInfoCircle } from "react-icons/fa";
import { BsChevronDown } from "react-icons/bs";

type ViewFilter = "all" | "workflow" | "comments";

/** Número de eventos mais recentes visíveis quando a lista está colapsada. */
const TIMELINE_COLLAPSED_LIMIT = 5;

export interface ActivityTimelinePanelProps {
  hasWorkflow: boolean;
  comments: IComment[];
  activityId: string;
}

function formatStepTimeLabel(stepId: string, atMs: number): string {
  const fromOid = objectIdToDate(stepId);
  if (fromOid) return convertDateTime(fromOid);
  return convertDateTime(new Date(atMs));
}

const UnifiedTimelineEventRow: React.FC<{
  ev: UnifiedTimelineEvent;
  markerRing: string;
  cardBorder: string;
  cardBg: string;
}> = React.memo(({ ev, markerRing, cardBorder, cardBg }) => {
  const { t } = useTranslation();

  if (ev.kind === "step") {
    const draft = ev.workflow.workflow_draft.steps.find(
      (s) => s._id === ev.step.step
    );
    return (
      <Flex
        align="flex-start"
        gap={{ base: 3, md: 4 }}
        position="relative"
        zIndex={1}
      >
        <Flex
          flexShrink={0}
          w={{ base: "44px", md: "48px" }}
          justify="center"
          pt={1}
        >
          <Box
            bg={markerRing}
            borderRadius="full"
            p={0.5}
            boxShadow="sm"
          >
            <TimelineStepMarker step={draft} />
          </Box>
        </Flex>
        <Box flex={1} minW={0}>
          <HStack spacing={2} mb={2} flexWrap="wrap" align="center">
            <Badge colorScheme="blue" variant="subtle" fontSize="0.65rem">
              {t("activityDetails.unifiedTimeline.badgeFlow")}
            </Badge>
            <Text fontSize="xs" color="gray.500">
              {formatStepTimeLabel(ev.step._id, ev.at)}
            </Text>
          </HStack>
          <Box
            borderWidth="1px"
            borderColor={cardBorder}
            borderRadius="xl"
            bg={cardBg}
            boxShadow="sm"
            px={{ base: 3, md: 4 }}
            py={3}
          >
            <TimelineStepItem
              data={ev.step}
              step={draft}
              hideSideMarker
            />
          </Box>
        </Box>
      </Flex>
    );
  }

  const c = ev.comment;
  const isSystem = Boolean(c.isSystem);
  return (
    <Flex
      align="flex-start"
      gap={{ base: 3, md: 4 }}
      position="relative"
      zIndex={1}
    >
      <Flex
        flexShrink={0}
        w={{ base: "44px", md: "48px" }}
        justify="center"
        pt={1}
      >
        <Box
          bg={markerRing}
          borderRadius="full"
          p={2}
          boxShadow="sm"
          borderWidth={1}
          borderColor="gray.500"
          color={isSystem ? "blue.400" : "teal.500"}
        >
          <Icon
            as={isSystem ? FaInfoCircle : FaCommentDots}
            boxSize={5}
          />
        </Box>
      </Flex>
      <Box flex={1} minW={0}>
        <HStack spacing={2} mb={2} flexWrap="wrap" align="center">
          <Badge
            colorScheme={isSystem ? "purple" : "teal"}
            variant="subtle"
            fontSize="0.65rem"
          >
            {isSystem
              ? t("activityDetails.unifiedTimeline.badgeSystem")
              : t("activityDetails.unifiedTimeline.badgeComment")}
          </Badge>
          <Text fontSize="xs" color="gray.500">
            {convertDateTime(c.createdAt)}
          </Text>
        </HStack>
        <Box
          borderWidth="1px"
          borderColor={cardBorder}
          borderRadius="xl"
          overflow="hidden"
          bg={cardBg}
          boxShadow="sm"
        >
          {isSystem ? (
            <SystemCommentRow
              comment={
                c as IComment & {
                  user: Pick<
                    IUser,
                    "_id" | "name" | "email" | "photo_url"
                  >;
                }
              }
              hideTimestamp
            />
          ) : (
            <CommentItem
              comment={
                c as Omit<IComment, "user"> & {
                  user: Pick<
                    IUser,
                    "_id" | "name" | "email" | "photo_url"
                  >;
                }
              }
              hideTimestamp
            />
          )}
        </Box>
      </Box>
    </Flex>
  );
});

UnifiedTimelineEventRow.displayName = "UnifiedTimelineEventRow";

const ActivityTimelinePanel: React.FC<ActivityTimelinePanelProps> = ({
  hasWorkflow,
  comments,
  activityId,
}) => {
  const { t } = useTranslation();
  const { activity } = useActivity();
  const [auth] = useAuth();
  const userId = auth?.id;
  const [filter, setFilter] = useState<ViewFilter>("all");
  const [showAllEvents, setShowAllEvents] = useState(false);
  const detailCardProps = useActivityDetailCardProps();
  const scrollBorder = useColorModeValue("gray.200", "gray.600");
  const scrollBg = useColorModeValue("gray.50", "gray.900");
  const railColor = useColorModeValue("gray.300", "gray.600");
  const cardBorder = useColorModeValue("gray.200", "gray.700");
  const cardBg = useColorModeValue("white", "gray.800");
  const markerRing = useColorModeValue("white", "gray.900");

  const showComments = filter === "all" || filter === "comments";

  const allEvents = useMemo(
    () => buildSortedUnifiedTimelineEvents(activity, comments),
    [activity, comments]
  );

  const filteredEvents = useMemo(() => {
    if (filter === "all") return allEvents;
    if (filter === "workflow") {
      return allEvents.filter((e) => e.kind === "step");
    }
    return allEvents.filter((e) => e.kind === "comment");
  }, [allEvents, filter]);

  useEffect(() => {
    setShowAllEvents(false);
  }, [filter]);

  const eventsToRender = useMemo(() => {
    if (
      showAllEvents ||
      filteredEvents.length <= TIMELINE_COLLAPSED_LIMIT
    ) {
      return filteredEvents;
    }
    return filteredEvents.slice(-TIMELINE_COLLAPSED_LIMIT);
  }, [filteredEvents, showAllEvents]);

  const hiddenOlderCount =
    filteredEvents.length > TIMELINE_COLLAPSED_LIMIT
      ? filteredEvents.length - TIMELINE_COLLAPSED_LIMIT
      : 0;

  const hiddenEventsWhenCollapsed = useMemo(() => {
    if (
      showAllEvents ||
      filteredEvents.length <= TIMELINE_COLLAPSED_LIMIT
    ) {
      return [];
    }
    return filteredEvents.slice(
      0,
      filteredEvents.length - TIMELINE_COLLAPSED_LIMIT
    );
  }, [filteredEvents, showAllEvents]);

  const hasHiddenFlowAttention = useMemo(
    () =>
      hiddenEventsWhenCollapsed.some(
        (e) =>
          e.kind === "step" &&
          unifiedStepEventNeedsAttention(activity, e, userId)
      ),
    [hiddenEventsWhenCollapsed, activity, userId]
  );

  const hasAnyFlowAttention = useMemo(
    () =>
      allEvents.some(
        (e) =>
          e.kind === "step" &&
          unifiedStepEventNeedsAttention(activity, e, userId)
      ),
    [allEvents, activity, userId]
  );

  const showAttentionCommentsFilter =
    filter === "comments" && hasAnyFlowAttention;

  const attentionAlertKind = showAttentionCommentsFilter
    ? "commentsFilter"
    : hasHiddenFlowAttention
      ? "collapsedHidden"
      : null;

  const filterButtonProps = (value: ViewFilter) => ({
    size: "sm" as const,
    variant: (filter === value ? "solid" : "outline") as "solid" | "outline",
    colorScheme: "blue" as const,
    onClick: () => setFilter(value),
  });

  const emptyMessage = () => {
    if (filter === "workflow" && !hasWorkflow) {
      return t("activityDetails.unifiedTimeline.noWorkflow");
    }
    if (filter === "comments") {
      return t("activityDetails.comments.emptyTimeline");
    }
    return t("activityDetails.unifiedTimeline.emptyUnified");
  };

  return (
    <Card {...detailCardProps}>
      <Box p={6}>
        <Text fontSize="lg" fontWeight="bold" mb={2}>
          {t("activityDetails.unifiedTimeline.title")}
        </Text>
        <Text fontSize="sm" color="gray.500" mb={4}>
          {t("activityDetails.unifiedTimeline.subtitle")}
        </Text>

        <Text
          fontSize="xs"
          fontWeight="semibold"
          color="gray.500"
          mb={2}
          textTransform="uppercase"
          letterSpacing="wide"
        >
          {t("activityDetails.unifiedTimeline.filterLabel")}
        </Text>
        <Wrap spacing={2} mb={4}>
          <WrapItem>
            <Button {...filterButtonProps("all")}>
              {t("activityDetails.unifiedTimeline.filterAll")}
            </Button>
          </WrapItem>
          <WrapItem>
            <Button {...filterButtonProps("workflow")}>
              {t("activityDetails.unifiedTimeline.filterWorkflow")}
            </Button>
          </WrapItem>
          <WrapItem>
            <Button {...filterButtonProps("comments")}>
              {t("activityDetails.unifiedTimeline.filterComments")}
            </Button>
          </WrapItem>
        </Wrap>

        <Box
          borderWidth="1px"
          borderColor={scrollBorder}
          borderRadius="lg"
          bg={scrollBg}
          px={{ base: 3, md: 4 }}
          py={4}
        >
          {attentionAlertKind ? (
            <Alert
              status="warning"
              variant="subtle"
              borderRadius="md"
              mb={4}
            >
              <AlertIcon />
              <Box flex="1">
                <AlertTitle fontSize="sm">
                  {attentionAlertKind === "commentsFilter"
                    ? t(
                      "activityDetails.unifiedTimeline.pendingCommentsFilterTitle"
                    )
                    : t(
                      "activityDetails.unifiedTimeline.pendingHiddenTitle"
                    )}
                </AlertTitle>
                <AlertDescription fontSize="sm" display="block" mt={1}>
                  {attentionAlertKind === "commentsFilter"
                    ? t(
                      "activityDetails.unifiedTimeline.pendingCommentsFilterDescription"
                    )
                    : t(
                      "activityDetails.unifiedTimeline.pendingHiddenDescription",
                      { count: TIMELINE_COLLAPSED_LIMIT }
                    )}
                </AlertDescription>
              </Box>
            </Alert>
          ) : null}

          {filteredEvents.length === 0 ? (
            <Text
              textAlign="center"
              color="gray.500"
              fontSize="sm"
              py={10}
              px={2}
            >
              {emptyMessage()}
            </Text>
          ) : (
            <Box position="relative" pl={{ base: 2, md: 3 }}>
              <Box
                position="absolute"
                left={{ base: "21px", md: "25px" }}
                top={3}
                bottom={3}
                w="2px"
                bg={railColor}
                borderRadius="full"
                opacity={0.55}
                aria-hidden
              />

              {hiddenOlderCount > 0 ? (
                <Box pb={5}>
                  <Flex
                    align="center"
                    gap={2}
                    cursor="pointer"
                    _hover={{ opacity: 0.8 }}
                    onClick={() => setShowAllEvents(!showAllEvents)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setShowAllEvents(!showAllEvents);
                      }
                    }}
                  >
                    {showAllEvents ? (
                      <>
                        <BsChevronDown
                          size={16}
                          style={{ transform: "rotate(180deg)" }}
                        />
                        <Text fontSize="sm" fontWeight="medium">
                          {t("activityDetails.showLess")}
                        </Text>
                      </>
                    ) : (
                      <>
                        <BsChevronDown size={16} />
                        <Text fontSize="sm" fontWeight="medium">
                          {t("activityDetails.unifiedTimeline.showMoreOlder", {
                            count: hiddenOlderCount,
                          })}
                        </Text>
                      </>
                    )}
                  </Flex>
                </Box>
              ) : null}

              <VStack align="stretch" spacing={5}>
                {eventsToRender.map((ev) => (
                  <UnifiedTimelineEventRow
                    key={`${ev.kind}-${ev.id}`}
                    ev={ev}
                    markerRing={markerRing}
                    cardBorder={cardBorder}
                    cardBg={cardBg}
                  />
                ))}
              </VStack>
            </Box>
          )}

          {filteredEvents.some((e) => e.kind === "step") ? (
            <Text fontSize="xs" color="gray.500" mt={4} px={1}>
              {t("activityDetails.unifiedTimeline.stepTimeHint")}
            </Text>
          ) : null}
        </Box>

        {showComments ? (
          <Box mt={4}>
            <CommentComposerPanel activityId={activityId} />
          </Box>
        ) : null}
      </Box>
    </Card>
  );
};

export default ActivityTimelinePanel;
