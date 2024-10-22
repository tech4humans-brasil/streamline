import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import {
  IActivity,
  IActivityInteractions,
  IActivityStepStatus,
  IUserChild,
} from "../models/client/Activity";
import { FieldTypes } from "../models/client/FormDraft";

class PdfGenerator {
  async generate(activityModel: IActivity): Promise<string> {
    const activity: IActivity = activityModel.toObject();

    return new Promise((resolve, reject) => {
      const pdfPath = path.join("/tmp", `activity-${activity._id}.pdf`);
      const doc = new PDFDocument({ margin: 50 });
      const writeStream = fs.createWriteStream(pdfPath);

      doc.pipe(writeStream);

      // Definir fontes
      doc.registerFont("Helvetica", "Helvetica");
      doc.registerFont("Helvetica-Bold", "Helvetica-Bold");
      doc.registerFont("Helvetica-Oblique", "Helvetica-Oblique");

      // Gerar seções do documento
      this.generateHeader(doc, activity);
      this.generateBasicInfo(doc, activity);
      this.generateUsersSection(doc, activity);
      this.generateFormSection(doc, activity);
      this.generateInteractionsSection(doc, activity);

      // Finalizar o documento
      doc.end();

      writeStream.on("finish", () => {
        resolve(pdfPath);
      });

      writeStream.on("error", (error) => {
        reject(error);
      });
    });
  }

  private generateHeader(doc: PDFDocument, activity: IActivity) {
    doc
      .font("Helvetica-Bold")
      .fontSize(20)
      .text(`${activity.name} - #${activity.protocol}`, {
        align: "center",
      })
      .moveDown();
  }

  private generateBasicInfo(doc: PDFDocument, activity: IActivity) {
    doc.fontSize(12).font("Helvetica");

    const info = [
      { label: "ID", value: activity._id },
      { label: "Protocolo", value: activity.protocol },
      { label: "Automático", value: activity.automatic ? "Sim" : "Não" },
      { label: "Descrição", value: activity.description || "N/A" },
      {
        label: "Criado em",
        value: new Date(activity.createdAt).toLocaleString(),
      },
      {
        label: "Atualizado em",
        value: new Date(activity.updatedAt).toLocaleString(),
      },
      {
        label: "Finalizado em",
        value: activity.finished_at
          ? new Date(activity.finished_at).toLocaleString()
          : "N/A",
      },
    ];

    info.forEach((item) => {
      doc.font("Helvetica").text(`${item.label}: `, { continued: true });
      doc.font("Helvetica-Bold").text(`${item.value}`);
    });
    doc.moveDown();
  }

  private generateUsersSection(doc: PDFDocument, activity: IActivity) {
    doc.font("Helvetica-Bold").fontSize(14).text("Usuários Envolvidos:");
    doc.moveDown(0.5);

    doc.font("Helvetica").fontSize(12);
    activity.users.forEach((user: IUserChild) => {
      doc.font("Helvetica").text(`- `, { continued: true });
      doc.font("Helvetica-Bold").text(`${user.name} `, { continued: true });
      doc.font("Helvetica").text(`(${user.email})`);
    });
    doc.moveDown();
  }

  private generateFormSection(doc: PDFDocument, activity: IActivity) {
    doc.font("Helvetica-Bold").fontSize(14).text("Formulário:");
    doc.moveDown(0.5);

    doc.font("Helvetica").fontSize(12);

    activity.form_draft.fields.forEach((field) => {
      const { label, value, type } = field;

      if (!value) {
        return;
      }

      doc.font("Helvetica").text(`${label}: `, { continued: true });
      doc.font("Helvetica-Bold");

      if (type === "file") {
        doc.text("Em anexo");
      } else if ([FieldTypes.Radio, FieldTypes.Select].includes(type)) {
        const selectedOption = field.options.find(
          (o) => "value" in o && o.value === value
        )?.label;
        doc.text(selectedOption || "");
      } else if (
        type === FieldTypes.Checkbox ||
        type === FieldTypes.MultiSelect
      ) {
        const selectedOptions = value
          .split(",")
          .map((optionValue) => {
            const option = field.options.find(
              (o) => "value" in o && o.value === optionValue
            );
            return option ? option.label : optionValue;
          })
          .join(", ");
        doc.text(selectedOptions);
      } else {
        doc.text(value);
      }
      doc.moveDown();
    });
  }

  private generateInteractionsSection(doc: PDFDocument, activity: IActivity) {
    if (activity.interactions && activity.interactions.length > 0) {
      doc.font("Helvetica-Bold").fontSize(14).text("Interações:");
      doc.moveDown(0.5);

      activity.interactions.forEach((interaction: IActivityInteractions) => {
        doc
          .moveTo(doc.x, doc.y)
          .lineTo(doc.page.width - doc.page.margins.right, doc.y)
          .stroke();
        doc.moveDown(0.5);
        doc
          .font("Helvetica-Bold")
          .fontSize(12)
          .text(`${interaction.form.name}:`);
        doc.moveDown(0.5);

        // Respostas
        if (interaction.answers && interaction.answers.length > 0) {
          doc.font("Helvetica-Bold").text("Respostas:");
          doc.moveDown(0.5);

          interaction.answers.forEach((answer) => {
            if (!answer.data) return;

            doc.font("Helvetica").text(`Usuário: `, { continued: true });
            doc
              .font("Helvetica-Bold")
              .text(`${answer.user.name}`, { continued: true });
            doc.font("Helvetica").text(`, Status: `, { continued: true });
            doc
              .font("Helvetica-Bold")
              .text(
                `${
                  answer.status === IActivityStepStatus.finished
                    ? "Finalizado"
                    : "Pendente"
                }`
              );
            doc.moveDown(0.5);

            if (answer.data) {
              answer.data.fields.forEach((field) => {
                const { label, value, type } = field;

                if (!value) {
                  return;
                }

                doc
                  .font("Helvetica")
                  .text(` - ${label}: `, { continued: true });
                doc.font("Helvetica-Bold");

                if (type === "file") {
                  doc.text(field.value.name);
                } else if (
                  [FieldTypes.Radio, FieldTypes.Select].includes(type)
                ) {
                  const selectedOption = field.options.find(
                    (o) => "value" in o && o.value === value
                  )?.label;
                  doc.text(selectedOption || "");
                } else if (
                  type === FieldTypes.Checkbox ||
                  type === FieldTypes.MultiSelect
                ) {
                  const selectedOptions = value
                    .split(",")
                    .map((optionValue) => {
                      const option = field.options.find(
                        (o) => "value" in o && o.value === optionValue
                      );
                      return option ? option.label : optionValue;
                    })
                    .join(", ");
                  doc.text(selectedOptions);
                } else {
                  doc.text(value);
                }
                doc.moveDown();
              });
            }
          });
        }
        doc
          .moveTo(doc.x, doc.y)
          .lineTo(doc.page.width - doc.page.margins.right, doc.y)
          .stroke();

        doc.moveDown();
      });
    }
  }
}

export default PdfGenerator;
