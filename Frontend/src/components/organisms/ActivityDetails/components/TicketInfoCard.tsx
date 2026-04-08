import React from "react";
import {
  Box,
  Button,
  Card,
  Divider,
  Flex,
  Tag,
  Text,
  VStack,
  useColorModeValue,
} from "@chakra-ui/react";
import { convertDateTime } from "@utils/date";
import IActivity from "@interfaces/Activitiy";
import { useTranslation } from "react-i18next";
import UserDetails from "../sections/UserDetails";
import Can from "@components/atoms/Can";
import useAuth from "@hooks/useAuth";
import { useActivityDetailCardProps } from "../useActivityDetailCardProps";

interface TicketInfoCardProps {
  activity: IActivity;
  onAssignClick: () => void;
}

const TicketInfoCard: React.FC<TicketInfoCardProps> = ({
  activity,
  onAssignClick,
}) => {
  const { t } = useTranslation();
  const [auth] = useAuth();
  const detailCardProps = useActivityDetailCardProps();
  const dividerColor = useColorModeValue("gray.200", "whiteAlpha.200");
  const idWellBg = useColorModeValue("gray.50", "whiteAlpha.50");
  const idWellBorder = useColorModeValue("gray.200", "whiteAlpha.200");

  const assignee = activity.assignee ?? null;

  return (
    <Card {...detailCardProps}>
      <Box p={6}>
        <Text fontSize="lg" fontWeight="bold" mb={2}>
          {t("activityDetails.identification")}
        </Text>
        <Text fontSize="sm" color="gray.500" mb={4}>
          {t("activityDetails.identificationSubtitle")}
        </Text>

        <VStack spacing={0} align="stretch">
          <Box>
            <Text
              fontSize="xs"
              fontWeight="semibold"
              color="gray.500"
              textTransform="uppercase"
              letterSpacing="0.06em"
              mb={2}
            >
              {t("activityDetails.ticketId")}
            </Text>
            <Box
              borderRadius="md"
              borderWidth="1px"
              borderColor={idWellBorder}
              bg={idWellBg}
              px={3}
              py={2}
            >
              <Text
                fontSize="sm"
                fontFamily="mono"
                wordBreak="break-all"
                fontWeight="medium"
              >
                {activity._id}
              </Text>
            </Box>
          </Box>

          <Divider borderColor={dividerColor} my={4} />

          <Box>
            <Text
              fontSize="xs"
              fontWeight="semibold"
              color="gray.500"
              textTransform="uppercase"
              letterSpacing="0.06em"
              mb={2}
            >
              {t("activityDetails.assignee.title")}
            </Text>
            {assignee ? (
              <Flex align="center" gap={3} flexWrap="wrap">
                <UserDetails user={assignee} />
                <Can permission="activity.update">
                  <Button
                    size="xs"
                    variant="outline"
                    colorScheme="blue"
                    onClick={onAssignClick}
                    isDisabled={!auth?.id}
                  >
                    {t("activityDetails.actions.changeAssignee")}
                  </Button>
                </Can>
              </Flex>
            ) : (
              <Flex align="center" gap={3} flexWrap="wrap">
                <Tag colorScheme="orange" size="md">
                  {t("activityDetails.assignee.notAssigned")}
                </Tag>
                <Can permission="activity.update">
                  <Button
                    size="xs"
                    colorScheme="blue"
                    onClick={onAssignClick}
                    isDisabled={!auth?.id}
                  >
                    {t("activityDetails.actions.assignTicketMenu")}
                  </Button>
                </Can>
              </Flex>
            )}
          </Box>

          <Divider borderColor={dividerColor} my={4} />

          <Box>
            <Text
              fontSize="xs"
              fontWeight="semibold"
              color="gray.500"
              textTransform="uppercase"
              letterSpacing="0.06em"
              mb={2}
            >
              {t("activityDetails.lastUpdate")}
            </Text>
            <Text fontSize="sm" fontWeight="medium">
              {convertDateTime(activity.updatedAt)}
            </Text>
          </Box>
        </VStack>
      </Box>
    </Card>
  );
};

export default TicketInfoCard;
