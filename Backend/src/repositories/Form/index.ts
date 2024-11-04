import { Connection } from "mongoose";
import Form, { IForm } from "../../models/client/Form";
import BaseRepository from "../base";
import moment from "moment";

/**
 * Repository class for handling Form data.
 */
export default class FormRepository extends BaseRepository<IForm> {
  constructor(connection: Connection) {
    super(new Form(connection).model());
  }

  /**
   * Finds open forms based on the provided query options.
   *
   * @param options - The query options for filtering, selecting, sorting, limiting, skipping, and populating the results.
   * @returns A promise that resolves to an array of open forms.
   */
  async findOpenForms(options: {
    where?: Parameters<BaseRepository<IForm>["find"]>[0]["where"];
    select?: Parameters<BaseRepository<IForm>["find"]>[0]["select"];
    sort?: Parameters<BaseRepository<IForm>["find"]>[0]["sort"];
    limit?: Parameters<BaseRepository<IForm>["find"]>[0]["limit"];
    skip?: Parameters<BaseRepository<IForm>["find"]>[0]["skip"];
    populate?: Parameters<BaseRepository<IForm>["find"]>[0]["populate"];
  }): Promise<IForm[]> {
    return this.find({
      where: {
        ...options.where,
        active: true,
        published: {
          $ne: null,
        },
        $and: [
          {
            $or: [
              {
                $and: [
                  {
                    "period.open": null,
                  },
                  {
                    "period.close": null,
                  },
                ],
              },
              {
                $and: [
                  {
                    "period.open": {
                      $lte: moment.utc().toDate(),
                    },
                  },
                  {
                    "period.close": {
                      $gte: moment.utc().toDate(),
                    },
                  },
                ],
              },
              {
                $and: [
                  {
                    "period.open": {
                      $lte: moment.utc().toDate(),
                    },
                  },
                  {
                    "period.close": null,
                  },
                ],
              },
            ],
          },
        ]
      },
      select: options.select,
      sort: options.sort,
      limit: options.limit,
      skip: options.skip,
      populate: options.populate,
    });
  }
}
