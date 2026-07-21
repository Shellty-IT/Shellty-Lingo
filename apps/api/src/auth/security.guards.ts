import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
  UnauthorizedException,
  createParamDecorator,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { Request } from "express";

import { AuthService, type TokenPayload } from "./auth.service";

export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}

/**
 * Verifies the bearer token and attaches its payload to `request.user`, so
 * handlers read the caller through `@CurrentUser()` instead of re-parsing the
 * authorization header.
 */
@Injectable()
export class AccessGuard implements CanActivate {
  constructor(private readonly auth: AuthService) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    request.user = await this.auth.verifyAccess(
      request.header("authorization")?.replace(/^Bearer\s+/, ""),
    );
    return true;
  }
}

const ROLE_KEY = "shellty:minimumRole";

/** Minimum role for a route; `editor` also admits `admin`. Requires RolesGuard. */
export const RequireRole = (
  role: "editor" | "admin",
): MethodDecorator & ClassDecorator => SetMetadata(ROLE_KEY, role);

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}
  canActivate(context: ExecutionContext): boolean {
    const minimum = this.reflector.getAllAndOverride<
      "editor" | "admin" | undefined
    >(ROLE_KEY, [context.getHandler(), context.getClass()]);
    if (!minimum) return true;
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const role = request.user?.role;
    const allowed = minimum === "admin" ? ["admin"] : ["editor", "admin"];
    if (!role || !allowed.includes(role))
      throw new ForbiddenException({
        code: "FORBIDDEN",
        message: "Insufficient permissions.",
      });
    return true;
  }
}

/** Payload attached by AccessGuard; throws if the guard did not run. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): TokenPayload => {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!request.user) throw new UnauthorizedException();
    return request.user;
  },
);
