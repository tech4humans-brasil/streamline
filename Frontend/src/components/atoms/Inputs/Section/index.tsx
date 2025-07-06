import { Box, Divider, Text } from "@chakra-ui/react";

interface SectionProps {
  input: {
    id: string;
    label?: string;
    type: "section";
    describe?: string | null;
  };
}

const Section: React.FC<SectionProps> = ({ input }) => {
  return (
    <Box mt={5} w="100%">
      <Text fontSize="xl" fontWeight="bold">
        {input.label}
      </Text>
      <Text fontSize="md" color="gray.400">
        {input.describe}
      </Text>
      <Divider />
    </Box>
  );
}

export default Section;