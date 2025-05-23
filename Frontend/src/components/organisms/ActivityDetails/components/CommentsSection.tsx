import React from 'react';
import { Box, Card, Flex, Text } from '@chakra-ui/react';
import CommentItem from '@components/atoms/CommentItem';
import CommentForm from '@components/CommentForm.tsx';
import IComment from '@interfaces/Comments';
import { useTranslation } from 'react-i18next';

interface CommentsSectionProps {
  comments: IComment[];
  activityId: string;
}

const CommentsSection: React.FC<CommentsSectionProps> = ({ comments, activityId }) => {
  const { t } = useTranslation();

  return (
    <Card>
      <Box p={6}>
        <Text fontSize="lg" fontWeight="bold" mb={2}>
          {t('activityDetails.comments.title')}
        </Text>
        <Text fontSize="sm" color="gray.500" mb={4}>
          {t('activityDetails.comments.subtitle')}
        </Text>
        <Flex
          direction="column"
          gap={2}
          maxH="500px"
          overflowY="auto"
          px={2}
          sx={{
            '&::-webkit-scrollbar': {
              width: '4px',
            },
            '&::-webkit-scrollbar-track': {
              width: '6px',
            },
            '&::-webkit-scrollbar-thumb': {
              background: 'gray.200',
              borderRadius: '24px',
            },
          }}
        >
          {comments?.map((comment) => (
            <CommentItem key={comment._id} comment={comment} />
          ))}
        </Flex>
        <Box mt={6} pt={4} borderTop="1px solid" borderColor="gray.100">
          <CommentForm id={activityId} />
        </Box>
      </Box>
    </Card>
  );
};

export default CommentsSection; 