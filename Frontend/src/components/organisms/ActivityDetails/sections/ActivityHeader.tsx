// ActivityHeader.tsx
import React from "react";
import { Flex, Heading, Text, Badge, Divider } from "@chakra-ui/react";
import Comments from "./Comments";
import { IActivityState } from "@interfaces/Activitiy";

interface ActivityHeaderProps {
  id: string;
  name: string;
  protocol: string;
  status: string;
  state: IActivityState;
}

const ActiveStateMap = {
  [IActivityState.processing]: "Em andamento",
  [IActivityState.created]: "Fase de criação",
  [IActivityState.finished]: "Finalizado",
  [IActivityState.committed]: "Aceito",
};

const ActivityHeader: React.FC<ActivityHeaderProps> = ({
  id,
  name,
  protocol,
  status,
  state,
}) => {
  const badgeColor = (() => {
    switch (state) {
      case IActivityState.processing:
        return "blue";
      case IActivityState.created:
        return "gray";
      case IActivityState.finished:
        return "green";
      default:
        return "gray";
    }
  })();

  return (
    <Flex
      wrap={"wrap"}
      gap={2}
      alignItems={"center"}
      justifyContent={"space-between"}
      pb={4}
    >
      <Flex gap={2} alignItems={"center"}>
        <Heading as="h1" fontSize="2xl" noOfLines={1} title={name}>
          {name}
        </Heading>
        <Text fontSize="xl">#{protocol}</Text>
      </Flex>

      <Flex gap={2} alignItems={"center"}>
        <Badge
          p={2}
          borderRadius="sm"
          colorScheme={badgeColor}
          title={ActiveStateMap[state]}
        >
          {status}
        </Badge>
        <Comments id={id} />
      </Flex>
      <Divider />
    </Flex>
  );
};

export default ActivityHeader;
