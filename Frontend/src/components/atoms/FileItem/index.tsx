import { Text, Icon, Flex, Divider, Box } from "@chakra-ui/react";
import { FileUploaded } from "@interfaces/Answer";
import { DefaultExtensionType, FileIcon, defaultStyles } from "react-file-icon";

interface FileProps {
  file: FileUploaded;
}

const FileItem: React.FC<FileProps> = ({ file }) => {
  if (!file?.name) return (
    <Box
      p={2}
      px={4}
      borderRadius={4}
      w={"fit-content"}
      borderColor="border.primary"
      borderWidth={1}
    >
      <Text fontSize="sm" fontWeight={"bold"}>Sem arquivo</Text>
    </Box>
  )

  const extension = file.mimeType.split("/").pop() as DefaultExtensionType;

  return (
    <Box
      p={2}
      px={4}
      borderRadius={4}
      w={"fit-content"}
      borderColor="border.primary"
      borderWidth={1}
    >
      <a href={file.url} target="_blank">
        <Flex direction="row" alignItems="center" gap={2}>
          <Icon boxSize={10}>
            <FileIcon extension={extension} {...defaultStyles?.[extension]} />
          </Icon>
          <Divider orientation="vertical" />
          <Text fontSize="sm" fontWeight={"bold"}>
            {file.name.split("@").pop()}
          </Text>
        </Flex>
      </a>
    </Box>
  );
};

export default FileItem;
