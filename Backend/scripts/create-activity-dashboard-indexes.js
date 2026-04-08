/**
 * Cria índices compostos para GET dashboard/my-activities no Azure Cosmos DB (Mongo API).
 *
 * Variáveis (iguais ao Functions): MONGO_URI, MONGO_PARAMS, e o nome da base do cliente.
 *
 * Exemplo:
 *   export MONGO_URI="mongodb://..."
 *   export MONGO_PARAMS="ssl=true&replicaSet=globaldb&retrywrites=false&..."
 *   export MONGO_CLIENT_DB="sigla-do-cliente"
 *   pnpm run create-activity-dashboard-indexes
 */

const mongoose = require("mongoose");

async function main() {
  const base = process.env.MONGO_URI?.replace(/\/+$/, "");
  const params = process.env.MONGO_PARAMS || "";
  const dbName = process.env.MONGO_CLIENT_DB;

  if (!base || !dbName) {
    console.error(
      "Defina MONGO_URI e MONGO_CLIENT_DB (nome da base por cliente, como em mongo.connect)."
    );
    process.exit(1);
  }

  const url = params ? `${base}/${dbName}?${params}` : `${base}/${dbName}`;

  await mongoose.connect(url);
  const col = mongoose.connection.db.collection("activities");

  const specs = [
    {
      key: { "users._id": 1, updatedAt: -1, createdAt: -1 },
      name: "dashboard_my_activities_user_updated_created",
    },
    {
      key: { "users._id": 1, "assignee._id": 1, updatedAt: -1, createdAt: -1 },
      name: "dashboard_my_activities_user_assignee_updated_created",
    },
  ];

  for (const { key, name } of specs) {
    await col.createIndex(key, { name });
    console.log("Índice criado ou já existente:", name);
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
