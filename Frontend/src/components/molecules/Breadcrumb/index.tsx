import {
  Breadcrumb as BreadcrumbChackra,
  BreadcrumbItem,
  BreadcrumbLink,
  Text,
} from "@chakra-ui/react";
import { Link } from "react-router-dom";
import useNavigationHistory from "@hooks/useNavigationHistory";
import { useTranslation } from "react-i18next";

const Breadcrumb = () => {
  const history = useNavigationHistory();
  const { t } = useTranslation();

  return (
    <BreadcrumbChackra separator=">" px={4}>
      {history.map((path, index) => {
        const pathName = path.split("/").filter(Boolean).at(1);

        return (
          <BreadcrumbItem key={index}>
            <BreadcrumbLink as={Link} to={path}>
              <Text fontSize="sm">{t(`${pathName}.title`)}</Text>
            </BreadcrumbLink>
          </BreadcrumbItem>
        );
      })}
    </BreadcrumbChackra>
  );
};

export default Breadcrumb;
