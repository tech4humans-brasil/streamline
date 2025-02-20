import React, { useMemo, useCallback } from "react";
import { Box, Heading, Flex, IconButton } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { FaSync } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import { getActivitiesDashboard } from "@apis/reports";
import Filters from "./components/Filters";
import MetricsCards from "./components/MetricsCards";
import { PieChart, LineChart, HorizontalBarChart } from "./components/Charts";

const Reports: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();

  const {
    data: metrics,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["dashboardMetrics", searchParams.toString()],
    queryFn: getActivitiesDashboard,
  });

  const statusChartData = useMemo(() => {
    if (!metrics) return { labels: [], series: [] };
    return {
      labels: metrics.statusCounts.map(
        (status) => status._id || t("common.unknown")
      ),
      series: metrics.statusCounts.map((status) => status.count),
    };
  }, [metrics]);

  const formTypeChartData = useMemo(() => {
    if (!metrics) return { labels: [], series: [] };
    return {
      labels: metrics.formTypeCounts.map(
        (form) => form._id || t("common.unknown")
      ),
      series: metrics.formTypeCounts.map((form) => form.count),
    };
  }, [metrics]);

  const deadlineChartData = useMemo(() => {
    if (!metrics) return { labels: [], series: [] };
    const { deadlineMetrics } = metrics;
    return {
      labels: ['No Prazo', 'Atrasadas', 'Sem Prazo'],
      series: [deadlineMetrics.onTime, deadlineMetrics.delayed, deadlineMetrics.noDeadline],
    };
  }, [metrics]);

  const monthlyActivityData = useMemo(() => {
    if (!metrics) return { categories: [], series: [] };
    return {
      categories: metrics.monthlyActivities.map(item => item.month),
      series: metrics.monthlyActivities.map(item => item.count),
    };
  }, [metrics]);

  const topUsersData = useMemo(() => {
    if (!metrics) return { categories: [], series: [] };
    return {
      categories: metrics.topUsers.map(user => user.userName),
      series: metrics.topUsers.map(user => user.count),
    };
  }, [metrics]);

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  if (isLoading) return <Heading>Carregando...</Heading>;
  if (isError || !metrics)
    return (
      <Heading color="red.500">Erro ao carregar dados do dashboard</Heading>
    );

  return (
    <Box p="10" w="100%">
      <Flex justifyContent="space-between">
        <Heading size="lg" mb="6">
          Dashboard de Atividades
        </Heading>
        <IconButton
          aria-label="Refresh"
          onClick={handleRefresh}
          isLoading={isRefetching}
        >
          <FaSync />
        </IconButton>
      </Flex>

      <Filters />

      <MetricsCards
        openActivitiesCount={metrics?.openActivitiesCount ?? 0}
        closedActivitiesCount={metrics?.closedActivitiesCount ?? 0}
        averageCompletionTime={metrics?.averageCompletionTime ?? 0}
        isLoading={isLoading}
      />

      <Flex direction={["column", "row"]} w="100%" mb={6} justifyContent="space-between">
        <PieChart
          title="Distribuição por Status"
          data={statusChartData}
        />
        <PieChart
          title="Distribuição por Prazo"
          data={deadlineChartData}
        />
      </Flex>

      <LineChart
        title="Tendência de Atividades por Mês"
        data={monthlyActivityData}
      />

      <Flex direction={["column", "row"]} w="100%" mb={6} justifyContent="space-between">
        <PieChart
          title="Distribuição por Tipo de Formulário"
          data={formTypeChartData}
        />
        <PieChart
          title="Distribuição por Time"
          data={{
            labels: metrics.instituteDistribution.map(inst => inst.name),
            series: metrics.instituteDistribution.map(inst => inst.count),
          }}
        />
      </Flex>

      <HorizontalBarChart
        title="Top Usuários com Mais Atividades"
        data={topUsersData}
      />
    </Box>
  );
};

export default Reports;
