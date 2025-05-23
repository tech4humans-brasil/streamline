import React from 'react';
import { Box, Card, Divider, Flex, Text, VStack } from '@chakra-ui/react';
import { convertDateTime } from '@utils/date';
import UserDetails from '../sections/UserDetails';
import IActivity from '@interfaces/Activitiy';
import StatusTag from '@components/atoms/StatusTag';
import { useTranslation } from 'react-i18next';

interface TicketHeaderCardProps {
  activity: IActivity;
}

const TicketHeaderCard: React.FC<TicketHeaderCardProps> = ({ activity }) => {
  const { t } = useTranslation();

  return (
    <Card>
      <Box p={6}>
        <Flex justify="space-between" align="start">
          <Box>
            <Text fontSize="xl" fontWeight="bold">
              {activity.name}
            </Text>
          </Box>
          <StatusTag status={activity.status} size="lg" />
          {/* <Menu>
            <MenuButton as={Button} variant="outline">
              Ações
            </MenuButton>
            <MenuList>
              <MenuItem>Atualizar Status</MenuItem>
              <MenuItem>Alterar Prioridade</MenuItem>
              <MenuItem>Atribuir a Outro Usuário</MenuItem>
              <MenuItem>Adicionar ao Fluxo</MenuItem>
              <MenuItem color="red.500">Fechar Ticket</MenuItem>
            </MenuList>
          </Menu> */}
        </Flex>
      </Box>
      <Divider />
      <Box p={6}>
        <VStack spacing={4} align="stretch">
          <Box>
            <Text fontSize="sm" fontWeight="medium" color="gray.500" mb={2}>
              {t('activityDetails.description')}
            </Text>
            <Text fontSize="sm">
              {activity.description || t('activityDetails.noDescription')}
            </Text>
          </Box>

          <Box>
            <Text fontSize="sm" fontWeight="medium" color="gray.500" mb={2}>
              {t('activityDetails.creationDate')}
            </Text>
            <Text fontSize="sm">{convertDateTime(activity.createdAt)}</Text>
          </Box>

          {activity.finished_at && (
            <Box>
              <Text fontSize="sm" fontWeight="medium" color="gray.500" mb={2}>
                {t('activityDetails.completionDate')}
              </Text>
              <Text fontSize="sm">{convertDateTime(activity.finished_at)}</Text>
            </Box>
          )}

          {activity.due_date && (
            <Box>
              <Text fontSize="sm" fontWeight="medium" color="gray.500" mb={2}>
                {t('activityDetails.dueDate')}
              </Text>
              <Text fontSize="sm">{convertDateTime(activity.due_date)}</Text>
            </Box>
          )}

          <Box>
            <Text fontSize="sm" fontWeight="medium" color="gray.500" mb={2}>
              {t('activityDetails.requester')}
            </Text>
            <Flex flexWrap="wrap" gap={4}>
              {activity.users.map((user) => (
                <UserDetails key={user._id} user={user} />
              ))}
            </Flex>
          </Box>
        </VStack>
      </Box>
    </Card>
  );
};

export default TicketHeaderCard; 