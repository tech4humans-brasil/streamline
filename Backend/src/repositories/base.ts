import {
  Model,
  Document,
  FilterQuery,
  UpdateQuery,
  QueryOptions,
  ObjectId,
} from "mongoose";

class BaseRepository<T extends Document> {
  protected model: Model<T>;

  constructor(model: Model<T>) {
    this.model = model;
  }

  async findById({
    id,
    select,
    populate,
  }: {
    id: string | ObjectId;
    select?: QueryOptions<T>["select"];
    populate?: [
      {
        path: string;
        select?: Record<string, number>;
      }
    ];
  }) {
    return this.model.findById(id).select(select).populate(populate).exec();
  }

  async findOne({
    where,
    select,
    populate,
  }: {
    where: FilterQuery<T>;
    select?: QueryOptions<T>["select"];
    populate?: {
      path: string;
      select?: Record<string, number>;
    }[];
  }): Promise<T | null> {
    return this.model.findOne(where).select(select).populate(populate).exec();
  }

  async find({
    where,
    select,
    sort,
    limit,
    skip,
    populate,
  }: {
    where?: FilterQuery<T>;
    select?: QueryOptions<T>["select"];
    sort?: QueryOptions<T>["sort"];
    limit?: number;
    skip?: number;
    populate?: {
      path: string;
      select?: Record<string, number>;
    }[];
  }): Promise<T[]> {
    return this.model
      .find(where)
      .select(select)
      .sort(sort)
      .limit(limit)
      .populate(populate)
      .skip(skip)
      .exec();
  }

  async create(data: Partial<T>): Promise<T> {
    return this.model.create(data);
  }

  async update({
    where,
    data,
  }: {
    where: FilterQuery<T>;
    data: UpdateQuery<T>;
  }): Promise<T | null> {
    return this.model.findOneAndUpdate(where, data, { new: true }).exec();
  }

  async updateMany({
    where,
    data,
  }: {
    where: Parameters<Model<T>["updateMany"]>[0];
    data: Parameters<Model<T>["updateMany"]>[1];
  }) {
    return this.model.updateMany(where, data).exec();
  }

  async findByIdAndUpdate({
    id,
    data,
  }: {
    id: string | ObjectId;
    data: UpdateQuery<T>;
  }): Promise<T | null> {
    return this.model
      .findByIdAndUpdate(id, data, {
        new: true,
      })
      .exec();
  }

  async count(props?: { where: FilterQuery<T> }): Promise<number> {
    return this.model.countDocuments(props?.where, {
      maxTimeMS: 1000,
    });
  }

  async delete({ where }: { where: FilterQuery<T> }) {
    return this.model.deleteMany(where).exec();
  }

  async distinct({
    field,
    where = {},
  }: {
    field: string;
    where?: FilterQuery<T>;
  }): Promise<any[]> {
    return this.model.distinct(field, where).exec();
  }
}

export default BaseRepository;
