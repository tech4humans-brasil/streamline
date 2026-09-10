const dotenv = require("dotenv");
dotenv.config({ path: "../local.settings.json" });

const envs = {
  JWT_SECRET: "jest",
  JWT_RESET_PASSWORD_SECRET: "jest",
  MONGO_HOST: "host",
  MONGO_PORT: "27017",
  MONGO_USER: "jest",
  MONGO_PASS: "jest",
  // services/mongo.ts exige MONGO_URI e estoura no import. As quatro MONGO_*
  // acima não são lidas por nenhum serviço.
  MONGO_URI: "mongodb://localhost:27017",
  // Os serviços abaixo fazem throw no import quando a variável falta, o que
  // derruba a suíte inteira antes de qualquer teste rodar. Valores fictícios
  // com formato válido: nenhuma chamada de rede acontece nos testes.
  SENDGRID_API_KEY: "SG.jest",
  AZURE_STORAGE_CONNECTION_STRING:
    "DefaultEndpointsProtocol=https;AccountName=jest;AccountKey=amVzdA==;EndpointSuffix=core.windows.net",
  AZURE_SERVICE_BUS_CONNECTION_STRING:
    "Endpoint=sb://jest.servicebus.windows.net/;SharedAccessKeyName=jest;SharedAccessKey=amVzdA==",
};

process.env = Object.assign(process.env, envs);
