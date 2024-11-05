import sendgrid from "@sendgrid/mail";
import * as cheerio from "cheerio";

const sendgridApiKey = process.env.SENDGRID_API_KEY;

if (!sendgridApiKey) {
  throw new Error("SENDGRID_API_KEY not found");
}

sendgrid.setApiKey(sendgridApiKey);

export const sendEmail = async (
  to: string | Array<string>,
  subject: string,
  html: string,
  css: string,
  sender?: string
) => {
  const { html: htmlWithCid, attachments } = convertBase64ToCid(html, css);

  await sendgrid
    .send({
      from: sender || process.env.EMAIL_ACCOUNT, 
      to,
      subject,
      html: htmlWithCid,
      attachments,
      cc: sender || undefined,
    })
    .catch((err) => {
      throw err;
    });
};

function convertBase64ToCid(html, css) {
  const $ = cheerio.load(html);
  const attachments = [];

  $("img").each(function () {
    const src = $(this).attr("src");

    // Verificar se o src contém uma imagem base64
    if (src?.startsWith("data:")) {
      const cid = crypto.randomUUID(); // Gerar um CID único
      $(this).attr("src", `cid:${cid}`); // Substituir o src por cid

      const mimeType = src.substring(5, src.indexOf(";")); // Extrair o tipo MIME
      const base64Data = src.substring(src.indexOf(",") + 1); // Extrair dados em base64

      attachments.push({
        filename: `${cid}.${mimeType.split("/")[1]}`, // Nome de arquivo baseado no CID e tipo MIME
        content: base64Data,
        content_id: cid, // Content-ID para referência no e-mail
        disposition: "inline",
        type: mimeType, // Tipo MIME do arquivo
      });
    }
  });

  // add css inline
  const style = $("<style></style>").text(css);
  $("head").append(style);

  return {
    html: $.html(),
    attachments: attachments,
  };
}
