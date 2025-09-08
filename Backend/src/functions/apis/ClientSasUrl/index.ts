import Http, { HttpHandler } from "../../../middlewares/http";
import res from "../../../utils/apiResponse";
import BlobUploader from "../../../services/upload";
import { randomUUID } from "node:crypto";

type DtoCreated = {
  fileName: string;
  mimeType: string;
  size: string;
};

const handler: HttpHandler = async (conn, req) => {
  const rest = req.body as DtoCreated;
  const { fileName, mimeType, size } = rest;

  const blobUploader = new BlobUploader(req.user.id);

  const newFileName = randomUUID() + "@" + fileName;

  const sasUrl = await blobUploader.getSasUrl({
    fileName: newFileName,
    mimeType,
    size,
  });

  return res.created({
    fileName: newFileName,
    url: sasUrl,
    containerName: req.user.id,
  });
};

export default new Http(handler)
  .setSchemaValidator((schema) => ({
    body: schema.object().shape({
      fileName: schema.string().required().min(3).max(255),
      mimeType: schema
        .mixed()
        .oneOf([
          "image/jpeg",
          "image/png",
          "image/gif",
          "application/pdf",
          "application/zip",
          "application/x-rar-compressed",
          "application/x-7z-compressed",
          "application/x-tar",
          "application/x-gzip",
          "application/xlsx",
          "application/xls",
          "application/csv",
          "application/json",
          "application/xml",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        ])
        .required(),
      size: schema.string().required().min(3).max(255),
    }),
  }))
  .configure({
    name: "ClientSasUrl",
    options: {
      methods: ["POST"],
      route: "client-sas",
    },
  });
