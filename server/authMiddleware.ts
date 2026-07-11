import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_KEY || "medicare_secret_jwt_key_98765";

export interface AuthenticatedRequest extends Request {
  body: {
    userId?: string;
    [key: string]: any;
  };
}

export default async function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<any> {
  try {
    const authorizationHeader = req.headers["authorization"];
    if (!authorizationHeader) {
      return res.status(401).json({
        message: "Authorization header missing",
        success: false,
      });
    }

    const parts = authorizationHeader.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer") {
      return res.status(401).json({
        message: "Authorization format must be Bearer <token>",
        success: false,
      });
    }

    const token = parts[1];
    jwt.verify(token, JWT_SECRET, (err, decoded: any) => {
      if (err) {
        return res.status(200).json({
          message: "Token is not valid",
          success: false,
        });
      } else {
        // Embed decoded userId in request body to match screenshot pattern: req.body.userId = decode.id
        req.body.userId = decoded.id;
        next();
      }
    });
  } catch (error) {
    console.error("Auth Middleware Error:", error);
    return res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
}
export { JWT_SECRET };
