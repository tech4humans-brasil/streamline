import { Tag } from "@chakra-ui/react";
import IStatus from "@interfaces/Status";

interface StatusTagProps {
  status: IStatus;
}

const StatusTag: React.FC<StatusTagProps> = ({ status }) => {
  const getColorScheme = (type: string) => {
    switch (type) {
      case "progress":
        return "blue";
      case "done":
        return "green";
      case "canceled":
        return "red";
      default:
        return "gray";
    }
  };

  return (
    <Tag
      colorScheme={getColorScheme(status.type)}
      size="sm"
    >
      {status.name}
    </Tag>
  );
};

export default StatusTag; 