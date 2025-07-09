import OpenAI from "openai";

const openAI = new OpenAI({
  baseURL: "https://api.deepseek.com",
  apiKey: process.env.DEEPSEEK_API_KEY
});

export const POST = async (request: Request) => {
  try {

    const requestBody = await request.json();


    if (!requestBody || !requestBody.message) {
      return Response.json(
        {
          status: "error",
          message: "Please provide a valid message."
        },
        {
          status: 400
        }
      );
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

  } catch (error: any) {
    console.error("Error processing file upload:", error);

    return Response.json(
      {
        status: "error",
        message: "An error occurred while processing your request.",
        errors: error
      },
      {
        status: 500
      }
    );
  }
};