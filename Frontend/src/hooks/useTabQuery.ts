import { useSearchParams } from "react-router-dom";

export const useTabQuery = (tabIndex: number) => {
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || '0';
  return parseInt(activeTab) === tabIndex;
}; 