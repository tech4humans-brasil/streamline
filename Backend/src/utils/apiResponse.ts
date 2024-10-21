import { HttpResponseInit } from "@azure/functions";
import { StatusCodes, getReasonPhrase } from "http-status-codes";
import moment from "moment";

const response = (
  status: StatusCodes,
  data: any,
  err = null
): HttpResponseInit => ({
  status,
  body: JSON.stringify(
    {
      status,
      message: err ?? (getReasonPhrase(status) || "Unknown error"),
      data,
      timestamp: moment.utc().toISOString(),
    },
    null,
    2
  ),
  headers: {
    "Content-Type": "application/json",
  },
});

export const success = (body: any): HttpResponseInit =>
  response(StatusCodes.OK, body);

export const created = (body: any): HttpResponseInit =>
  response(StatusCodes.CREATED, body);

export const badRequest = (message: string): HttpResponseInit =>
  response(StatusCodes.BAD_REQUEST, null, message);

export const unauthorized = (message: string): HttpResponseInit =>
  response(StatusCodes.UNAUTHORIZED, null, message);

export const forbidden = (message: string): HttpResponseInit =>
  response(StatusCodes.FORBIDDEN, null, message);

export const notFound = (message: string): HttpResponseInit =>
  response(StatusCodes.NOT_FOUND, null, message);

export const internalServerError = (): HttpResponseInit =>
  response(StatusCodes.INTERNAL_SERVER_ERROR, null, "Internal server error");

export const custom = (data: HttpResponseInit): HttpResponseInit =>
  data;

export const error = (
  status: number,
  body: any,
  message: any
): HttpResponseInit => response(status, null, message);

export default {
  success,
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  internalServerError,
  error,
  created,
  custom,
};
