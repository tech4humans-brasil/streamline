import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";

const isValidPath = (path: string) => {
  const validChildren = [
    "/portal/workflow",
    "/portal/schedule",
    "/portal/status",
    "/portal/form",
  ];

  if (path.startsWith("/portal/project?project=")) {
    return true;
  }

  return validChildren.some((childPath) => path.startsWith(childPath));
};

const initializeHistory = (): string[] => {
  const sessionHistory = sessionStorage.getItem("navigationHistory");
  return sessionHistory ? JSON.parse(sessionHistory) : [];
};

const addToHistory = (path: string, setHistory: (history: string[]) => void) => {
  let history = initializeHistory();

  
  if (path.startsWith("/portal/project?project=")) {
    history = [path];
  } else if (isValidPath(path)) {

    const updatedHistory = history.filter(
      (p: string) =>
        !p.startsWith("/portal/workflow") &&
        !p.startsWith("/portal/schedule") &&
        !p.startsWith("/portal/status") &&
        !p.startsWith("/portal/form")
    );
    updatedHistory.push(path);
    history = updatedHistory;
  }

  sessionStorage.setItem("navigationHistory", JSON.stringify(history));
  setHistory(history);
};

const removeFromHistory = (setHistory: (history: string[]) => void) => {
  let history = initializeHistory(); 
  if (history.length > 1) {
    history.pop(); 
    sessionStorage.setItem("navigationHistory", JSON.stringify(history));
    setHistory(history); 
  }
};

const useNavigationHistory = () => {
  const location = useLocation();
  const [history, setHistory] = useState<string[]>(initializeHistory); 

  useEffect(() => {
  
    addToHistory(location.pathname, setHistory);
  }, [location]);

  useEffect(() => {
  
    const handlePopState = () => {
      removeFromHistory(setHistory); 
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  return history;
};

export default useNavigationHistory;
