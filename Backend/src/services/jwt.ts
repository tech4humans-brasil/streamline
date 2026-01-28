import * as jwt from "jsonwebtoken";

const secret = process.env.JWT_SECRET as string;
const secretResetPassword = process.env.JWT_RESET_PASSWORD_SECRET as string;

if (!secret || !secretResetPassword) {
  throw new Error("JWT_SECRET is not defined");
}

const sign = (
  payload: string | object | Buffer,
  expiresIn: jwt.SignOptions["expiresIn"] = "1d"
) => jwt.sign(payload, secret, { expiresIn });

const signResetPassword = (
  payload: string | object | Buffer,
  expiresIn: jwt.SignOptions["expiresIn"] = "10m"
) => jwt.sign(payload, secretResetPassword, { expiresIn });

const verifyResetPassword = <T>(header: Record<string, string | string[] | undefined>): T => {
  const token = getTokenFromHeaders(header);
  const err = {
    status: 401,
    message: "Unauthorized",
  };

  if (!token) {
    throw err;
  }

  return jwt.verify(token, secretResetPassword) as T;
};

const verify = <T>(header: Record<string, string | string[] | undefined>): T => {
  const token = getTokenFromHeaders(header);
  const err = {
    status: 401,
    message: "Unauthorized",
  };

  if (!token) {
    throw err;
  }

  return jwt.verify(token, secret) as T;
};

const decode = (token: string) => jwt.decode(token);

const getTokenFromHeaders = (headers: Record<string, string | string[] | undefined>) => {
  const authHeader = headers["authorization"] || headers["Authorization"];
  if (!authHeader || Array.isArray(authHeader)) {
    return null;
  }
  const token = authHeader.split(" ")[1];
  return token;
};

export default {
  sign,
  verify,
  decode,
  signResetPassword,
  verifyResetPassword,
};
