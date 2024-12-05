import { Connection } from "mongoose";
import BaseRepository from "../base";
import Equipment, { IEquipment } from "../../models/client/Equipment";

export default class EquipmentRepository extends BaseRepository<IEquipment> {
  constructor(connection: Connection) {
    super(new Equipment(connection).model());
  }
}
