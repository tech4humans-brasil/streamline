import {
  Button,
  Card,
  CardBody,
  Text,
  Stack,
  Divider,
  Badge,
} from "@chakra-ui/react";
import { IScheduled } from "@interfaces/Schedule";
import { Link } from "react-router-dom";

interface ExecutionListProps {
  executions?: IScheduled[];
}

export default function ScheduleList({
  executions,
}: Readonly<ExecutionListProps>) {
  return (
    <Stack spacing={4} w="100%" maxW="600px">
      {executions?.map((execution) => (
        <Card
          key={execution._id}
          border="1px solid"
          borderColor="gray.200"
          borderRadius="lg"
          px={4}
        >
          <CardBody>
            <Text fontSize="sm">
              <strong>Agendado para:</strong>{" "}
              {new Date(execution.scheduled).toLocaleString()}
            </Text>

            <Divider my={4} />

            <Text fontSize="sm" color="gray.500">
              <strong>Criado em:</strong>{" "}
              {new Date(execution.createdAt).toLocaleString()}
            </Text>

            {execution.status === "pending" && (
              <Badge colorScheme="yellow" mt={2}>
                Pendente
              </Badge>
            )}
            {execution.status === "canceled" && (
              <Badge colorScheme="orange" mt={2}>
                Cancelado
              </Badge>
            )}

            {execution.status === "failed" && (
              <Badge colorScheme="red" mt={2}>
                Falhou
              </Badge>
            )}

            {execution.status === "completed" && (
              <Badge colorScheme="green" mt={2}>
                Concluído
              </Badge>
            )}

            {execution.activity && (
              <Link to={`/portal/activity/${execution.activity}`}>
                <Button
                  colorScheme="blue"
                  variant="outline"
                  size="sm"
                  mt={4}
                  w="100%"
                >
                  Ver atividade
                </Button>
              </Link>
            )}
          </CardBody>
        </Card>
      ))}
    </Stack>
  );
}
