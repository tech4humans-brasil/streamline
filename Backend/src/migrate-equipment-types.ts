import { Connection } from "mongoose";
import Equipment from "./models/client/Equipment";

/**
 * Mapeamento de variantes de equipmentType para valores base padronizados
 * Base: valor padronizado que deve ser usado no banco
 * Variants: valores incorretos/antigos que devem ser substituídos
 */
const typesMapping = [
  {
    base: "suporte-notebook",
    variants: ["suporte de notebook", "suporte notebook", "Suporte Notebook"],
  },
  {
    base: "hub-usb",
    variants: ["hub usb", "Hub USB", "hub USB"],
  },
  {
    base: ""
  }
  // Adicione mais mapeamentos conforme necessário
];

async function migrateEquipmentTypes(conn: Connection) {
  console.log("🚀 Iniciando migração de tipos de equipamentos...");

  const EquipmentModel = new Equipment(conn).model();

  // Contar total de equipamentos
  const totalEquipments = await EquipmentModel.countDocuments({});
  console.log(`📊 Total de equipamentos no banco: ${totalEquipments}`);

  let totalModified = 0;
  let totalChecked = 0;

  // Processar cada mapeamento
  for (const mapping of typesMapping) {
    console.log(`\n🔍 Processando tipo: "${mapping.base}"`);
    console.log(`   Buscando variantes: ${mapping.variants.map(v => `"${v}"`).join(", ")}`);

    // Buscar todos os equipamentos que têm alguma das variantes
    const equipments = await EquipmentModel.find({
      equipmentType: { $in: mapping.variants },
    });

    console.log(`   📝 Encontrados: ${equipments.length} equipamentos`);
    totalChecked += equipments.length;

    if (equipments.length === 0) {
      console.log(`   ⚠️  Nenhum equipamento com variantes encontrado.`);
      continue;
    }

    // Atualizar todos os equipamentos encontrados para o valor base
    const updateResult = await EquipmentModel.updateMany(
      { equipmentType: { $in: mapping.variants } },
      { $set: { equipmentType: mapping.base } }
    );

    console.log(`   ✅ Atualizados: ${updateResult.modifiedCount} equipamentos`);
    totalModified += updateResult.modifiedCount;

    // Mostrar exemplos dos equipamentos atualizados (primeiros 3)
    if (equipments.length > 0) {
      const examples = equipments.slice(0, 3);
      console.log(`   📋 Exemplos atualizados:`);
      for (const eq of examples) {
        console.log(`      - ID: ${eq._id} | Antigo: "${eq.equipmentType}" → Novo: "${mapping.base}"`);
      }
      if (equipments.length > 3) {
        console.log(`      ... e mais ${equipments.length - 3} equipamento(s)`);
      }
    }
  }

  // Verificação final - buscar possíveis variantes não mapeadas
  console.log("\n🔍 Verificando se existem outras variantes não mapeadas...");
  
  // Valores base válidos (do constants.ts do frontend)
  const validTypes = [
    "notebook",
    "monitor",
    "suporte-notebook",
    "impressora",
    "headset",
    "mouse-keyboard",
    "mouse",
    "cadeira",
    "mesa",
    "hub-usb",
  ];

  const unmappedEquipments = await EquipmentModel.find({
    equipmentType: { $nin: validTypes },
  }).limit(10);

  if (unmappedEquipments.length > 0) {
    console.log(`⚠️  ATENÇÃO: Encontrados ${unmappedEquipments.length} equipamentos com tipos não padronizados:`);
    for (const eq of unmappedEquipments) {
      console.log(`   - ID: ${eq._id} | Tipo: "${eq.equipmentType}"`);
    }
    console.log(`   ⚠️  Considere adicionar esses tipos ao mapeamento!`);
  } else {
    console.log(`✅ Todos os equipamentos possuem tipos padronizados!`);
  }

  // Estatísticas finais
  console.log("\n" + "=".repeat(60));
  console.log("✅ MIGRAÇÃO DE TIPOS CONCLUÍDA!");
  console.log("=".repeat(60));
  console.log(`📊 Estatísticas:`);
  console.log(`   - Total de equipamentos: ${totalEquipments}`);
  console.log(`   - Equipamentos verificados: ${totalChecked}`);
  console.log(`   - Equipamentos atualizados: ${totalModified}`);
  console.log(`   - Mapeamentos processados: ${typesMapping.length}`);
  console.log("=".repeat(60));
}

export default migrateEquipmentTypes;

