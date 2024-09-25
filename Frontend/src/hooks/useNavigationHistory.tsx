import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";

// Verifica se o caminho é válido (projeto ou rotas filhas permitidas)
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

// Adiciona um caminho ao histórico e atualiza o estado local
const addToHistory = (
  path: string,
  history: string[],
  setHistory: (history: string[]) => void
) => {
  if (path.startsWith("/portal/projects/")) {
    // Reseta o histórico se for um projeto
    setHistory([path]);
  } else if (isValidPath(path)) {
    // Verifica se o caminho não é igual ao último no histórico
    const lastPath = history[history.length - 1];
    if (lastPath !== path) {
      const updatedHistory = history.filter(
        (p: string) =>
          !p.startsWith("/portal/workflow") &&
          !p.startsWith("/portal/schedule") &&
          !p.startsWith("/portal/status") &&
          !p.startsWith("/portal/form")
      );
      updatedHistory.push(path);
      setHistory(updatedHistory);
    }
  }
};

// Remove o último item do histórico (usado quando o usuário navega para trás)
const removeFromHistory = (
  history: string[],
  setHistory: (history: string[]) => void
) => {
  if (history.length > 1) {
    const updatedHistory = [...history]; // Cria uma cópia do histórico
    updatedHistory.pop(); // Remove o último item
    setHistory(updatedHistory); // Atualiza o estado local
  }
};

const useNavigationHistory = () => {
  const location = useLocation();
  const [history, setHistory] = useState<string[]>([]); // Inicializa o histórico como array vazio

  useEffect(() => {
    // Atualiza o histórico quando a rota mudar
    addToHistory(location.pathname, history, setHistory);
    // Adiciona 'history' como dependência para garantir que ele seja atualizado corretamente
  }, [location.pathname, history]);

  useEffect(() => {
    // Detecta a navegação "para trás" e ajusta o histórico
    const handlePopState = () => {
      removeFromHistory(history, setHistory); // Remove a última URL quando o usuário navega para trás
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState); // Limpa o evento quando o componente for desmontado
    };
  }, [history]);

  return history; // Retorna o histórico atualizado
};

export default useNavigationHistory;
