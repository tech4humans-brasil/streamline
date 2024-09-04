import { Box, Flex } from "@chakra-ui/react";
import React from "react";
import Navbar from "./components/Navbar";
import List from "./components/List";

const Projects: React.FC = () => {
  return (
    <Box width="100%">
      <Navbar />
      <Flex
        justifyContent="center"
        alignItems="center"
        width={[null, "90%", "80%", "70%"]}
        p="4"
        borderRadius="md"
        direction="column"
        bg={"bg.pageDark"}
        margin="0 auto"
        mt={5}
      >
        <List />
      </Flex>
    </Box>
  );
};

export default Projects;
