import { Response, NextFunction } from "express";
import { AuthRequest } from "../types/index.js";
import { UnauthorizedError, ForbiddenError } from "../utils/errors.js";
import { verifyAccessToken } from "../utils/security.js";
import { prisma } from "../config/database.js";
import { Role } from "@prisma/client";

export async function authenticate(req: AuthRequest, _res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(new UnauthorizedError("Authentication token is missing."));
  }

  const token = authHeader.split(" ")[1];
  try {
    const payload = verifyAccessToken(token);

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, role: true, status: true },
    });

    if (!user) {
      return next(new UnauthorizedError("User associated with this token no longer exists."));
    }

    if (user.status === "SUSPENDED") {
      return next(new ForbiddenError("Your account has been suspended. Please contact support."));
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    next();
  } catch (err: any) {
    if (err.name === "TokenExpiredError") {
      return next(new UnauthorizedError("Authentication token has expired. Please refresh."));
    }
    return next(new UnauthorizedError("Invalid authentication token."));
  }
}

export function authorize(...roles: (Role | Role[])[]) {
  const flatRoles = roles.flat();
  return (req: AuthRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new UnauthorizedError("Authentication required."));
    }

    if (flatRoles.length > 0 && !flatRoles.includes(req.user.role)) {
      return next(new ForbiddenError("You do not have permission to access this resource."));
    }

    next();
  };
}
