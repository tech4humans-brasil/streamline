import React, { useMemo } from "react";
import { Text } from "@chakra-ui/react";
import { convertDateTime } from "@utils/date";

interface DueDateIndicatorProps {
  dueDate?: string | Date | null; // A data de vencimento pode ser string ou Date
  fontSize?: string;
  /** Quando true, não renderiza nada se não houver data */
  hideWhenEmpty?: boolean;
}

const DueDateIndicator: React.FC<DueDateIndicatorProps> = ({
  dueDate,
  fontSize = "sm",
  hideWhenEmpty = false,
}) => {
  const differenceInTime = useMemo(() => {
    if (!dueDate) return 0;
    const due = new Date(dueDate);
    const now = new Date();

    return due.getTime() - now.getTime();
  }, [dueDate]);

  const color = useMemo(() => {
    let color = "green.500";
    if (
      differenceInTime <= 12 * 60 * 60 * 1000 &&
      differenceInTime > 60 * 60 * 1000
    ) {
      color = "yellow.500"; // 12 horas ou menos
    } else if (differenceInTime <= 60 * 60 * 1000) {
      color = "red.500"; // Menos de 1 hora ou já ultrapassou
    }
    return color;
  }, [differenceInTime]);

  if (!dueDate) {
    if (hideWhenEmpty) return null;
    return (
      <Text as="span" fontSize={fontSize} color="gray.500">
        -
      </Text>
    );
  }

  return (
    <Text as="span" fontSize={fontSize} color={color} whiteSpace="nowrap">
      {convertDateTime(dueDate, {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })}
    </Text>
  );
};

export default DueDateIndicator;
