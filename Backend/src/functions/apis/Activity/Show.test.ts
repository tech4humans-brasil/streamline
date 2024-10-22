import { handler } from "./Show";
import ActivityRepository from "../../../repositories/Activity";
import User from "../../../models/client/User";
import res from "../../../utils/apiResponse";
import BlobUploader from "../../../services/upload";

jest.mock("../../../repositories/Activity");
jest.mock("../../../models/client/User");
jest.mock("../../../services/upload");

describe("Show", () => {
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
      user: {
        id: "userId",
      },
    };
    context = {};
  });

  it("should return 404 when activity not found", async () => {
    ActivityRepository.prototype.findById.mockResolvedValue(null);

    const result = await handler(conn, req, context);

    expect(result).toEqual(res.notFound("Activity not found"));
  });

  it("should return 200 when activity is successfully retrieved", async () => {
    const activity = {
      form_draft: {
        fields: [
          { type: "File", value: { url: "fileUrl" } },
        ],
      },
      interactions: [
        {
          answers: [
            {
              data: {
                fields: [
                  { type: "File", value: { url: "fileUrl" } },
                ],
              },
            },
          ],
        },
      ],
    };
    ActivityRepository.prototype.findById.mockResolvedValue(activity);
    BlobUploader.prototype.updateSas.mockResolvedValue();

    const result = await handler(conn, req, context);

    expect(result).toEqual(res.success(activity));
    expect(BlobUploader.prototype.updateSas).toHaveBeenCalledTimes(2);
  });
});
