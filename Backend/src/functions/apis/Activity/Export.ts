import Http, { HttpHandler } from "../../../middlewares/http";
import res from "../../../utils/apiResponse";
import ActivityRepository from "../../../repositories/Activity";
import { FieldTypes } from "../../../models/client/FormDraft";
import BlobUploader, { FileUploaded } from "../../../services/upload";
import PdfGenerator from "../../../services/pdf";
import ZipCreator from "../../../services/zip";
import fs from "fs";
import path from "path";
import axios from "axios";

const handler: HttpHandler = async (conn, req) => {
  const { id } = req.params as { id: string };
  const activityRepository = new ActivityRepository(conn);

  const activity = await activityRepository.findById({ id });

  if (!activity) {
    return res.notFound("Activity not found");
  }

  const blobUploader = new BlobUploader(req.user.id);
  const files: FileUploaded[] = [];

  for (const field of activity.form_draft.fields) {
    if (field.type === FieldTypes.File && field.value) {
      await blobUploader.updateSas(field.value);
      files.push(field.value);
    }
  }

  for (const interaction of activity.interactions) {
    for (const answer of interaction.answers) {
      if (!answer.data) continue;
      for (const field of answer.data.fields) {
        if (field.type === FieldTypes.File && field.value) {
          await blobUploader.updateSas(field.value);
          files.push(field.value);
        }
      }
    }
  }

  const pdfGenerator = new PdfGenerator();
  const pdfPath = await pdfGenerator.generate(activity).catch((err) => {
    console.error("Error generating PDF", err);
    throw err;
  });

  const tempDir = path.join("/tmp", `activity-${activity.id}`);
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
  }

  const downloadedFiles: string[] = [];

  if (!fs.existsSync(path.join(tempDir, "files")) && files.length > 0) {
    fs.mkdirSync(path.join(tempDir, "files"));
  }

  for (const fileUrl of files) {
    const fileName = path.basename(fileUrl.url.split("?")[0]); // Remove query params
    const filePath = path.join(tempDir, "files", fileName);
    const response = await axios.get(fileUrl.url, {
      responseType: "arraybuffer",
    });
    fs.writeFileSync(filePath, response.data);
    downloadedFiles.push(filePath);
  }

  const zipCreator = new ZipCreator();
  const zipPath = await zipCreator
    .create([pdfPath, ...downloadedFiles], `activity-${activity.id}.zip`)
    .catch((err) => {
      console.error("Error generating ZIP", err);
      throw err;
    });

  const zipContent = fs.readFileSync(zipPath);

  const file = await blobUploader.uploadBufferToBlob(
    `activity-${activity.id}.zip`,
    "application/zip",
    zipContent
  );

  await zipCreator.delete(zipPath);
  fs.unlinkSync(pdfPath);
  for (const filePath of downloadedFiles) {
    fs.unlinkSync(filePath);
  }
  fs.rmdirSync(tempDir, { recursive: true });

  return res.success(file);
};

export default new Http(handler)
  .setSchemaValidator((schema) => ({
    params: schema.object({
      id: schema.string().required(),
    }),
  }))
  .configure({
    name: "ActivityExport",
    permission: "activity.read",
    options: {
      methods: ["GET"],
      route: "activity/{id}/export",
    },
  });
