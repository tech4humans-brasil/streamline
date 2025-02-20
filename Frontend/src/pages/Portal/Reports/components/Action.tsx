import { memo, useCallback } from "react";
import { Button } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { BiEdit } from "react-icons/bi";
import IActivity from "@interfaces/Activitiy";

const Action = memo(({ activity }: { activity: Pick<IActivity, "_id"> }) => {
  const navigate = useNavigate();

  const handleSee = useCallback(() => {
    navigate(`/portal/activity/${activity._id}`);
  }, [navigate, activity._id]);

  return (
    <Button mr={2} onClick={handleSee} size="sm">
      <BiEdit size={20} />
    </Button>
  );
});

export default Action;