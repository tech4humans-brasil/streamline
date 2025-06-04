import {
  Box,
  Flex,
  Heading,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text as TextChakra,
} from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { FaCheck } from "react-icons/fa";
import { BiX } from "react-icons/bi";
import { IReturn } from "@interfaces/Equipment";

interface ReturnDetailsModalProps {
  returnData: IReturn | null;
  onClose: () => void;
}

export function ReturnDetailsModal({
  returnData,
  onClose,
}: ReturnDetailsModalProps) {
  const { t } = useTranslation();

  if (!returnData) {
    return null;
  }

  return (
    <Modal isOpen={!!returnData} onClose={onClose}>
      <ModalOverlay />
      <ModalContent maxW="500px">
        <ModalHeader>
          <Heading size="md">{t("allocation.returnDetails")}</Heading>
          <TextChakra fontSize="md" color="gray.500">
            {t("allocation.returnDetailsDescription")}
          </TextChakra>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Flex direction="column" gap="6">
            {/* Description */}
            <Box>
              <TextChakra fontSize="sm" fontWeight="medium" mb="2">
                {t("common.fields.description")}
              </TextChakra>
              <TextChakra fontSize="sm">{returnData.description}</TextChakra>
            </Box>

            <Box borderTop="1px" borderColor="gray.200" />

            {/* Backup Checklist */}
            <Box>
              <TextChakra fontSize="sm" fontWeight="medium" mb="3">
                {t("allocation.backupChecklist")}
              </TextChakra>
              <Flex direction="column" gap="2">
                <Flex align="center">
                  <Box
                    mr="2"
                    p="1"
                    borderRadius="full"
                    bg={
                      returnData.checklist.backup.verifyFilesIncluded === "yes"
                        ? "green.100"
                        : "red.100"
                    }
                    color={
                      returnData.checklist.backup.verifyFilesIncluded === "yes"
                        ? "green.600"
                        : "red.600"
                    }
                  >
                    {returnData.checklist.backup.verifyFilesIncluded === "yes" ? (
                      <FaCheck size="14px" />
                    ) : (
                      <BiX size="14px" />
                    )}
                  </Box>
                  <TextChakra fontSize="sm">
                    {t("common.fields.verifyFilesIncluded")}
                  </TextChakra>
                </Flex>

                <Flex align="center">
                  <Box
                    mr="2"
                    p="1"
                    borderRadius="full"
                    bg={
                      returnData.checklist.backup.secureBackup === "yes"
                        ? "green.100"
                        : "red.100"
                    }
                    color={
                      returnData.checklist.backup.secureBackup === "yes"
                        ? "green.600"
                        : "red.600"
                    }
                  >
                    {returnData.checklist.backup.secureBackup === "yes" ? (
                      <FaCheck size="14px" />
                    ) : (
                      <BiX size="14px" />
                    )}
                  </Box>
                  <TextChakra fontSize="sm">
                    {t("common.fields.secureBackup")}
                  </TextChakra>
                </Flex>

                <Flex align="center">
                  <Box
                    mr="2"
                    p="1"
                    borderRadius="full"
                    bg={
                      returnData.checklist.formattingCompleted === "yes"
                        ? "green.100"
                        : "red.100"
                    }
                    color={
                      returnData.checklist.formattingCompleted === "yes"
                        ? "green.600"
                        : "red.600"
                    }
                  >
                    {returnData.checklist.formattingCompleted === "yes" ? (
                      <FaCheck size="14px" />
                    ) : (
                      <BiX size="14px" />
                    )}
                  </Box>
                  <TextChakra fontSize="sm">
                    {t("common.fields.formattingCompleted")}
                  </TextChakra>
                </Flex>
              </Flex>
            </Box>

            <Box borderTop="1px" borderColor="gray.200" />

            {/* Physical Condition */}
            <Box>
              <TextChakra fontSize="sm" fontWeight="medium" mb="3">
                {t("allocation.physicalCondition")}
              </TextChakra>
              <Flex direction="column" gap="3">
                <Flex align="center">
                  <Box
                    mr="2"
                    p="1"
                    borderRadius="full"
                    bg={
                      returnData.physicalDamages.additionalInfo
                        .hasPhysicalDamage === "no"
                        ? "green.100"
                        : "red.100"
                    }
                    color={
                      returnData.physicalDamages.additionalInfo
                        .hasPhysicalDamage === "no"
                        ? "green.600"
                        : "red.600"
                    }
                  >
                    {returnData.physicalDamages.additionalInfo
                      .hasPhysicalDamage === "no" ? (
                      <FaCheck size="14px" />
                    ) : (
                      <BiX size="14px" />
                    )}
                  </Box>
                  <TextChakra fontSize="sm">
                    {returnData.physicalDamages.additionalInfo
                      .hasPhysicalDamage === "yes"
                      ? t("allocation.physicalDamageDetected")
                      : t("allocation.noPhysicalDamage")}
                  </TextChakra>
                </Flex>

                {returnData.physicalDamages.additionalInfo.damageDetails && (
                  <Box ml="8">
                    <TextChakra fontSize="sm">
                      {returnData.physicalDamages.additionalInfo.damageDetails}
                    </TextChakra>
                  </Box>
                )}

                <Flex align="center">
                  <Box
                    mr="2"
                    p="1"
                    borderRadius="full"
                    bg={
                      returnData.physicalDamages.componentDamage
                        .hasComponentDamage === "no"
                        ? "green.100"
                        : "red.100"
                    }
                    color={
                      returnData.physicalDamages.componentDamage
                        .hasComponentDamage === "no"
                        ? "green.600"
                        : "red.600"
                    }
                  >
                    {returnData.physicalDamages.componentDamage
                      .hasComponentDamage === "no" ? (
                      <FaCheck size="14px" />
                    ) : (
                      <BiX size="14px" />
                    )}
                  </Box>
                  <TextChakra fontSize="sm">
                    {returnData.physicalDamages.componentDamage
                      .hasComponentDamage === "yes"
                      ? t("allocation.componentDamageDetected")
                      : t("allocation.componentsIntact")}
                  </TextChakra>
                </Flex>
                {returnData.physicalDamages.componentDamage.damageDetails && (
                  <Box ml="8">
                    <TextChakra fontSize="sm">
                      {returnData.physicalDamages.componentDamage.damageDetails}
                    </TextChakra>
                  </Box>
                )}
              </Flex>
            </Box>

            <Box borderTop="1px" borderColor="gray.200" />

            {/* Returned Accessories */}
            <Box>
              <TextChakra fontSize="sm" fontWeight="medium" mb="2">
                {t("common.fields.accessoriesReturned")}
              </TextChakra>
              {returnData.physicalDamages.accessoriesReturned ? (
                <TextChakra fontSize="sm">
                  {t(`common.${returnData.physicalDamages.accessoriesReturned}`)}
                </TextChakra>
              ) : (
                <TextChakra fontSize="sm">
                  {t("allocation.noAccessoriesReturned")}
                </TextChakra>
              )}
            </Box>
          </Flex>
        </ModalBody>
        <ModalFooter justifyContent="space-between">
          <TextChakra fontSize="sm" color="gray.500">
            {returnData.createdBy?.name} {returnData.createdBy?.email}
          </TextChakra>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
} 