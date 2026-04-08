export default interface IStatus {
  _id: string;
  name: string;
  type: "progress" | "done" | "canceled";
  order?: number;
}
