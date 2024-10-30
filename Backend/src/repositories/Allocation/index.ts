import { Connection } from "mongoose";
import BaseRepository from "../base";
import Allocation, { IAllocation } from "../../models/client/Allocation";

export default class AllocationRepository extends BaseRepository<IAllocation> {
  constructor(connection: Connection) {
    super(new Allocation(connection).model());
  }
}
