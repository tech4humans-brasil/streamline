import { BlobSASPermissions, BlobServiceClient } from "@azure/storage-blob";
import { fileTypeFromBuffer } from "file-type";

const AZURE_STORAGE_CONNECTION_STRING =
  process.env.AZURE_STORAGE_CONNECTION_STRING;

if (!AZURE_STORAGE_CONNECTION_STRING) {
  throw new Error("AZURE_STORAGE_CONNECTION_STRING not found");
}

export interface FileUploaded {
  name: string;
  url: string;
  mimeType: string;
  size: string;
  containerName: string;
}

class BlobUploader {
  private blobServiceClient: BlobServiceClient;
  containerName: string;

  constructor(containerName: string) {
    this.blobServiceClient = BlobServiceClient.fromConnectionString(
      AZURE_STORAGE_CONNECTION_STRING
    );
    this.containerName = containerName;
  }

  private async validateBlob(content: Buffer, mimeType: string): Promise<void> {

    const type = await fileTypeFromBuffer(content);

    if (type && type.mime !== mimeType) {
      const aliases: Record<string, string[]> = {
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
          "application/xlsx",
        ],
        "application/vnd.ms-excel": ["application/xls"],
        "application/gzip": ["application/x-gzip"],
      };

      const allowedAliases = aliases[type.mime];
      if (allowedAliases && allowedAliases.includes(mimeType)) {
        return;
      }

      throw new Error(
        `Invalid file type. Expected ${mimeType}, but got ${type.mime}`
      );
    }

    if (
      !type &&
      (mimeType.startsWith("image/") || mimeType === "application/pdf")
    ) {
      throw new Error(`Invalid file type. Expected ${mimeType}`);
    }
  }

  async uploadBufferToBlob(
    blobName: string,
    contentType: string,
    content: Buffer
  ): Promise<FileUploaded> {
    await this.validateBlob(content, contentType);

    blobName = `${Date.now()}@${blobName}`;

    const containerClient = this.blobServiceClient.getContainerClient(
      this.containerName
    );
    await containerClient.createIfNotExists();
    const blobClient = containerClient.getBlockBlobClient(blobName);

    await blobClient.uploadData(content, {
      blobHTTPHeaders: { blobContentType: contentType },
    });

    const fileUploaded = await this.updateSas({
      name: blobName,
      url: blobClient.url,
      mimeType: contentType,
      size: content.byteLength.toString(),
      containerName: this.containerName,
    });

    return fileUploaded;
  }

  async uploadFileToBlob(
    name: string,
    mimeType: string,
    base64: string
  ): Promise<FileUploaded> {
    name = `${Date.now()}@${name}`;
    const containerClient = this.blobServiceClient.getContainerClient(
      String(this.containerName)
    );
    await containerClient.createIfNotExists();
    const buffer = Buffer.from(base64.split(",")[1], "base64");

    await this.validateBlob(buffer, mimeType);

    const blockBlobClient = containerClient.getBlockBlobClient(name);
    await blockBlobClient.upload(buffer, Buffer.byteLength(base64), {
      blobHTTPHeaders: {
        blobContentType: mimeType,
      },
    });

    const fileUploaded: FileUploaded = {
      name,
      url: blockBlobClient.url,
      mimeType: mimeType,
      size: Buffer.byteLength(base64).toString(),
      containerName: String(this.containerName),
    };

    return fileUploaded;
  }

  async validateStoredFile(file: FileUploaded): Promise<void> {
    const containerClient = this.blobServiceClient.getContainerClient(
      file.containerName || this.containerName
    );
    const blobClient = containerClient.getBlockBlobClient(file.name);

    const properties = await blobClient.getProperties();
    const size = properties.contentLength;

    if (!size) {
      throw new Error("File is empty");
    }
  }

  async updateSas(
    file: FileUploaded,
    expiresOn = 86400
  ): Promise<FileUploaded> {
    const containerClient = this.blobServiceClient.getContainerClient(
      file.containerName
    );
    const blockBlobClient = containerClient.getBlockBlobClient(file.name);
    const sas = await blockBlobClient.generateSasUrl({
      expiresOn: new Date(new Date().valueOf() + expiresOn),
      permissions: BlobSASPermissions.parse("r"),
    });
    file.url = sas;
    return file;
  }

  async getSasUrl(file: { fileName: string; mimeType: string; size: string }) {
    const containerClient = this.blobServiceClient.getContainerClient(
      String(this.containerName)
    );
    await containerClient.createIfNotExists();
    const blockBlobClient = containerClient.getBlockBlobClient(file.fileName);
    const sas = await blockBlobClient.generateSasUrl({
      expiresOn: new Date(new Date().valueOf() + 2 * 60 * 1000),
      permissions: BlobSASPermissions.parse("w"),
    });
    return sas;
  }
}

export default BlobUploader;
