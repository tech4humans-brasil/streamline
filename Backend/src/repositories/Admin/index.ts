import { Connection } from "mongoose";
import Admin, { IAdminClient } from "../../models/admin/Client";
import BaseRepository from "../base";

export default class AdminRepository extends BaseRepository<IAdminClient> {
  constructor(connection: Connection) {
    super(new Admin(connection).model());
  }
}
