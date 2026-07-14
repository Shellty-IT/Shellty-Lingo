import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from "@nestjs/common";
import type { Request } from "express";
import { AuthService } from "./auth.service";

const attempts = new Map<string, { count: number; reset: number }>();
@Injectable()
export class RateLimitGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const key = `${request.ip}:${request.path}`;
    const now = Date.now();
    const record = attempts.get(key);
    if (!record || record.reset < now) {
      attempts.set(key, { count: 1, reset: now + 60000 });
      return true;
    }
    if (++record.count > 10)
      throw new HttpException(
        { code: "RATE_LIMITED", message: "Too many attempts." },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    return true;
  }
}
@Injectable()
export class AccessGuard implements CanActivate {
  constructor(private readonly auth: AuthService) {}
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    this.auth.verifyAccess(
      request.header("authorization")?.replace(/^Bearer\s+/, ""),
    );
    return true;
  }
}
