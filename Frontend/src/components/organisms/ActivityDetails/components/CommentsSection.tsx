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
import { useActivityDetailCardProps } from "../useActivityDetailCardProps";

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
  const bg = useColorModeValue("gray.50", "gray.900");
  const hoverBg = useColorModeValue("gray.100", "gray.800");
  const iconBg = useColorModeValue("gray.200", "gray.600");

  return (
    <Flex
      align="flex-start"
      gap={3}
      py={3}
      px={4}
      bg={bg}
      transition="background 0.15s ease"
      _hover={{ bg: hoverBg }}
      role="group"
    >
      <Flex
        align="center"
        justify="center"
        flexShrink={0}
        w={9}
        h={9}
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
  const listBorder = useColorModeValue("gray.200", "gray.600");
  const listBg = useColorModeValue("white", "gray.800");
  const composerBg = useColorModeValue("gray.50", "gray.900");
  const composerBorder = useColorModeValue("gray.200", "gray.600");
  const detailCardProps = useActivityDetailCardProps();

  return (
    <Card {...detailCardProps}>
      <Box p={6}>
        <Text fontSize="lg" fontWeight="bold" mb={2}>
          {t("activityDetails.comments.title")}
        </Text>
        <Text fontSize="sm" color="gray.500" mb={4}>
          {t("activityDetails.comments.subtitle")}
        </Text>

        <Box
          borderWidth="1px"
          borderColor={listBorder}
          borderRadius="lg"
          overflow="hidden"
          bg={listBg}
          maxH="420px"
          overflowY="auto"
          sx={{
            "&::-webkit-scrollbar": { width: "6px" },
            "&::-webkit-scrollbar-thumb": {
              background: "var(--chakra-colors-gray-300)",
              borderRadius: "full",
            },
          }}
        >
          {comments?.length ? (
            comments.map((comment) => (
              <Box
                key={comment._id}
                borderBottomWidth="1px"
                borderBottomColor={listBorder}
                _last={{ borderBottomWidth: 0 }}
              >
                {comment.isSystem ? (
                  <SystemCommentRow
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
                    comment={
                      comment as Omit<IComment, "user"> & {
                        user: Pick<
                          IUser,
                          "_id" | "name" | "email" | "photo_url"
                        >;
                      }
                    }
                  />
                )}
              </Box>
            ))
          ) : (
            <Box py={8} px={4} textAlign="center">
              <Text fontSize="sm" color="gray.500">
                {t("activityDetails.comments.emptyTimeline")}
              </Text>
            </Box>
          )}
        </Box>

        <Box
          mt={4}
          borderWidth="1px"
          borderColor={composerBorder}
          borderRadius="lg"
          bg={composerBg}
          overflow="hidden"
        >
          <CommentForm id={activityId} />
        </Box>
      </Box>
    </Card>
  );
};

export default CommentsSection;
