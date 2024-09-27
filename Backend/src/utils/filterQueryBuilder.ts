import { ObjectId } from "mongoose";

export enum WhereEnum {
  EQUAL = "equal",
  NUMBER = "number",
  BOOLEAN = "boolean",
  DATE = "date",
  ARRAY = "array",
  ILIKE = "ilike",
  CUSTOM = "custom",
}

type WhereType = WhereEnum | { type: WhereEnum; alias: string };

type IWhereType = Record<string, WhereType>;

export default class FilterQueryBuilder {
  private types: IWhereType;
  private customTypes: Record<string, any>;

  constructor(types: IWhereType, customTypes?: Record<string, any>) {
    this.types = types;
    this.customTypes = customTypes || {};
  }

  public build(
    filters: Record<string, string | boolean | number>
  ): Record<string, any> {
    const where: Record<string, any> = {};

    Object.entries(filters).forEach(([key, value]) => {
      if (Object.keys(this.types).indexOf(key) === -1) return;

      if (value) {
        const filter = this.buildFilter(key, value);
        const type = this.types[key];

        if (typeof type === "object" && typeof type.alias === "string") {
          where[type.alias] = filter;
        } else {
          where[key] = filter;
        }
      }
    });

    return where;
  }

  private buildFilter(key: string, value: any): any {
    const type = this.types[key];

    if (typeof type === "string") {
      return this.buildFilterByType(type, value, key);
    }

    return this.buildFilterByType(type.type, value, key);
  }

  private buildFilterByType(type: WhereType, value: any, key: string): any {
    switch (type) {
      case WhereEnum.NUMBER:
        return parseFloat(value);
      case WhereEnum.BOOLEAN:
        return value === "true";
      case WhereEnum.DATE:
        return new Date(value);
      case WhereEnum.ARRAY:
        return value.split(",");
      case WhereEnum.ILIKE:
        return {
          $regex: value,
          $options: "i",
        };
      case WhereEnum.CUSTOM:
        return this.customTypes[key](value);
      default:
        return value;
    }
  }
}
