import { handler } from "./Export";
import ActivityRepository from "../../../repositories/Activity";
import BlobUploader from "../../../services/upload";
import PdfGenerator from "../../../services/pdf";
import ZipCreator from "../../../services/zip";
import res from "../../../utils/apiResponse";
import fs from "fs";
import path from "path";
import axios from "axios";

jest.mock("../../../repositories/Activity");
jest.mock("../../../services/upload");
jest.mock("../../../services/pdf");
jest.mock("../../../services/zip");
jest.mock("fs");
jest.mock("path");
jest.mock("axios");

describe("Export", () => {
  let conn;
  let req;
  let context;

  beforeEach(() => {
    conn = {
      model: () => ({
        findOne: jest.fn(),
        findById: jest.fn(),
      }),
    };
    req = {
      params: {
        id: "activityId",
      },
    };
    context = {};
  });

  it("should return 404 when activity not found", async () => {
    ActivityRepository.prototype.findById.mockResolvedValue(null);

    const result = await handler(conn, req, context);

    expect(result).toEqual(res.notFound("Activity not found"));
  });

  it("should return 200 when activity is successfully exported", async () => {
    const activity = {
      id: "activityId",
      form_draft: {
        fields: [
          {
            type: "File",
            value: {
              url: "http://example.com/file1",
            },
          },
        ],
      },
      interactions: [
        {
          answers: [
            {
              data: {
                fields: [
                  {
                    type: "File",
                    value: {
                      url: "http://example.com/file2",
                    },
                  },
                ],
              },
            },
          ],
        },
      ],
    };
    ActivityRepository.prototype.findById.mockResolvedValue(activity);

    const blobUploader = new BlobUploader("exports");
    BlobUploader.prototype.updateSas = jest.fn();
    BlobUploader.prototype.uploadBufferToBlob = jest.fn().mockResolvedValue({
      url: "http://example.com/export.zip",
    });

    const pdfGenerator = new PdfGenerator();
    PdfGenerator.prototype.generate = jest.fn().mockResolvedValue("/tmp/activity-activityId.pdf");

    const zipCreator = new ZipCreator();
    ZipCreator.prototype.create = jest.fn().mockResolvedValue("/tmp/activity-activityId.zip");
    ZipCreator.prototype.delete = jest.fn();

    fs.existsSync.mockReturnValue(false);
    fs.mkdirSync.mockReturnValue();
    fs.writeFileSync.mockReturnValue();
    fs.readFileSync.mockReturnValue(Buffer.from("zip content"));
    fs.unlinkSync.mockReturnValue();
    fs.rmdirSync.mockReturnValue();

    path.basename.mockImplementation((filePath) => filePath.split("/").pop());

    axios.get.mockResolvedValue({
      data: Buffer.from("file content"),
    });

    const result = await handler(conn, req, context);

    expect(result).toEqual(res.success({
      url: "http://example.com/export.zip",
    }));
    expect(blobUploader.updateSas).toHaveBeenCalledTimes(2);
    expect(pdfGenerator.generate).toHaveBeenCalledWith(activity);
    expect(zipCreator.create).toHaveBeenCalledWith(
      ["/tmp/activity-activityId.pdf", "/tmp/files/file1", "/tmp/files/file2"],
      "activity-activityId.zip"
    );
    expect(blobUploader.uploadBufferToBlob).toHaveBeenCalledWith(
      "activity-activityId.zip",
      "application/zip",
      Buffer.from("zip content")
    );
    expect(zipCreator.delete).toHaveBeenCalledWith("/tmp/activity-activityId.zip");
    expect(fs.unlinkSync).toHaveBeenCalledTimes(3);
    expect(fs.rmdirSync).toHaveBeenCalledWith("/tmp/activity-activityId", { recursive: true });
  });
});
