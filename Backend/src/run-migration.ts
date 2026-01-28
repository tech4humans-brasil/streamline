import fs from "fs";
import path from "path";

// Carregar variáveis do local.settings.json (Azure Functions format)
const localSettingsPath = path.join(__dirname, "../local.settings.json");
if (fs.existsSync(localSettingsPath)) {
  const localSettings = JSON.parse(fs.readFileSync(localSettingsPath, "utf-8"));
  
  // Carregar todas as variáveis de Values para process.env
  if (localSettings.Values) {
    Object.keys(localSettings.Values).forEach((key) => {
      if (!process.env[key]) {
        process.env[key] = localSettings.Values[key];
      }
    });
    console.log("Variáveis de ambiente carregadas do local.settings.json");
  }
} else {
  console.warn("Arquivo local.settings.json não encontrado. Usando variáveis do ambiente.");
}

// Agora que as variáveis foram carregadas, podemos importar os módulos
import { connect, disconnect } from "./services/mongo";
import migrateToNewInventorySystem from "./migrate-equipment-numbers";
import migrateEquipmentTypes from "./migrate-equipment-types";

async function runMigration() {
  // O nome do banco vem da URI do Cosmos DB
  // Exemplo: mongodb://dev-streamline-mongodb:...
  // O banco é especificado ao conectar
  const DATABASE_NAME = "tech4h"; // Ajuste para o nome correto do seu banco
  
  // Verificar qual migração executar (via argumento de linha de comando)
  const args = process.argv.slice(2);
  const migrationType = args[0] || "all";
  
  console.log(`Conectando ao banco: ${DATABASE_NAME}`);
  const conn = connect(DATABASE_NAME);
  
  try {
    if (migrationType === "types" || migrationType === "all") {
      console.log("\n" + "=".repeat(60));
      console.log("EXECUTANDO: Migração de tipos de equipamentos");
      console.log("=".repeat(60));
      await migrateEquipmentTypes(conn);
    }
    
    if (migrationType === "numbers" || migrationType === "all") {
      console.log("\n" + "=".repeat(60));
      console.log("EXECUTANDO: Migração de números de inventário");
      console.log("=".repeat(60));
      await migrateToNewInventorySystem(conn);
    }
    
    if (!["types", "numbers", "all"].includes(migrationType)) {
      console.error(`\n❌ Tipo de migração inválido: "${migrationType}"`);
      console.log("\nUso: npm run migrate [types|numbers|all]");
      console.log("  types   - Migra apenas os tipos de equipamentos (variantes → base)");
      console.log("  numbers - Migra apenas os números de inventário");
      console.log("  all     - Executa todas as migrações (padrão)");
      throw new Error("Tipo de migração inválido");
    }
    
    console.log("\n✅ Processo de migração finalizado!");
  } catch (error) {
    console.error("\n❌ ERRO durante a migração:");
    console.error(error);
    throw error;
  } finally {
    await disconnect(conn);
    console.log("Conexão fechada.");
  }
}

// Executar
runMigration()
  .then(() => {
    console.log("Script executado com sucesso!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Falha na execução:", error);
    process.exit(1);
  });