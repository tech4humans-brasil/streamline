import { Box, Heading } from "@chakra-ui/react";
import Chart from "react-apexcharts";

const PieChart = ({ title, data }: { title: string; data: any }) => {
  return (
    <Box mb="6" bg={"bg.card"} p={4} borderRadius="md" color="text.primary">
      <Heading size="md" mb="4">
        {title}
      </Heading>
      <Chart
        type="pie"
        options={{ labels: data.labels }}
        series={data.series}
        height={300}
      />
    </Box>
  );
};

const BarChart = ({ title, data }: { title: string; data: any }) => {
  return (
    <Box bg={"bg.card"} p={4} borderRadius="md" mb={6} color="text.primary">
      <Heading size="md" mb="4">
        {title}
      </Heading>
      <Chart
        type="bar"
        options={{
          chart: {
            stacked: true,
          },
          xaxis: {
            categories: data.categories,
            title: { text: "Orientadores" },
          },
          yaxis: {
            title: { text: "Contagem de Status" },
          },
          legend: { position: "top" },
        }}
        series={data.series}
        height={"600px"}
      />
    </Box>
  );
};

const LineChart = ({ title, data }: { title: string; data: any }) => {
  return (
    <Box mb="6" bg={"bg.card"} p={4} borderRadius="md" color="text.primary">
      <Heading size="md" mb="4">
        {title}
      </Heading>
      <Chart
        type="line"
        options={{
          xaxis: {
            categories: data.categories,
          },
          stroke: {
            curve: 'smooth',
          },
        }}
        series={[{
          name: 'Atividades',
          data: data.series
        }]}
        height={300}
      />
    </Box>
  );
};

const HorizontalBarChart = ({ title, data }: { title: string; data: any }) => {
  return (
    <Box mb="6" bg={"bg.card"} p={4} borderRadius="md" color="text.primary">
      <Heading size="md" mb="4">
        {title}
      </Heading>
      <Chart
        type="bar"
        options={{
          xaxis: {
            categories: data.categories,
          },
          plotOptions: {
            bar: {
              horizontal: true,
            }
          }
        }}
        series={[{
          name: 'Atividades',
          data: data.series
        }]}
        height={300}
      />
    </Box>
  );
};

export { PieChart, BarChart, LineChart, HorizontalBarChart };