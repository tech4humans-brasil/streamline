import { Connection } from "mongoose";
import Callback, { ICallback } from "../../models/client/Callback";
import BaseRepository from "../base";

export default class CallbackRepository extends BaseRepository<ICallback> {
  constructor(connection: Connection) {
    super(new Callback(connection).model());
  }
}
