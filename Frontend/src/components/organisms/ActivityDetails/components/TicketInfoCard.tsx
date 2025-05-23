import React from 'react';
import { Box, Card, Text, VStack } from '@chakra-ui/react';
import { convertDateTime } from '@utils/date';
import StatusTag from '@components/atoms/StatusTag';
import IActivity from '@interfaces/Activitiy';
import { useTranslation } from 'react-i18next';

interface TicketInfoCardProps {
  activity: IActivity;
}

const TicketInfoCard: React.FC<TicketInfoCardProps> = ({ activity }) => {
  const { t } = useTranslation();

  return (
    <Card>
      <Box p={6}>
        <Text fontSize="lg" fontWeight="bold" mb={4}>
          {t('activityDetails.information')}
        </Text>
        <VStack spacing={4} align="stretch">
          <Box>
            <Text fontSize="sm" fontWeight="medium" color="gray.500" mb={2}>
              {t('activityDetails.ticketId')}
            </Text>
            <Text fontSize="sm" fontFamily="mono">
              {activity._id}
            </Text>
          </Box>
          <Box>
            <Text fontSize="sm" fontWeight="medium" color="gray.500" mb={2}>
              {t('activityDetails.ticketProtocol')}
            </Text>
            <Text fontSize="sm" fontFamily="mono">
              {activity.protocol}
            </Text>
          </Box>
          <Box>
            <Text fontSize="sm" fontWeight="medium" color="gray.500" mb={2}>
              {t('activityDetails.status')}
            </Text>
            <StatusTag status={activity.status} />
          </Box>
          <Box>
            <Text fontSize="sm" fontWeight="medium" color="gray.500" mb={2}>
              {t('activityDetails.createdAt')}
            </Text>
            <Text fontSize="sm">{convertDateTime(activity.createdAt)}</Text>
          </Box>

          <Box>
            <Text fontSize="sm" fontWeight="medium" color="gray.500" mb={2}>
              {t('activityDetails.lastUpdate')}
            </Text>
            <Text fontSize="sm">{convertDateTime(activity.updatedAt)}</Text>
          </Box>
        </VStack>
      </Box >
    </Card >
  );
};

export default TicketInfoCard; 