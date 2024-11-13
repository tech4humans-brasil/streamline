import Http, { HttpHandler } from "../../../middlewares/http";
import res from "../../../utils/apiResponse";
import { IUser } from "../../../models/client/User";
import AllocationRepository from "../../../repositories/Allocation";

interface DtoAllocation {
  user?: IUser;
  equipments?: string[];
  startDate?: Date;
  endDate?: Date;
  loanTermUrl?: string;
  returnNotes?: string;
  additionalNotes?: string;
}

const handler: HttpHandler = async (conn, req) => {
  const { id } = req.params;
  const { ...allocationData } = req.body as DtoAllocation;

  const allocationRepository = new AllocationRepository(conn);

  const updatedAllocation = await allocationRepository.findByIdAndUpdate({
    id,
    data: {
      ...allocationData
    },
  });

  if (!updatedAllocation) {
    return res.notFound("Allocation not found");
  }

  return res.success(updatedAllocation);
}

export default new Http(handler)
  .setSchemaValidator((schema) => ({
    body: schema.object().shape({
      user: schema.object().shape({
        _id: schema.string().optional(),
        name: schema.string().optional().min(3).max(255),
        email: schema.string().optional().email(),
        roles: schema
        .array(schema.mixed().oneOf(["admin", "student", "teacher"]))
        .optional(),
      }),
      equipments: schema.array().optional(),
      startDate: schema.date().optional(),
      endDate: schema.date().optional().nullable(),
      loanTermUrl: schema.string().optional().nullable(),
      returnNotes: schema.string().optional().nullable(),
      additionalNotes: schema.string().optional().nullable(),
    }),
    params: schema.object().shape({
      id: schema.string().required(),
    }),
  }))
  .configure({
    name: "AllocationUpdate",
    permission: "allocation.update",
    options: {
      methods: ["PUT"],
      route: "allocation/{id}",
    },
  });