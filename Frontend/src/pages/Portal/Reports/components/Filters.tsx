import { Card, CardBody } from "@chakra-ui/react";
import Filter from "@components/organisms/Filter";
import Text from "@components/atoms/Inputs/Text";
import Select from "@components/atoms/Inputs/Select";
import { useQuery } from "@tanstack/react-query";
import { getActivitiesDashboardForms } from "@apis/reports";

const Filters = () => {
  const { data: formData, isFetching: isFetchingForms } = useQuery({
    queryKey: ["dashboardMetrics", "forms"],
    queryFn: getActivitiesDashboardForms,
  });

  return (
    <Card w="100%" p={0} mb={6}>
      <CardBody>
        <Filter.Container>
          <Select
            input={{
              id: "form",
              options: formData?.forms || [],
              placeholder: "Selecione um formulário",
              label: "Formulário",
            }}
            isLoading={isFetchingForms}
          />
          <Select
            input={{
              id: "date_type",
              options: [
                { label: "Data de Criação", value: "createdAt" },
                { label: "Data de Finalização", value: "finished_at" },
              ],
              placeholder: "Selecione uma opção",
              label: "Tipo de Data",
            }}
          />
          <Text
            input={{
              id: "start_date",
              type: "date",
              label: "Data Inicial",
            }}
          />
          <Text
            input={{
              id: "end_date",
              type: "date",
              label: "Data Final",
            }}
          />
        </Filter.Container>
      </CardBody>
    </Card>
  );
};

export default Filters;