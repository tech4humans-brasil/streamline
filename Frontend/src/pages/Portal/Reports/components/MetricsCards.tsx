import { Flex, Card, CardBody, Heading, Skeleton } from "@chakra-ui/react";

interface MetricsCardsProps {
  openActivitiesCount: number;
  closedActivitiesCount: number;
  averageCompletionTime: number;
  isLoading?: boolean;
}

const MetricsCards = ({
  openActivitiesCount,
  closedActivitiesCount,
  averageCompletionTime,
  isLoading = false,
}: MetricsCardsProps) => {
  return (
    <Flex justifyContent="space-between" mb="6" wrap="wrap" direction={["column", "row"]} w="100%">
      <Card>
        <CardBody>
          <Heading size="md">Atividades Abertas</Heading>
          <Skeleton isLoaded={!isLoading}>
            <Heading size="lg" color="green.500">
              {openActivitiesCount}
            </Heading>
          </Skeleton>
        </CardBody>
      </Card>
      <Card>
        <CardBody>
          <Heading size="md">Atividades Fechadas</Heading>
          <Skeleton isLoaded={!isLoading}>
            <Heading size="lg" color="red.500">
              {closedActivitiesCount}
            </Heading>
          </Skeleton>
        </CardBody>
      </Card>
      <Card>
        <CardBody>
          <Heading size="md">Tempo Médio de Conclusão</Heading>
          <Skeleton isLoaded={!isLoading}>
            <Heading size="lg" color="blue.500">
              {averageCompletionTime.toFixed(2)} dias
            </Heading>
          </Skeleton>
        </CardBody>
      </Card>
    </Flex>
  );
};

export default MetricsCards;