import React, { memo, useEffect } from "react";
import {
  Box,
  Card,
  Flex,
  Grid,
  IconButton,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Spinner,
  Tooltip,
  VStack,
  useDisclosure,
} from "@chakra-ui/react";
import { FiMaximize2 } from "react-icons/fi";
import IActivity from "@interfaces/Activitiy";
import useActivity from "@hooks/useActivity";
import { useQuery } from "@tanstack/react-query";
import { getActivity } from "@apis/activity";
import Accordion from "@components/atoms/Accordion";
import ExtraFields from "./sections/ExtraFields";
import { useTranslation } from "react-i18next";

// Import new components
import ActivityHeader from "./components/ActivityHeader";
import TicketHeaderCard from "./components/TicketHeaderCard";
import ActivityTimelinePanel from "./ActivityTimelinePanel";
import TicketInfoCard from "./components/TicketInfoCard";
import RelatedTicketsCard from "./components/RelatedTicketsCard";
import AssignTicketModal from "./components/AssignTicketModal";
import { useActivityDetailCardProps } from "./useActivityDetailCardProps";

const ExpandFieldsButton = memo<{ onOpen: () => void }>(function ExpandFieldsButton({ onOpen }) {
  const { t } = useTranslation();
  return (
    <Tooltip label={t("activityDetails.extraFields.expandFullscreen")}>
      <IconButton
        aria-label={t("activityDetails.extraFields.expandFullscreen")}
        icon={<FiMaximize2 />}
        size="sm"
        variant="ghost"
        onClick={(e) => {
          e.stopPropagation();
          onOpen();
        }}
        mr={2}
      />
    </Tooltip>
  );
});
ExpandFieldsButton.displayName = "ExpandFieldsButton";

interface ActivityDetailsProps {
  activity?: IActivity;
  isLoading?: boolean;
}

const ActivityDetails: React.FC<ActivityDetailsProps> = memo(
  ({ activity }) => {
    const { alterActivity, removeActivity } = useActivity();
    const { t } = useTranslation();
    const {
      isOpen: isFieldsModalOpen,
      onOpen: onFieldsModalOpen,
      onClose: onFieldsModalClose,
    } = useDisclosure();
    const {
      isOpen: isAssignModalOpen,
      onOpen: onAssignModalOpen,
      onClose: onAssignModalClose,
    } = useDisclosure();
    const detailCardProps = useActivityDetailCardProps();

    const { data: activityData, isLoading: queryLoading } = useQuery({
      queryKey: ["activity", activity?._id || ""],
      queryFn: getActivity,
    });

    useEffect(() => {
      alterActivity(activity ?? null);

      return () => {
        removeActivity();
      };
    }, [activity, alterActivity, removeActivity]);

    if (queryLoading) {
      return (
        <Card
          {...detailCardProps}
          p={[0, 6]}
          minWidth={"60%"}
          h="100%"
        >
          <Flex justify="center" align="center" h="100%">
            <Spinner />
          </Flex>
        </Card>
      );
    }

    if (!activity) return null;

    const displayActivity = activityData ?? activity;

    return (
      <Box w="100%" maxW="8xl" mx="auto" px={{ base: 4, md: 6 }} py={6}>
        <ActivityHeader
          title={displayActivity.name}
          protocol={displayActivity.protocol}
        />

        <Grid
          templateColumns={{
            base: "1fr",
            lg: "1fr minmax(320px, 420px)",
            xl: "1fr minmax(360px, 480px)",
          }}
          gap={8}
          alignItems="start"
        >
          {/* Coluna principal */}
          <VStack spacing={8} align="stretch">
            <TicketHeaderCard
              activity={displayActivity}
              onAssignClick={onAssignModalOpen}
            />

            <ActivityTimelinePanel
              hasWorkflow={displayActivity.workflows.length > 0}
              comments={
                displayActivity.comments || activityData?.comments || []
              }
              activityId={displayActivity._id}
            />
          </VStack>

          {/* Coluna lateral */}
          <VStack spacing={8} align="stretch">
            <TicketInfoCard
              activity={displayActivity}
              onAssignClick={onAssignModalOpen}
            />

            {/* Informações do formulário */}
            <Card {...detailCardProps}>
              <Box p={6}>
                <Accordion.Container defaultIndex={[0]} allowToggle allowMultiple>
                  <Accordion.Item>
                    <Accordion.Button
                      rightElement={
                        displayActivity.form_draft.fields.length > 0 ? (
                          <ExpandFieldsButton onOpen={onFieldsModalOpen} />
                        ) : undefined
                      }
                    >
                      {t("activityDetails.formFields")}
                    </Accordion.Button>
                    <Accordion.Panel>
                      <ExtraFields fields={displayActivity.form_draft.fields} />
                    </Accordion.Panel>
                  </Accordion.Item>
                </Accordion.Container>
              </Box>
            </Card>

            <RelatedTicketsCard parentId={displayActivity.parent} />
          </VStack>
        </Grid>

        <AssignTicketModal
          activity={displayActivity}
          isOpen={isAssignModalOpen}
          onClose={onAssignModalClose}
        />

        <Modal
          isOpen={isFieldsModalOpen}
          onClose={onFieldsModalClose}
          size="6xl"
          isCentered
        >
          <ModalOverlay />
          <ModalContent maxH="90vh">
            <ModalHeader>{t("activityDetails.formFields")}</ModalHeader>
            <ModalCloseButton />
            <ModalBody overflowY="auto" pb={6} maxH="calc(90vh - 80px)">
              <ExtraFields fields={displayActivity.form_draft.fields} />
            </ModalBody>
          </ModalContent>
        </Modal>
      </Box>
    );
  }
);

export default ActivityDetails;
