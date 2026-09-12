import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";
import { ValidationError } from "../utils/errors.js";

export interface ValidationTargets {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

export function validate(
  schemaOrTargets: ZodSchema | ValidationTargets,
  target: "body" | "query" | "params" = "body"
) {
  const schemas: ValidationTargets =
    "parseAsync" in schemaOrTargets || "parse" in schemaOrTargets || "safeParse" in schemaOrTargets
      ? { [target]: schemaOrTargets as ZodSchema }
      : (schemaOrTargets as ValidationTargets);

  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (schemas.body) {
        req.body = await schemas.body.parseAsync(req.body);
      }
      if (schemas.query) {
        req.query = await schemas.query.parseAsync(req.query);
      }
      if (schemas.params) {
        req.params = await schemas.params.parseAsync(req.params);
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details = error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
          code: err.code,
        }));
        return next(new ValidationError("Request validation failed", details));
      }
      next(error);
    }
  };
}
