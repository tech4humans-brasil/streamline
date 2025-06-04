import {
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Flex,
  Text as TextChakra,
} from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { FaCheck, FaEye, FaReply } from "react-icons/fa";
import { NavLink } from "react-router-dom";
import { IAllocation, IReturn } from "@interfaces/Equipment";

interface AllocationsTimelineProps {
  allocations: IAllocation[];
  onViewReturn: (returnData?: IReturn | null) => void;
}

export function AllocationsTimeline({
  allocations,
  onViewReturn,
}: AllocationsTimelineProps) {
  const { t } = useTranslation();

  if (!allocations || allocations.length === 0) {
    return null;
  }

  return (
    <Card borderRadius={8} h="fit-content" w="100%" maxW="1000px" mt={4}>
      <CardHeader>
        <Box textAlign="center" fontSize="lg" fontWeight="bold">
          {t("equipment.allocations")}
        </Box>
      </CardHeader>
      <CardBody>
        <Box position="relative" pl="12" borderLeft="2px" borderColor="gray.200">
          {allocations.map((allocation, index) => (
            <Box
              key={allocation.allocation}
              position="relative"
              mb={index < allocations.length - 1 ? "12" : "0"}
              pb={index < allocations.length - 1 ? "8" : "0"}
            >
              {/* Timeline marker */}
              <Box
                position="absolute"
                left="-29px"
                p="2"
                borderRadius="full"
                bg="bg.page"
                border="2px"
                borderColor="blue.500"
                boxShadow="sm"
              >
                {allocation.endDate ? (
                  <FaReply size="14px" />
                ) : (
                  <FaCheck color="green.500" size="14px" />
                )}
              </Box>

              <Box px="4" borderRadius="lg" boxShadow="sm">
                {/* Allocation header */}
                <Flex
                  direction={["column", "row"]}
                  justify="space-between"
                  align={["flex-start", "center"]}
                  gap="4"
                  mb="4"
                >
                  <Box>
                    <TextChakra fontSize="lg" fontWeight="medium">
                      {allocation.user.name}
                      <Box
                        as="span"
                        ml="3"
                        px="3"
                        py="1"
                        borderRadius="md"
                        fontSize="sm"
                        bg={allocation.endDate ? "gray.500" : "green.100"}
                        color={allocation.endDate ? "gray.100" : "blue.700"}
                      >
                        {allocation.endDate
                          ? t("common.fields.returned")
                          : t("common.fields.active")}
                      </Box>
                    </TextChakra>
                    <TextChakra fontSize="sm" color="gray.500" mt="2">
                      {allocation.user.email}
                    </TextChakra>
                  </Box>

                  <Flex align="center" gap="2" fontSize="sm" color="gray.500">
                    <FaEye />
                    <TextChakra>
                      {new Date(allocation.startDate).toLocaleDateString()}
                      {allocation.endDate && (
                        <>
                          {" - "}
                          {new Date(allocation.endDate).toLocaleDateString()}
                        </>
                      )}
                    </TextChakra>
                  </Flex>
                </Flex>

                {allocation.return &&
                  allocation.return.physicalDamages.additionalInfo
                    .damageDetails && (
                    <Box>
                      <TextChakra fontSize="sm">
                        {
                          allocation.return.physicalDamages.additionalInfo
                            .damageDetails
                        }
                      </TextChakra>
                    </Box>
                  )}

                {allocation.return &&
                  allocation.return.physicalDamages.componentDamage
                    .damageDetails && (
                    <Box>
                      <TextChakra fontSize="sm">
                        {
                          allocation.return.physicalDamages.componentDamage
                            .damageDetails
                        }
                      </TextChakra>
                    </Box>
                  )}

                {/* Return details button */}
                <Flex gap="2" mt="4" flexWrap="wrap">
                  <NavLink to={`/portal/allocations/${allocation.user._id}`}>
                    <Button size="sm" variant="outline" leftIcon={<FaEye />}>
                      {t("common.fields.view")}
                    </Button>
                  </NavLink>
                  {allocation.return && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onViewReturn(allocation.return)}
                      leftIcon={<FaReply />}
                    >
                      {t("allocation.viewReturnDetails")}
                    </Button>
                  )}
                </Flex>

                {/* Separator */}
                {index < allocations.length - 1 && (
                  <Box pt="6">
                    <Box borderBottom="1px" borderColor="gray.200" />
                  </Box>
                )}
              </Box>
            </Box>
          ))}
        </Box>
      </CardBody>
    </Card>
  );
} 