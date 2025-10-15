import OpenAI from "openai";

import { handleError } from "../../_helpers/handle-error";

import { ApiError } from "@/types/api-error";

const openAI = new OpenAI({
  baseURL: "https://api.deepseek.com",
  apiKey: process.env.DEEPSEEK_API_KEY
});

// export const POST = async (request: Request) => {
//   try {

//     const requestBody = await request.json();


//     if (!requestBody || !requestBody.message) {
//       throw new ApiError("Please provide a valid message.", 400);
//     }


//     const prompt = `Extract the following fields from the bank transaction text I provide:

// key: transaction_date (ISO 8601 format YYYY-MM-DDTHH:MM:SS, default to 00:00:00 (+7 UTC) if time is missing)

// key: transaction_amount (as a absolute number, e.g., 500000)

// key: description (as a string)

// Return a strict JSON response with these keys.

// Now process this text: ${requestBody.message}
// `;


//     const completion = await openAI.chat.completions.create({
//       model: "deepseek-chat",
//       messages: [{ role: "user", content: prompt }],
//       response_format: {
//         type: "json_object"
//       }
//     });


//     return Response.json({
//       status: "success",
//       message: "Transaction data extracted successfully.",
//       results: completion.choices[0].message.content ? JSON.parse(completion.choices[0].message.content) : null
//     });

//   } catch (error: unknown) {
//     console.error("Error processing OpenAI request:", error);

//     return handleError(error);
//   }
// };

export const POST = async (request: Request) => {
  try {


    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return handleError(new ApiError("Please provide a valid file.", 400));
    }

    const imageBuffer = await file.arrayBuffer();

    const base64Image = Buffer.from(imageBuffer).toString("base64");
    const mimeType = file.type; // e.g., "image/png"

    console.log("🚀 ~ POST ~ mimeType:", mimeType)
    // 
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: prompt
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType};base64,${base64Image}`
                }
              }
            ]
          }
        ],
        response_format: {
          type: "json_object"
        }
      })
    });

    const completion = await response.json();

    const transactionData = JSON.parse(completion.choices[0].message.content ?? "{}");



    return Response.json({
      status: "success",
      message: "Transaction data extracted successfully.",
      results: transactionData
    });

  } catch (error: unknown) {
    console.error("Error processing OpenAI request:", error);

    return handleError(error);
  }
};