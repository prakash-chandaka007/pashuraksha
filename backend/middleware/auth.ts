import { Request, Response, NextFunction } from "express";
import { db } from "../lib/services/db";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

/**
 * Middleware to authenticate requests using Auth.js session database lookup.
 */
export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    // Support X-User-Id header fallback (essential for NextAuth JWT session strategy across ports)
    const headerUserId = req.headers["x-user-id"] || req.headers["X-User-Id"];
    if (headerUserId && typeof headerUserId === "string") {
      const user = await db.user.findUnique({
        where: { id: headerUserId },
      });
      if (user) {
        req.user = {
          id: user.id,
          email: user.email || "",
          role: user.role || "",
        };
        return next();
      }
    }

    const sessionToken =
      req.cookies["authjs.session-token"] ||
      req.cookies["__Secure-authjs.session-token"] ||
      req.headers["x-session-token"];

    if (!sessionToken || typeof sessionToken !== "string") {
      return res.status(401).json({
        error: "Unauthorized access. Please log in first.",
      });
    }

    // Lookup session in PostgreSQL sharing database
    const session = await db.session.findUnique({
      where: { sessionToken },
      include: { user: true },
    });

    if (!session) {
      return res.status(401).json({
        error: "Session invalid or expired.",
      });
    }

    if (session.expires < new Date()) {
      return res.status(401).json({
        error: "Session has expired.",
      });
    }

    req.user = {
      id: session.user.id,
      email: session.user.email || "",
      role: session.user.role || "",
    };

    next();
  } catch (error: unknown) {
    console.error("Authentication middleware error:", error);
    return res.status(500).json({
      error: "Internal authentication error.",
    });
  }
}
