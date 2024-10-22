import { handler } from "./index";
import BlobUploader from "../../../services/upload";
import res from "../../../utils/apiResponse";
import { randomUUID } from "node:crypto";

jest.mock("../../../services/upload");
jest.mock("node:crypto", () => ({
  randomUUID: jest.fn(() => "random-uuid"),
}));

describe("ClientSasUrl", () => {
  let conn;
  let req;
  let context;

  beforeEach(() => {
    conn = {};
    req = {
      body: {
        fileName: "test-file.txt",
        mimeType: "text/plain",
        size: "1024",
      },
      user: {
        id: "user-id",
      },
    };
    context = {};
  });

  it("should return 201 with SAS URL and file details", async () => {
    const sasUrl = "https://example.com/sas-url";
    BlobUploader.prototype.getSasUrl.mockResolvedValue(sasUrl);

    const result = await handler(conn, req, context);

    expect(result).toEqual(
      res.created({
        fileName: "random-uuid@test-file.txt",
        url: sasUrl,
        containerName: "user-id",
      })
    );
    expect(BlobUploader.prototype.getSasUrl).toHaveBeenCalledWith({
      fileName: "random-uuid@test-file.txt",
      mimeType: "text/plain",
      size: "1024",
    });
  });

  it("should return 404 when user not found", async () => {
    req.user = null;

    const result = await handler(conn, req, context);

    expect(result).toEqual(res.notFound("User not found"));
  });
});
