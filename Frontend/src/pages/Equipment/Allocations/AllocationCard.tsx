import React, { useRef } from "react";
import { NavLink, useParams } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateAllocation } from "@apis/allocation";
import {
  Button,
  Card,
  CardBody,
  Text,
  Flex,
  useToast,
  AlertDialog,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
  useDisclosure,
} from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { convertDateTime } from "@utils/date";
import { FaEye, FaLaptop } from "react-icons/fa";
import { UserEquipmentAllocation } from "@interfaces/User";
import { IEquipment } from "@interfaces/Equipment";
import { BsXCircleFill } from "react-icons/bs";
import DeallocationForm from "./DesallocationForm";

type AllocationCardProps = {
  allocation: Omit<UserEquipmentAllocation, "equipment"> & {
    equipment: IEquipment;
  };
};

const AllocationCard: React.FC<AllocationCardProps> = ({ allocation }) => {
  const { t } = useTranslation();

  const {
    isOpen: isConfirmOpen,
    onClose: onConfirmClose,
    onOpen: onConfirmOpen,
  } = useDisclosure();

  return (
    <>
      <Card maxW="md" m={2}>
        <CardBody>
          <Flex justify="space-between" direction="column" gap={4}>
            <Flex justify="flex-start" align="center" gap={2}>
              <FaLaptop size={20} />
              <Text fontSize="lg">{allocation.equipment.inventoryNumber}</Text>
            </Flex>
            <Flex
              borderRadius="md"
              p={4}
              borderWidth="1px"
              gap={2}
              direction="column"
            >
              <Text>{allocation.equipment.formName}</Text>
              <Text>
                {t(`common.fields.${allocation.equipment.situation}`)}
              </Text>
            </Flex>
            <Flex direction="column" gap={2}>
              <Text>
                {t("common.fields.startDate")}:{" "}
                {convertDateTime(allocation.startDate)}
              </Text>
              <Text>
                {t("common.fields.endDate")}:{" "}
                {allocation.endDate ? convertDateTime(allocation.endDate) : "-"}
              </Text>
            </Flex>
            <Flex justify="flex-end" gap={2}>
              <NavLink to={`/portal/equipment/${allocation.equipment._id}`}>
                <Button size="sm">
                  <FaEye />
                </Button>
              </NavLink>
              {!allocation.endDate && (
                <Button onClick={onConfirmOpen} size="sm" colorScheme="red">
                  <BsXCircleFill />
                </Button>
              )}
            </Flex>
          </Flex>
        </CardBody>
      </Card>

      <DeallocationForm
        isOpen={isConfirmOpen}
        onClose={onConfirmClose}
        id={allocation._id}
      />
    </>
  );
};

export default AllocationCard;
