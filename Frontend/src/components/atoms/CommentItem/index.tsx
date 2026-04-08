import { Avatar, Box, Flex, Text, useColorModeValue } from "@chakra-ui/react";
import { memo } from "react";
import IComment from "@interfaces/Comments";
import IUser from "@interfaces/User";
import { convertDateTime } from "@utils/date";

interface CommentItemProps {
  comment: Omit<IComment, "user"> & {
    user: Pick<IUser, "name" | "_id" | "email" | "photo_url">;
  };
}

const CommentItem: React.FC<CommentItemProps> = memo(({ comment }) => {
  const rowBg = useColorModeValue("white", "gray.800");
  const rowHoverBg = useColorModeValue("gray.50", "gray.700");
  const avatarRing = useColorModeValue("gray.200", "gray.600");

  return (
    <Flex
      align="flex-start"
      gap={3}
      py={3}
      px={4}
      bg={rowBg}
      transition="background 0.15s ease"
      _hover={{ bg: rowHoverBg }}
    >
      <Flex
        align="center"
        justify="center"
        flexShrink={0}
        w={9}
        h={9}
        borderRadius="full"
        borderWidth="1px"
        borderColor={avatarRing}
        overflow="hidden"
      >
        <Avatar
          size="sm"
          name={comment.user.name}
          src={comment.user.photo_url?.url}
          bg="blue.500"
          color="white"
        />
      </Flex>
      <Box flex="1" minW={0}>
        <Text fontSize="xs" fontWeight="semibold" color="gray.500" mb={1}>
          {comment.user.name}
        </Text>
        <Text
          fontSize="sm"
          whiteSpace="pre-wrap"
          color="gray.700"
          _dark={{ color: "gray.100" }}
          mb={1}
        >
          {comment.content}
        </Text>
        <Text as="span" fontSize="xs" color="gray.500">
          {convertDateTime(comment.createdAt)}
        </Text>
      </Box>
    </Flex>
  );
});

export default CommentItem;
