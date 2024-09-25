import React, { useEffect, useMemo } from "react";
import {
  Breadcrumb as BreadcrumbChackra,
  BreadcrumbItem,
  BreadcrumbLink,
} from "@chakra-ui/react";
import { Link } from "react-router-dom";
import useNavigationHistory from "@hooks/useNavigationHistory";

const Breadcrumb = () => {
  const history = useNavigationHistory();

  return (
    <BreadcrumbChackra separator="/">
      {history.map((path, index) => {
        const pathName = path.split("/").filter(Boolean).pop();

        return (
          <BreadcrumbItem key={index}>
            <BreadcrumbLink as={Link} to={path}>
              {pathName
                ? pathName.charAt(0).toUpperCase() + pathName.slice(1)
                : "Home"}
            </BreadcrumbLink>
          </BreadcrumbItem>
        );
      })}
    </BreadcrumbChackra>
  );
};

export default Breadcrumb;
