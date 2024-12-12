import Http, { HttpHandler } from "../../../middlewares/http";
import res from "../../../utils/apiResponse";
import { IEquipmentStatus, IReturn } from "../../../models/client/Equipment";
import EquipmentRepository from "../../../repositories/Equipment";
import UserRepository from "../../../repositories/User";
import { sendEmail } from "../../../services/email";

const handler: HttpHandler = async (conn, req) => {
  const { userId, allocationId } = req.params;
  const equipmentRepository = new EquipmentRepository(conn);
  const userRepository = new UserRepository(conn);
  let body = req.body as IReturn;

  const user = await userRepository.findById({
    id: userId,
  });

  if (!user) {
    return res.badRequest("Allocation not found");
  }

  const allocation = user.allocations.id(allocationId);

  if (!allocation) {
    return res.badRequest("Allocation not found");
  }
  const endDate = new Date();

  body = {
    ...body,
    createdBy: {
      _id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      matriculation: req.user.matriculation,
    },
  };

  allocation.endDate = endDate;

  const equipment = await equipmentRepository.findById({
    id: allocation.equipment,
  });

  if (equipment) {
    equipment.status = IEquipmentStatus.available;
    const equipmentAllocation = equipment.allocations.find(
      (alloc) => alloc.allocation.toString() === allocationId
    );
    if (equipmentAllocation) {
      equipmentAllocation.endDate = endDate;
    }

    equipmentAllocation.return = body;
    await equipment.save();
  }

  await user.save();

  const emailHtml = generateEmailHtml(body);

  await sendEmail(
    ["equipamentos@tech4h.com.br"],
    `Retorno de Equipamento - ${equipment.equipmentType} ${equipment.inventoryNumber}`,
    emailHtml,
    ""
  );

  return res.success(allocation);
};

export default new Http(handler)
  .setSchemaValidator((schema) => ({
    body: schema.object().shape({
      endDate: schema.string().optional(),
    }),
  }))
  .configure({
    name: "AllocationUpdate",
    permission: "allocation.update",
    options: {
      methods: ["PUT"],
      route: "user/{userId}/allocation/{allocationId}",
    },
  });

function generateEmailHtml(selectedReturn) {
  // Função para traduzir "yes"/"no" para "Sim"/"Não"
  const translateYesNo = (value) =>
    value === "yes" ? "Sim" : value === "no" ? "Não" : value;

  return `
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              background-color: #f9f9f9;
              margin: 0;
              padding: 20px;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background: #fff;
              border: 1px solid #ddd;
              border-radius: 8px;
              padding: 20px;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            h2 {
              color: #2c3e50;
            }
            h3 {
              color: #34495e;
              margin-top: 20px;
            }
            p {
              margin: 8px 0;
            }
            strong {
              color: #2c3e50;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>Detalhes do Retorno| Equipamento: ${
              selectedReturn.equipmentType
            } ${selectedReturn.inventoryNumber}</h2>
            
            <p><strong>Descrição:</strong> ${selectedReturn.description}</p>
            <p><strong>Backup no Drive:</strong> ${translateYesNo(
              selectedReturn.checklist.backup.backupToDrive
            )}</p>
            <p><strong>Arquivos Verificados:</strong> ${translateYesNo(
              selectedReturn.checklist.backup.verifyFilesIncluded
            )}</p>
            <p><strong>Backup Seguro:</strong> ${translateYesNo(
              selectedReturn.checklist.backup.secureBackup
            )}</p>
            <p><strong>Formatação Concluída:</strong> ${translateYesNo(
              selectedReturn.checklist.formattingCompleted
            )}</p>
            
            <h3>Danos Físicos</h3>
            <p><strong>Possui Danos Físicos:</strong> ${translateYesNo(
              selectedReturn.physicalDamages.additionalInfo.hasPhysicalDamage
            )}</p>
            <p><strong>Detalhes dos Danos:</strong> ${
              selectedReturn.physicalDamages.additionalInfo.damageDetails
            }</p>
            
            <h3>Danos nos Componentes</h3>
            <p><strong>Possui Danos nos Componentes:</strong> ${translateYesNo(
              selectedReturn.physicalDamages.componentDamage.hasComponentDamage
            )}</p>
            <p><strong>Detalhes dos Danos:</strong> ${
              selectedReturn.physicalDamages.componentDamage.damageDetails
            }</p>
            
            <p><strong>Acessórios Retornados:</strong> ${translateYesNo(
              selectedReturn.physicalDamages.accessoriesReturned
            )}</p>

            <h3>Informações Adicionais</h3>

            <p><strong>Data de Retorno:</strong> ${new Date().toLocaleDateString(
              "pt-BR"
            )}</p>
            
            <p>Feito por: <a href="mailto:${selectedReturn.createdBy.email}">${
    selectedReturn.createdBy.name
  }</a></p>

          </div>
        </body>
      </html>
    `;
}
