import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  UseGuards,
} from "@nestjs/common";
import { ThrottlerGuard } from "@nestjs/throttler";
import { ApiTags } from "@nestjs/swagger";

import type { TokenPayload } from "../auth/auth.service";
import { BillingService } from "./billing.service";
import { AccessGuard, CurrentUser } from "../auth/security.guards";

@ApiTags("billing")
@Controller("billing")
export class BillingController {
  constructor(private readonly billing: BillingService) {}

  @Get("catalog")
  @UseGuards(AccessGuard)
  catalog(@CurrentUser() user: TokenPayload) {
    return this.billing.catalog(user.sub);
  }

  @Post("transactions/verify")
  @UseGuards(AccessGuard, ThrottlerGuard)
  verify(
    @Body()
    body: {
      store?: string;
      productId?: string;
      transactionId?: string;
      receipt?: string;
    },
    @CurrentUser() user: TokenPayload,
  ) {
    return this.billing.verifyPurchase(user.sub, body);
  }

  @Post("restore")
  @UseGuards(AccessGuard, ThrottlerGuard)
  restore(@CurrentUser() user: TokenPayload) {
    return this.billing.restore(user.sub);
  }

  @Post("webhooks/:store")
  @UseGuards(ThrottlerGuard)
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
}
