import { Box, Button } from "@chakra-ui/react";
import { FaSync } from "react-icons/fa";

interface RefreshButtonProps {
  onClick: () => void;
  isLoading?: boolean;
}

const RefreshButton: React.FC<RefreshButtonProps> = ({ onClick, isLoading }) => {
  return (
    <Box p={[4, 2]}>
      <Button
        onClick={onClick}
        variant="outline"
        isLoading={isLoading}
        aria-label="Refresh"
      >
        <FaSync />
      </Button>
    </Box>
  );
};

export default RefreshButton; 