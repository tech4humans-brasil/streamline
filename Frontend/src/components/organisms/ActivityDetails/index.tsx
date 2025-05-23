import React, { memo, useEffect } from "react";
import { Box, Card, Flex, Grid, Spinner, VStack } from "@chakra-ui/react";
import IActivity from "@interfaces/Activitiy";
import useActivity from "@hooks/useActivity";
import { useQuery } from "@tanstack/react-query";
import { getActivity } from "@apis/activity";
import Accordion from "@components/atoms/Accordion";
import ExtraFields from "./sections/ExtraFields";
import Timeline from "./sections/Timeline";
import { useTranslation } from "react-i18next";

// Import new components
import ActivityHeader from "./components/ActivityHeader";
import TicketHeaderCard from "./components/TicketHeaderCard";
import CommentsSection from "./components/CommentsSection";
import TicketInfoCard from "./components/TicketInfoCard";
import RelatedTicketsCard from "./components/RelatedTicketsCard";

interface ActivityDetailsProps {
  activity?: IActivity;
  isLoading?: boolean;
}

const ActivityDetails: React.FC<ActivityDetailsProps> = memo(
  ({ activity }) => {
    const { alterActivity, removeActivity } = useActivity();
    const { t } = useTranslation();

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
          p={[0, 6]}
          borderRadius="2xl"
          minWidth={"60%"}
          boxShadow={"lg"}
          h="100%"
          bg="bg.card"
        >
          <Flex justify="center" align="center" h="100%">
            <Spinner />
          </Flex>
        </Card>
      );
    }

    if (!activity) return null;

    return (
      <Box w="90%" mx="auto" py={6} maxW="7xl">
        <ActivityHeader protocol={activity.protocol} />

        <Grid templateColumns={{ sm: "1fr", md: "2fr 1fr" }} gap={6} display={{ base: "block", md: "grid" }}>
          {/* Coluna principal */}
          <VStack spacing={6} align="stretch">
            <TicketHeaderCard activity={activity} />

            {/* Linha do tempo */}
            {activity.workflows.length > 0 && (
              <Card>
                <Box p={6}>
                  <Accordion.Container defaultIndex={[0]} allowToggle allowMultiple>
                    <Accordion.Item>
                      <Accordion.Button>{t('activityDetails.timeline')}</Accordion.Button>
                      <Accordion.Panel>
                        <Timeline />
                      </Accordion.Panel>
                    </Accordion.Item>
                  </Accordion.Container>
                </Box>
              </Card>
            )}

            <CommentsSection
              comments={activityData?.comments || []}
              activityId={activity._id}
            />
          </VStack>

          {/* Coluna lateral */}
          <VStack spacing={6} align="stretch" mt={{ base: 6, md: 0 }}>
            <TicketInfoCard activity={activity} />

            {/* Informações do formulário */}
            <Card >
              <Box p={6}>
                <Accordion.Container defaultIndex={[0]} allowToggle allowMultiple>
                  <Accordion.Item>
                    <Accordion.Button>{t('activityDetails.formFields')}</Accordion.Button>
                    <Accordion.Panel>
                      <ExtraFields fields={activity.form_draft.fields} />
                    </Accordion.Panel>
                  </Accordion.Item>
                </Accordion.Container>
              </Box>
            </Card>

            <RelatedTicketsCard parentId={activity.parent} />
          </VStack>
        </Grid>
      </Box>
    );
  }
);

export default ActivityDetails;
