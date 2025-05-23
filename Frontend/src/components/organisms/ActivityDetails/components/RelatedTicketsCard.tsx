import React from 'react';
import { Box, Card, IconButton, Text, VStack } from '@chakra-ui/react';
import { RiParentFill } from 'react-icons/ri';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface RelatedTicketsCardProps {
  parentId?: string;
}

const RelatedTicketsCard: React.FC<RelatedTicketsCardProps> = ({ parentId }) => {
  const { t } = useTranslation();

  return (
    <Card>
      <Box p={6}>
        <Text fontSize="lg" fontWeight="bold" mb={4}>
          {t('activityDetails.relatedTickets.title')}
        </Text>
        <VStack spacing={2} align="stretch">
          {parentId ? (
            <Link
              to={`/portal/activity/${parentId}`}
              title={t('activityDetails.relatedTickets.parentTicket')}
              style={{ textDecoration: "none" }}
            >
              <IconButton
                aria-label="Parent"
                icon={<RiParentFill />}
                title={t('activityDetails.relatedTickets.parentTicket')}
                size="sm"
                colorScheme="blue"
              />
            </Link>
          ) : (
            <Text fontSize="sm" color="gray.500" mb={2}>
              {t('activityDetails.relatedTickets.noRelated')}
            </Text>
          )}
        </VStack>
      </Box>
    </Card>
  );
};

export default RelatedTicketsCard; 