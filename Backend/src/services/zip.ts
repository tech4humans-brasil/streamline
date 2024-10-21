import archiver from "archiver";
import fs from "fs";
import path from "path";

class ZipCreator {
  async create(
    [pdfExport, ...files]: string[],
    exportName: string
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const zipPath = path.join("/tmp", exportName);
      const output = fs.createWriteStream(zipPath);
      const archive = archiver("zip", { zlib: { level: 9 } });

      output.on("close", () => {
        resolve(zipPath);
      });

      archive.on("error", (err) => {
        reject(err);
      });

      archive.pipe(output);

      const pdfName = path.basename(pdfExport);
      archive.file(pdfExport, { name: pdfName });

      if (files.length > 1) {
        for (const file of files) {
          const fileName = path.basename(file);
          archive.file(file, { name: `files/${fileName}` });
        }
      }

      archive.finalize();
    });
  }

  async delete(zipPath: string): Promise<void> {
    fs.unlinkSync(zipPath);
  }
}

export default ZipCreator;
