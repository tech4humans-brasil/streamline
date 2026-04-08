import React from "react";
import { Box, Button, Card, Icon, Text, VStack } from "@chakra-ui/react";
import { RiParentFill } from "react-icons/ri";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useActivityDetailCardProps } from "../useActivityDetailCardProps";

interface RelatedTicketsCardProps {
  parentId?: string;
}

const RelatedTicketsCard: React.FC<RelatedTicketsCardProps> = ({ parentId }) => {
  const { t } = useTranslation();
  const detailCardProps = useActivityDetailCardProps();

  return (
    <Card {...detailCardProps}>
      <Box p={6}>
        <Text fontSize="lg" fontWeight="bold" mb={4}>
          {t("activityDetails.relatedTickets.title")}
        </Text>
        <VStack spacing={2} align="stretch">
          {parentId ? (
            <Button
              as={Link}
              to={`/portal/activity/${parentId}`}
              variant="ghost"
              justifyContent="flex-start"
              leftIcon={<Icon as={RiParentFill} boxSize={5} />}
              size="sm"
              h="auto"
              py={2}
              px={3}
              fontWeight="medium"
            >
              {t("activityDetails.relatedTickets.parentTicket")}
            </Button>
          ) : (
            <Text fontSize="sm" color="gray.500" mb={2}>
              {t("activityDetails.relatedTickets.noRelated")}
            </Text>
          )}
        </VStack>
      </Box>
    </Card>
  );
};

export default RelatedTicketsCard;
