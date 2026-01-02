// UserDetails.tsx
import React, {memo} from "react";
import { Avatar, Box, Flex, Text } from "@chakra-ui/react";
import { FileUploaded } from "@interfaces/Answer";

interface UserDetailsProps {
  user: {
    name: string;
    email: string;
    institutes?: { name: string }[];
    photo_url?: FileUploaded; 
  };
  accepted?: "accepted" | "rejected" | "pending";
}

const UserDetails: React.FC<UserDetailsProps> = ({ user, accepted }) => {
  return (
    <Box
      borderWidth="1px"
      borderRadius="lg"
      overflow="hidden"
      p={4}
      mb={4}
      opacity={accepted === "pending" ? 0.5 : 1}
      borderColor={accepted === "rejected" ? "red.500" : undefined}
      w="fit-content"
    >
      <Flex alignItems="center" gap={3}>
        <Avatar name={user.name} src={user.photo_url?.url ?? undefined} size="sm" />
        <Box>
          <Text fontSize="sm" fontWeight={"bold "} noOfLines={1}>
            {user.name}
          </Text>
          <Text fontSize="sm" noOfLines={1}>
            {user.email}
          </Text>
          <Text
            fontSize="sm"
            noOfLines={1}
            title={user?.institutes?.map((institute) => institute.name).join(", ")}
          >
            {user?.institutes?.map((institute) => institute.name).join(", ")}
          </Text>
        </Box>
      </Flex>

      {accepted === "rejected" && (
        <Text color="red.500" fontSize={"sm"}>
          Rejeitado
        </Text>
      )}
    </Box>
  );
};

export default memo(UserDetails);
