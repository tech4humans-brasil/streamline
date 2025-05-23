import React from 'react';
import { Box, Button, Flex, Icon, Text } from '@chakra-ui/react';
import { FaArrowLeft } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface ActivityHeaderProps {
  protocol: string;
}

const ActivityHeader: React.FC<ActivityHeaderProps> = ({ protocol }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <Flex alignItems="center" mb={6} position="sticky">
      <Button
        variant="ghost"
        size="sm"
        leftIcon={<Icon as={FaArrowLeft} />}
        mr={4}
        onClick={() => navigate(-1)}
      >
        {t('activityDetails.back')}
      </Button>
      <Text fontSize="2xl" fontWeight="bold">
        {t('activityDetails.ticket')}{protocol}
      </Text>
    </Flex>
  );
};

export default ActivityHeader; 