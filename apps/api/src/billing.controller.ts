import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  UseGuards,
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import { BillingService } from "./billing.service";
import { AccessGuard, RateLimitGuard } from "./security.guards";

const bearer = (value?: string): string | undefined =>
  value?.startsWith("Bearer ") ? value.slice(7) : undefined;

@Controller("billing")
export class BillingController {
  constructor(
    private readonly billing: BillingService,
    private readonly auth: AuthService,
  ) {}

  @Get("catalog")
  @UseGuards(AccessGuard)
  catalog(@Headers("authorization") authorization?: string) {
    return this.billing.catalog(this.userId(authorization));
  }

  @Post("transactions/verify")
  @UseGuards(AccessGuard, RateLimitGuard)
  verify(
    @Body()
    body: {
      store?: string;
      productId?: string;
      transactionId?: string;
      receipt?: string;
    },
    @Headers("authorization") authorization?: string,
  ) {
    return this.billing.verifyPurchase(this.userId(authorization), body);
  }

  @Post("restore")
  @UseGuards(AccessGuard, RateLimitGuard)
  restore(@Headers("authorization") authorization?: string) {
    return this.billing.restore(this.userId(authorization));
  }

  @Post("webhooks/:store")
  @UseGuards(RateLimitGuard)
  webhook(
    @Param("store") store: string,
    @Headers("x-shellty-signature") signature: string | undefined,
    @Body()
    event: {
      id?: string;
      type?: string;
      originalTransactionId?: string;
      status?: string;
      periodEnd?: string;
      autoRenewing?: boolean;
    },
  ) {
    return this.billing.webhook(store, signature, event);
  }

  private userId(authorization?: string): string {
    return this.auth.verifyAccess(bearer(authorization)).sub;
  }
}
