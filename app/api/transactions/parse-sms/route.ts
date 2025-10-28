import { z } from "zod";

import { getFromHeaders } from "../../_helpers/get-from-headers";
import { handleError, handleValidateError } from "../../_helpers/handle-error";
import { parseBankSMS } from "../../_services/sms-parser";

import { LIST_BANKS } from "@/types/bank";
import { TUser } from "@/types/user";
import { VALIDATE_MESSAGE } from "@/utils/api/zod-validate-message";
import { zodValidate } from "@/utils/zod-validate";

const parseSMSPayload = z.object({
  smsText: z.string().min(1, { message: VALIDATE_MESSAGE.REQUIRED_VALUE }),
  bankCode: z.enum(LIST_BANKS as [string, ...string[]], { message: VALIDATE_MESSAGE.INVALID_ENUM_VALUE }),
  cardId: z.number().optional(),
});

export const POST = async (request: Request) => {
  try {
    const userId = getFromHeaders<TUser["user_id"]>(request, "x-user-id", 0);

    if (!userId) {
      return Response.json(
        {
          status: "error",
          message: "Unauthorized",
        },
        { status: 401 }
      );
    }

    const requestBody = await request.json();

    const { is_valid, errors } = zodValidate(parseSMSPayload, requestBody);

    if (!is_valid) {
      return handleValidateError(errors);
    }

    const { smsText, bankCode } = requestBody;

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

