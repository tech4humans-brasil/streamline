import { BlobSASPermissions, BlobServiceClient } from "@azure/storage-blob";
import { ObjectId } from "mongoose";
import { access } from "node:fs";

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

  async uploadBufferToBlob(
    blobName: string,
    contentType: string,
    content: Buffer
  ): Promise<FileUploaded> {
    blobName = `${Date.now()}@${blobName}`;

    const containerClient = this.blobServiceClient.getContainerClient(
      this.containerName
    );
    await containerClient.createIfNotExists({
      access: "blob",
    });
    const blobClient = containerClient.getBlockBlobClient(blobName);

    await blobClient.uploadData(content, {
      blobHTTPHeaders: { blobContentType: contentType },
    });

    return {
      name: blobName,
      url: blobClient.url,
      mimeType: contentType,
      size: content.byteLength.toString(),
      containerName: this.containerName,
    };
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
    await containerClient.createIfNotExists({
      access: "blob",
    });
    const buffer = Buffer.from(base64.split(",")[1], "base64");

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

  async updateSas(file: FileUploaded) {
    const containerClient = this.blobServiceClient.getContainerClient(
      file.containerName
    );
    const blockBlobClient = containerClient.getBlockBlobClient(file.name);
    const sas = await blockBlobClient.generateSasUrl({
      expiresOn: new Date(new Date().valueOf() + 86400),
      permissions: BlobSASPermissions.parse("r"),
    });
    file.url = sas;
    return file;
  }

  async getSasUrl(file: { fileName: string; mimeType: string; size: string }) {
    const containerClient = this.blobServiceClient.getContainerClient(
      String(this.containerName)
    );
    await containerClient.createIfNotExists({ access: "blob" });
    const blockBlobClient = containerClient.getBlockBlobClient(file.fileName);
    const sas = await blockBlobClient.generateSasUrl({
      expiresOn: new Date(new Date().valueOf() + 2 * 60 * 1000),
      permissions: BlobSASPermissions.parse("w"),
    });
    return sas;
  }
}

export default BlobUploader;
