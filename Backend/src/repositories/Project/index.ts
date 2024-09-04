import { Connection } from "mongoose";
import Project, { IProject } from "../../models/client/Project";
import BaseRepository from "../base";

export default class ProjectRepository extends BaseRepository<IProject> {
  constructor(connection: Connection) {
    super(new Project(connection).model());
  }
}
