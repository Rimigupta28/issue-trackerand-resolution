import jwt from "jsonwebtoken";
import { z } from "zod";
import { prisma } from "./db.js";

export class HttpError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function validate(schema, source = "body") {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      return next(new HttpError(
        400,
        "VALIDATION_ERROR",
        "Request validation failed.",
        result.error.issues.map((issue) => ({
          field: issue.path.join(".") || source,
          message: issue.message,
        })),
      ));
    }
    req.validated ??= {};
    req.validated[source] = result.data;
    return next();
  };
}

export async function requireAuth(req, res, next) {
  try {
    const header = req.get("authorization") || "";
    const match = header.match(/^Bearer\s+(.+)$/i);
    if (!match) throw new HttpError(401, "UNAUTHORIZED", "Authentication is required.");

    let payload;
    try {
      payload = jwt.verify(match[1], process.env.JWT_SECRET);
    } catch {
      throw new HttpError(401, "UNAUTHORIZED", "Authentication is required.");
    }
    const userId = typeof payload?.sub === "string" && /^\d+$/.test(payload.sub)
      ? Number(payload.sub)
      : payload?.sub;
    if (!payload || typeof payload !== "object" || !Number.isInteger(userId) || userId <= 0) {
      throw new HttpError(401, "UNAUTHORIZED", "Authentication is required.");
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, active: true },
    });
    if (!user?.active) throw new HttpError(401, "UNAUTHORIZED", "Authentication is required.");
    req.user = user;
    return next();
  } catch (error) {
    return next(error);
  }
}

export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);

  if (error instanceof SyntaxError && error.status === 400 && "body" in error) {
    return res.status(400).json({
      error: { code: "INVALID_JSON", message: "Request body must contain valid JSON." },
    });
  }
  if (error instanceof z.ZodError) {
    return res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Request validation failed.",
        details: error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      },
    });
  }
  if (error instanceof HttpError) {
    return res.status(error.status).json({
      error: {
        code: error.code,
        message: error.message,
        ...(error.details ? { details: error.details } : {}),
      },
    });
  }
  if (error?.code === "P2002") {
    return res.status(409).json({
      error: { code: "CONFLICT", message: "A record with this value already exists." },
    });
  }

  console.error("Unhandled API error", {
    method: req.method,
    path: req.path,
    message: error?.message,
  });
  return res.status(500).json({
    error: { code: "INTERNAL_ERROR", message: "An unexpected server error occurred." },
  });
}
