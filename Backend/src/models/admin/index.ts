import fs from "fs";
import path from "path";

const models = {};
const basename = path.basename(__filename);

fs.readdirSync(__dirname)
  .filter((file) => {
    return !file.startsWith(".") && file !== basename && file.endsWith(".js");
  })
  .forEach((file) => {
    const model = require(path.join(__dirname, file));
    models[file.split(".")[0]] = model.schema;
  });

export default models;
