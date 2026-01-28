import { Connection, Schema } from "mongoose";
import Equipment from "./models/client/Equipment";

async function migrateToNewInventorySystem(conn: Connection) {
  console.log("🚀 Iniciando migração de sistema de inventário...");

  const EquipmentModel = new Equipment(conn).model();
  
  // Criar/Obter o Counter model
  let CounterModel;
  try {
    CounterModel = conn.model("Counter");
  } catch (error) {
    // Se não existir, criar o schema e registrar
    const counterSchema = new Schema({
      _id: { type: String, required: true },
      seq: { type: Number, default: 0 },
    });
    CounterModel = conn.model("Counter", counterSchema);
  }

  // 1. Contar quantos equipamentos existem
  const totalEquipments = await EquipmentModel.countDocuments({});
  console.log(`📊 Total de equipamentos no banco: ${totalEquipments}`);

  // 2. Renomear TODOS os campos 'inventoryNumber' para 'legacyInventoryNumber'
  const renameResult = await EquipmentModel.collection.updateMany(
    { 
      inventoryNumber: { $exists: true } 
    },
    { 
      $rename: { "inventoryNumber": "legacyInventoryNumber" } 
    }
  );
  
  console.log(`✅ Campos renomeados: ${renameResult.modifiedCount} documentos.`);

  // 3. Buscar TODOS os equipamentos que agora não têm inventoryNumber
  const equipments = await EquipmentModel.find({ 
    inventoryNumber: { $exists: false }
  }).sort({ createdAt: 1 }).lean();

  console.log(`📝 Equipamentos para numerar: ${equipments.length}`);

  if (equipments.length === 0) {
    console.log("⚠️  Nenhum equipamento precisa ser numerado. Migração já foi executada?");
    return;
  }

  // 4. Processar em lotes menores para evitar timeout
  const BATCH_SIZE = 50; // Processar 50 equipamentos por vez
  let currentId = 1;
  let totalModified = 0;

  console.log(`💾 Processando ${equipments.length} equipamentos em lotes de ${BATCH_SIZE}...`);
  
  for (let i = 0; i < equipments.length; i += BATCH_SIZE) {
    const batch = equipments.slice(i, i + BATCH_SIZE);
    const bulkOps = [];
    
    for (const doc of batch) {
      bulkOps.push({
        updateOne: {
          filter: { _id: doc._id },
          update: { $set: { inventoryNumber: currentId } },
        }
      });
      currentId++;
    }
    
    // Executar este lote
    const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(equipments.length / BATCH_SIZE);
    console.log(`   Lote ${batchNumber}/${totalBatches}: processando ${bulkOps.length} equipamentos...`);
    
    const bulkResult = await EquipmentModel.bulkWrite(bulkOps);
    totalModified += bulkResult.modifiedCount;
    console.log(`   ✓ ${bulkResult.modifiedCount} atualizados`);
  }

  console.log(`✅ Total de equipamentos atualizados: ${totalModified}`);
  
  // 6. Criar/Atualizar o contador
  const finalSeq = currentId - 1;
  
  const counterResult = await CounterModel.findOneAndUpdate(
    { _id: "equipment_inventory_id" },
    { $set: { seq: finalSeq } },
    { upsert: true, new: true }
  );
  
  console.log(`✅ Counter criado/atualizado: seq = ${counterResult.seq}`);
  console.log(`   Próximo equipamento receberá o ID: ${counterResult.seq + 1}`);
  
  // 7. Verificação final
  const verification = await EquipmentModel.countDocuments({
    inventoryNumber: { $type: "number" }
  });
  
  console.log("\n" + "=".repeat(50));
  console.log("✅ MIGRAÇÃO CONCLUÍDA COM SUCESSO!");
  console.log("=".repeat(50));
  console.log(`📊 Estatísticas:`);
  console.log(`   - Equipamentos renomeados: ${renameResult.modifiedCount}`);
  console.log(`   - Equipamentos numerados: ${totalModified}`);
  console.log(`   - Verificação (com número): ${verification}`);
  console.log(`   - Contador atual: ${finalSeq}`);
  console.log(`   - Próximo ID automático: ${finalSeq + 1}`);
  console.log("=".repeat(50));
}

export default migrateToNewInventorySystem;