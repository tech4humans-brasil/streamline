import { Card, Flex, Text, Avatar, Box } from "@chakra-ui/react";
import { memo } from "react";
import IComment from "@interfaces/Comments";
import IUser from "@interfaces/User";
import { convertDateTime } from "@utils/date";

interface CommentItemProps {
  comment: Omit<IComment, "user"> & {
    user: Pick<IUser, "name" | "_id" | "email">;
  };
}

const CommentItem: React.FC<CommentItemProps> = memo(({ comment }) => {
  return (
    <Card
      mb={3}
      p={4}
      bg="bg.navbar"
      borderRadius="lg"
      boxShadow="sm"
      _hover={{ boxShadow: "md" }}
    >
      <Flex gap={3}>
        <Avatar
          size="sm"
          name={comment.user.name}
          bg="blue.500"
          color="white"
        />
        <Box flex="1">
          <Text fontWeight="bold" fontSize="sm" mb={2}>
            {comment.user.name}
          </Text>
          <Text fontSize="sm" whiteSpace="pre-wrap" mb={2}>
            {comment.content}
          </Text>
          <Text as="small" fontSize="xs" color="gray.500">
            {convertDateTime(comment.createdAt)}
          </Text>
        </Box>
      </Flex>
    </Card>
  );
});

export default CommentItem; 