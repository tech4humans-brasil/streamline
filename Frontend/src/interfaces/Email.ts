export default interface IEmail {
  _id: string;
  slug: string;
  subject: string;
  htmlTemplate: string;
  cssTemplate: string;
  project: string;
}
