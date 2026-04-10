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
  /** default: card — full section with Card wrapper */
  variant?: "card" | "embedded";
  /** When embedded: show comments title + subtitle above the list */
  showSectionHeader?: boolean;
  /** When false, only the list is rendered (composer can live outside parent scroll) */
  showComposer?: boolean;
  /** Max height of the list; omit for unbounded (e.g. inside a parent scroll area) */
  listMaxHeight?: string | number;
}

export const SystemCommentRow: React.FC<{
  comment: IComment & {
    user: Pick<IUser, "_id" | "name" | "email" | "photo_url">;
  };
  hideTimestamp?: boolean;
}> = ({ comment, hideTimestamp }) => {
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
        {!hideTimestamp ? (
          <Text as="span" fontSize="xs" color="gray.500" mt={1} display="block">
            {convertDateTime(comment.createdAt)}
          </Text>
        ) : null}
      </Box>
    </Flex>
  );
};

const listScrollbarSx = {
  "&::-webkit-scrollbar": { width: "6px" },
  "&::-webkit-scrollbar-thumb": {
    background: "var(--chakra-colors-gray-300)",
    borderRadius: "full",
  },
};

export const CommentsList: React.FC<{
  comments: IComment[];
  listMaxHeight?: string | number;
}> = ({ comments, listMaxHeight }) => {
  const { t } = useTranslation();
  const listBorder = useColorModeValue("gray.200", "gray.600");
  const listBg = useColorModeValue("white", "gray.800");

  return (
    <Box
      borderWidth="1px"
      borderColor={listBorder}
      borderRadius="lg"
      bg={listBg}
      maxH={listMaxHeight}
      overflow={listMaxHeight != null ? "auto" : "visible"}
      sx={listMaxHeight != null ? listScrollbarSx : undefined}
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
  );
};

export const CommentComposerPanel: React.FC<{ activityId: string }> = ({
  activityId,
}) => {
  const composerBg = useColorModeValue("gray.50", "gray.900");
  const composerBorder = useColorModeValue("gray.200", "gray.600");

  return (
    <Box
      borderWidth="1px"
      borderColor={composerBorder}
      borderRadius="lg"
      bg={composerBg}
      overflow="hidden"
    >
      <CommentForm id={activityId} />
    </Box>
  );
};

const CommentsSection: React.FC<CommentsSectionProps> = ({
  comments,
  activityId,
  variant = "card",
  showSectionHeader,
  showComposer = true,
  listMaxHeight,
}) => {
  const { t } = useTranslation();
  const detailCardProps = useActivityDetailCardProps();

  const showHeader =
    variant === "card" ||
    (variant === "embedded" && showSectionHeader === true);

  const header = showHeader && (
    <>
      <Text fontSize="lg" fontWeight="bold" mb={2}>
        {t("activityDetails.comments.title")}
      </Text>
      <Text fontSize="sm" color="gray.500" mb={4}>
        {t("activityDetails.comments.subtitle")}
      </Text>
    </>
  );

  const list = (
    <CommentsList
      comments={comments}
      listMaxHeight={listMaxHeight ?? (variant === "card" ? "420px" : undefined)}
    />
  );

  const composer = showComposer ? (
    <Box mt={4}>
      <CommentComposerPanel activityId={activityId} />
    </Box>
  ) : null;

  if (variant === "embedded") {
    return (
      <Box>
        {showSectionHeader ? header : null}
        {list}
        {composer}
      </Box>
    );
  }

  return (
    <Card {...detailCardProps}>
      <Box p={6}>
        {header}
        {list}
        {composer}
      </Box>
    </Card>
  );
};

export default CommentsSection;
