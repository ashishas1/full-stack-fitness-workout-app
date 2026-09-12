import { Request } from "express";
import { Role } from "@prisma/client";

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: Role;
}

export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
}

export interface QueryParams {
  page?: string;
  limit?: string;
  sort?: string;
  order?: "asc" | "desc";
  search?: string;
}
