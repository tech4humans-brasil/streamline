import * as fs from "fs";
import * as path from "path";

const API_DIR = path.join(__dirname, "..", "functions", "apis");

const endpoints = () => {
  const found: { file: string; source: string }[] = [];

  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
        continue;
      }
      if (!entry.name.endsWith(".ts") || entry.name.endsWith(".spec.ts")) {
        continue;
      }
      const source = fs.readFileSync(full, "utf8");
      if (source.includes("new Http(")) {
        found.push({ file: path.relative(API_DIR, full), source });
      }
    }
  };

  walk(API_DIR);
  return found;
};

describe("autorização declarada nos endpoints", () => {
  const all = endpoints();

  const contar = (source: string, padrao: RegExp) =>
    (source.match(padrao) ?? []).length;

  it("encontra a superfície HTTP inteira", () => {
    const registros = all.reduce(
      (total, { source }) => total + contar(source, /new Http\(/g),
      0
    );

    expect(registros).toBeGreaterThanOrEqual(99);
  });

  // A guarda de verdade está no `configure`, que estoura no registro. Este
  // teste existe para falhar no CI antes de falhar no boot, com a lista de
  // quem esqueceu.
  //
  // A contagem é por registro, não por arquivo: Auth/ForgotPassword.ts
  // declara dois endpoints, um público e um permissionado.
  it("todo endpoint declara permission, setPublic ou setAuthenticatedOnly", () => {
    const semDeclaracao: string[] = [];

    for (const { file, source } of all) {
      const registros = contar(source, /new Http\(/g);
      const declaracoes =
        contar(source, /permission:\s*"/g) +
        contar(source, /\.setPublic\(\)/g) +
        contar(source, /\.setAuthenticatedOnly\(\)/g);

      if (declaracoes < registros) {
        semDeclaracao.push(`${file}: ${registros} endpoints, ${declaracoes} declarações`);
      }
    }

    expect(semDeclaracao).toEqual([]);
  });

  it("as permissions declaradas existem no catálogo de roles", () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { roles } = require("../roles") as {
      roles: { permissions: { name: string; permissions: string[] }[] }[];
    };

    const catalogo = new Set<string>();
    for (const role of roles) {
      for (const grupo of role.permissions) {
        for (const acao of grupo.permissions) {
          catalogo.add(`${grupo.name}.${acao}`);
        }
      }
    }

    const orfas: string[] = [];
    for (const { file, source } of all) {
      const match = /permission:\s*"([^"]+)"/.exec(source);
      if (match && !catalogo.has(match[1])) {
        orfas.push(`${file}: ${match[1]}`);
      }
    }

    expect(orfas).toEqual([]);
  });
});
