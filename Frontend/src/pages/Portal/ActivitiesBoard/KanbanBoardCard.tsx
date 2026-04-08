import { Box, Text, useColorModeValue } from "@chakra-ui/react";
import { memo, useMemo } from "react";
import { TFunction } from "i18next";
import { ActivityListItem } from "@apis/activity";
import {
  formatBoardFieldValue,
  formatUtcDateOnly,
} from "./formatBoardFieldValue";

type KanbanBoardCardProps = {
  activity: ActivityListItem;
  builtInKeys: string[];
  formFieldIds: string[];
  onOpen: (id: string) => void;
  t: TFunction;
};

function formatDate(value: string | Date | null | undefined): string {
  if (value === null || value === undefined || value === "") return "—";
  try {
    const d = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString();
  } catch {
    return "—";
  }
}

const KanbanBoardCard = memo(function KanbanBoardCard({
  activity,
  builtInKeys,
  formFieldIds,
  onOpen,
  t,
}: KanbanBoardCardProps) {
  const attachmentLabel = t("activitiesBoard.fieldAttachment");
  const accentBorder = useColorModeValue("blue.400", "blue.300");

  const formLines = useMemo(() => {
    const fields = activity.form_draft?.fields ?? [];
    return formFieldIds
      .map((id) => fields.find((f) => f.id === id))
      .filter((f): f is NonNullable<typeof f> => !!f && f.type !== "section");
  }, [activity.form_draft?.fields, formFieldIds]);

  return (
    <Box
      p="3"
      borderRadius="md"
      bg="bg.page"
      borderWidth="1px"
      borderColor="gray.200"
      borderLeftWidth="3px"
      borderLeftColor={accentBorder}
      cursor="pointer"
      _hover={{ borderColor: "blue.400", boxShadow: "sm" }}
      onClick={() => onOpen(activity._id)}
      role="button"
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen(activity._id);
        }
      }}
      tabIndex={0}
    >
      <Text fontWeight="semibold" fontSize="sm" noOfLines={2}>
        {activity.name}
      </Text>

      {builtInKeys.includes("protocol") && (
        <Text
          fontSize="xs"
          color="gray.600"
          mt="1"
          fontFamily="mono"
          letterSpacing="tight"
        >
          {activity.protocol}
        </Text>
      )}

      {builtInKeys.includes("assignee") && activity.assignee?.name && (
        <Text fontSize="xs" mt="1" noOfLines={1}>
          {activity.assignee.name}
        </Text>
      )}

      {builtInKeys.includes("users") && activity.users?.length > 0 && (
        <Text fontSize="xs" mt="1" noOfLines={2}>
          {activity.users.map((u) => u.name).join(", ")}
        </Text>
      )}

      {builtInKeys.includes("description") && activity.description && (
        <Text fontSize="xs" mt="1" noOfLines={3} color="gray.600">
          {activity.description}
        </Text>
      )}

      {builtInKeys.includes("due_date") &&
        activity.due_date != null &&
        String(activity.due_date).length > 0 && (
          <Text fontSize="xs" mt="1" color="gray.600">
            {formatUtcDateOnly(activity.due_date)}
          </Text>
        )}

      {builtInKeys.includes("createdAt") && activity.createdAt && (
        <Text fontSize="xs" mt="1" color="gray.500">
          {formatDate(activity.createdAt)}
        </Text>
      )}

      {formLines.map((field) => (
        <Text key={field.id} fontSize="xs" mt="1" noOfLines={2}>
          <Text as="span" fontWeight="medium">
            {field.label}:
          </Text>{" "}
          {formatBoardFieldValue(field, attachmentLabel)}
        </Text>
      ))}
    </Box>
  );
});

export default KanbanBoardCard;
