import { useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";

const validChildren = [
  "/portal/workflow/",
  "/portal/schedule/",
  "/portal/status/",
  "/portal/form/",
  "/portal/email/",
  "/portal/form-draft/",
  "/portal/workflow-draft/",
  "/portal/projects/",
];

const useNavigationHistory = () => {
  const location = useLocation();
  const [history, setHistory] = useState<string[]>([]);

  const isValidPath = useCallback((path: string) => {
    return validChildren.some((childPath) => path.startsWith(childPath));
  }, []);

  const addToHistory = useCallback(
    (
      path: string,
      history: string[],
      setHistory: (history: string[] | ((prev: string[]) => string[])) => void
    ) => {
      if (!validChildren.some((childPath) => path.startsWith(childPath))) {
        setHistory([]);
        return;
      }

      if (path.startsWith("/portal/projects/")) {
        setHistory([path]);
      } else if (isValidPath(path) && history.length > 0) {
        const lastPath = history[history.length - 1];
        if (lastPath !== path) {
          if (
            path.startsWith("/portal/workflow-draft") ||
            path.startsWith("/portal/form-draft")
          ) {
            setHistory((prev) => prev.concat(path));
          } else {
            setHistory((prev) =>
              prev
                .filter(
                  (p) =>
                    !p.startsWith("/portal/workflow") &&
                    !p.startsWith("/portal/schedule") &&
                    !p.startsWith("/portal/status") &&
                    !p.startsWith("/portal/form") &&
                    !p.startsWith("/portal/email") &&
                    !p.startsWith("/portal/formDraft") &&
                    !p.startsWith("/portal/workDraft")
                )
                .concat(path)
            );
          }
        }
      }
    },
    [isValidPath]
  );

  const removeFromHistory = useCallback(
    (history: string[], setHistory: (history: string[]) => void) => {
      if (history.length > 1) {
        const updatedHistory = [...history];
        updatedHistory.pop();
        setHistory(updatedHistory);
      }
    },
    []
  );

  useEffect(() => {
    addToHistory(location.pathname, history, setHistory);
  }, [location.pathname]);

  useEffect(() => {
    const handlePopState = () => {
      removeFromHistory(history, setHistory);
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [history]);

  return history;
};

export default useNavigationHistory;
