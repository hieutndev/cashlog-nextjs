import { z } from "zod";

import { getFromHeaders } from "../../_helpers/get-from-headers";
import { handleError, handleValidateError } from "../../_helpers/handle-error";
import { parseBankSMS, parseManualTransactions } from "../../_services/sms-parser";
import { getAllCardsOfUser } from "../../_services/card-services";
import { getAllCategoriesOfUser } from "../../_services/categories-services";

import { LIST_BANKS } from "@/types/bank";
import { TUser } from "@/types/user";
import { VALIDATE_MESSAGE } from "@/utils/api/zod-validate-message";
import { zodValidate } from "@/utils/zod-validate";

// List of supported banks for SMS parsing
const SUPPORTED_BANKS = ["TPBANK", "VIETCOMBANK"];

const parseSMSPayload = z.object({
  smsText: z.string().min(1, { message: VALIDATE_MESSAGE.REQUIRED_VALUE }),
  bankCode: z.enum(LIST_BANKS as [string, ...string[]], { message: VALIDATE_MESSAGE.INVALID_ENUM_VALUE }),
  cardId: z.number().optional(),
});

const parseManualPayload = z.object({
  manualText: z.string().min(1, { message: VALIDATE_MESSAGE.REQUIRED_VALUE }),
  parseType: z.literal("manual"),
});

export const POST = async (request: Request) => {
  try {
    const request_body = await request.json();
    const userId = getFromHeaders<TUser["user_id"]>(request, "x-user-id", 0);

    // Check if this is a manual input parsing request
    if (request_body.parseType === "manual") {
      const { is_valid, errors } = zodValidate(parseManualPayload, request_body);

      if (!is_valid) {
        return handleValidateError(errors);
      }

      const { manualText } = request_body;

      // Fetch user's cards and categories
      const userCards = await getAllCardsOfUser(userId);
      const userCategories = await getAllCategoriesOfUser(userId);

      const parseResult = parseManualTransactions(
        manualText,
        userCards,
        userCategories
      );

      return Response.json(
        {
          status: "success",
          message: `Parsed ${parseResult.summary.successful} transactions successfully`,
          results: parseResult,
        },
        { status: 200 }
      );
    }

    // Otherwise, handle SMS parsing
    const { is_valid, errors } = zodValidate(parseSMSPayload, request_body);

    if (!is_valid) {
      return handleValidateError(errors);
    }

    const { smsText, bankCode } = request_body;

    // Check if the bank is supported for SMS parsing
    if (!SUPPORTED_BANKS.includes(bankCode)) {
      return Response.json(
        {
          status: "error",
          message: `SMS parsing is not supported for ${bankCode}. Supported banks: ${SUPPORTED_BANKS.join(", ")}`,
          results: null,
        },
        { status: 400 }
      );
    }

    const parseResult = parseBankSMS(smsText, bankCode);

    return Response.json(
      {
        status: "success",
        message: `Parsed ${parseResult.summary.successful} transactions successfully`,
        results: parseResult,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    return handleError(error);
  }
};

