import React from "react";
import {
  Box,
  Card,
  Flex,
  Icon,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";
import CommentItem from "@components/atoms/CommentItem";
import CommentForm from "@components/CommentForm.tsx";
import IComment from "@interfaces/Comments";
import { useTranslation } from "react-i18next";
import { FaInfoCircle } from "react-icons/fa";
import { convertDateTime } from "@utils/date";
import IUser from "@interfaces/User";

interface CommentsSectionProps {
  comments: IComment[];
  activityId: string;
}

const SystemCommentRow: React.FC<{
  comment: IComment & {
    user: Pick<IUser, "_id" | "name" | "email" | "photo_url">;
  };
}> = ({ comment }) => {
  const { t } = useTranslation();
  const bg = useColorModeValue("gray.100", "gray.700");
  const border = useColorModeValue("gray.200", "gray.600");
  const iconBg = useColorModeValue("gray.200", "gray.600");

  return (
    <Flex
      align="center"
      gap={3}
      py={3}
      px={4}
      borderRadius="md"
      bg={bg}
      borderWidth="1px"
      borderColor={border}
      role="group"
    >
      <Flex
        align="center"
        justify="center"
        flexShrink={0}
        w={8}
        h={8}
        borderRadius="full"
        bg={iconBg}
      >
        <Icon as={FaInfoCircle} color="blue.400" boxSize={4} />
      </Flex>
      <Box flex="1" minW={0}>
        <Text fontSize="xs" fontWeight="semibold" color="gray.500" mb={1}>
          {t("activityDetails.comments.systemBadge")}
        </Text>
        <Text fontSize="sm" color="gray.700" _dark={{ color: "gray.100" }}>
          {comment.content}
        </Text>
        <Text as="span" fontSize="xs" color="gray.500" mt={1} display="block">
          {convertDateTime(comment.createdAt)}
        </Text>
      </Box>
    </Flex>
  );
};

const CommentsSection: React.FC<CommentsSectionProps> = ({
  comments,
  activityId,
}) => {
  const { t } = useTranslation();

  return (
    <Card>
      <Box p={6}>
        <Text fontSize="lg" fontWeight="bold" mb={2}>
          {t("activityDetails.comments.title")}
        </Text>
        <Text fontSize="sm" color="gray.500" mb={4}>
          {t("activityDetails.comments.subtitle")}
        </Text>
        <Flex
          direction="column"
          gap={2}
          maxH="500px"
          overflowY="auto"
          px={2}
          sx={{
            "&::-webkit-scrollbar": {
              width: "4px",
            },
            "&::-webkit-scrollbar-track": {
              width: "6px",
            },
            "&::-webkit-scrollbar-thumb": {
              background: "gray.200",
              borderRadius: "24px",
            },
          }}
        >
          {comments?.map((comment) =>
            comment.isSystem ? (
              <SystemCommentRow
                key={comment._id}
                comment={
                  comment as IComment & {
                    user: Pick<
                      IUser,
                      "_id" | "name" | "email" | "photo_url"
                    >;
                  }
                }
              />
            ) : (
              <CommentItem
                key={comment._id}
                comment={
                  comment as Omit<IComment, "user"> & {
                    user: Pick<
                      IUser,
                      "_id" | "name" | "email" | "photo_url"
                    >;
                  }
                }
              />
            )
          )}
        </Flex>
        <Box mt={6} pt={4} borderTop="1px solid" borderColor="gray.100">
          <CommentForm id={activityId} />
        </Box>
      </Box>
    </Card>
  );
};

export default CommentsSection;
