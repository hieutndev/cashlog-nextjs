import OpenAI from "openai";

import { handleError } from "../../_helpers/handle-error";

import { ApiError } from "@/types/api-error";

const openAI = new OpenAI({
  baseURL: "https://api.deepseek.com",
  apiKey: process.env.DEEPSEEK_API_KEY
});

export const POST = async (request: Request) => {
  try {

    const requestBody = await request.json();


    if (!requestBody || !requestBody.message) {
      throw new ApiError("Please provide a valid message.", 400);
    }


    const prompt = `Extract the following fields from the bank transaction text I provide:

key: transaction_date (ISO 8601 format YYYY-MM-DDTHH:MM:SS, default to 07:00:00 if time is missing)

key: transaction_amount (as a absolute number, e.g., 500000)

key: description (as a string)

Return a strict JSON response with these keys.

Now process this text: ${requestBody.message}
`;


    const completion = await openAI.chat.completions.create({
      model: "deepseek-chat",
      messages: [{ role: "user", content: prompt }],
      response_format: {
        type: "json_object"
      }
    });


    return Response.json({
      status: "success",
      message: "Transaction data extracted successfully.",
      results: completion.choices[0].message.content ? JSON.parse(completion.choices[0].message.content) : null
    });

  } catch (error: unknown) {
    console.error("Error processing OpenAI request:", error);

    return handleError(error);
  }
};