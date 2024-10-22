import { handler } from "./OpenForms";
import FormRepository from "../../../repositories/Form";
import InstituteRepository from "../../../repositories/Institute";
import res from "../../../utils/apiResponse";

jest.mock("../../../repositories/Form");
jest.mock("../../../repositories/Institute");
jest.mock("../../../utils/apiResponse");

describe("OpenForms API handler", () => {
  let mockConn;
  let mockReq;
  let mockRes;

  beforeEach(() => {
    mockConn = {};
    mockReq = {
      user: {
        institute: {
          _id: "institute1",
        },
      },
    };
    mockRes = {
      success: jest.fn(),
      notFound: jest.fn(),
    };

    FormRepository.mockClear();
    InstituteRepository.mockClear();
    res.success.mockClear();
    res.notFound.mockClear();
  });

  it("should return open forms", async () => {
    const mockForms = [
      {
        _id: "form1",
        name: "Form One",
        slug: "form-one",
        description: "Description One",
        period: {
          open: new Date(),
          close: new Date(),
        },
        published: true,
        visibilities: ["institute1"],
      },
    ];

    const mockInstitutes = [
      {
        _id: "institute1",
        name: "Institute One",
        acronym: "INST1",
      },
    ];

    FormRepository.prototype.findOpenForms.mockResolvedValue(mockForms);
    InstituteRepository.prototype.find.mockResolvedValue(mockInstitutes);

    await handler(mockConn, mockReq, mockRes);

    expect(FormRepository.prototype.findOpenForms).toHaveBeenCalledWith({
      where: {
        type: {
          $in: ["created", "external"],
        },
        $and: [
          {
            $or: [
              {
                institute: {
                  $elemMatch: {
                    _id: {
                      $in: mockReq.user.institute._id,
                    },
                  },
                },
              },
              {
                institute: {
                  $eq: null,
                },
              },
            ],
          },
        ],
      },
      select: {
        name: 1,
        slug: 1,
        url: 1,
        type: 1,
        description: 1,
        period: 1,
        published: 1,
        institute: 1,
        visibilities: 1,
      },
    });

    expect(InstituteRepository.prototype.find).toHaveBeenCalledWith({
      where: {
        _id: {
          $in: ["institute1"],
        },
      },
      select: {
        name: 1,
        slug: 1,
      },
    });

    expect(res.success).toHaveBeenCalledWith([
      {
        institute: mockInstitutes[0],
        forms: [mockForms[0]],
      },
    ]);
  });

  it("should return an empty array if no open forms are found", async () => {
    FormRepository.prototype.findOpenForms.mockResolvedValue([]);
    InstituteRepository.prototype.find.mockResolvedValue([]);

    await handler(mockConn, mockReq, mockRes);

    expect(FormRepository.prototype.findOpenForms).toHaveBeenCalledWith({
      where: {
        type: {
          $in: ["created", "external"],
        },
        $and: [
          {
            $or: [
              {
                institute: {
                  $elemMatch: {
                    _id: {
                      $in: mockReq.user.institute._id,
                    },
                  },
                },
              },
              {
                institute: {
                  $eq: null,
                },
              },
            ],
          },
        ],
      },
      select: {
        name: 1,
        slug: 1,
        url: 1,
        type: 1,
        description: 1,
        period: 1,
        published: 1,
        institute: 1,
        visibilities: 1,
      },
    });

    expect(InstituteRepository.prototype.find).toHaveBeenCalledWith({
      where: {
        _id: {
          $in: [],
        },
      },
      select: {
        name: 1,
        slug: 1,
      },
    });

    expect(res.success).toHaveBeenCalledWith([]);
  });

  it("should handle errors", async () => {
    const mockError = new Error("Database error");
    FormRepository.prototype.findOpenForms.mockRejectedValue(mockError);

    await handler(mockConn, mockReq, mockRes);

    expect(res.notFound).toHaveBeenCalledWith("Error retrieving open forms");
  });
});
