import moment from "moment";

import { smsLogger } from "./logger";

import { getBankOptions } from "@/configs/bank";
import { TBankCode } from "@/types/bank";
import { TCard } from "@/types/card";
import { TCategory } from "@/types/category";
import { TAddTransaction } from "@/types/transaction";

// Helper function to get bank name from bank code
function getBankName(bankCode: TBankCode): string {
  const bank = getBankOptions.find((b) => b.key === bankCode);

  return bank?.value || bankCode;
}

export type TParsedSMSTransaction = {
  date: string; // YYYY-MM-DD format
  time: string; // HH:mm format
  type: "in" | "out";
  amount: number;
  description: string;
  status: "success" | "error" | "duplicate";
  message?: string;
  raw_sms: string;
}

export type TParseSMSResult = {
  transactions: TParsedSMSTransaction[];
  summary: {
    total: number;
    successful: number;
    errors: number;
    duplicates: number;
  };
}

// Bank-specific SMS patterns
const BANK_SMS_PATTERNS: Record<TBankCode, { regex: RegExp; parser: (match: RegExpMatchArray) => Partial<TParsedSMSTransaction> }> = {
  VIETCOMBANK: {
    regex: /([-+])([\d,.]+)\s*VND.*?lu[́u]c\s*(\d{2}-\d{2}-\d{4}\s+\d{2}:\d{2}:\d{2})/i,
    parser: (match) => {

      const date = match.map((m) => {
        try {
          const [datePart, timePart] = m.split(" ");
          const [day, month, year] = datePart.split("-");
          const [hour, minute, second] = timePart.split(":");

          return new Date(+year, +month - 1, +day, +hour, +minute, +second);
        } catch {
          return false;
        }
      }).filter((d) => d instanceof Date && !isNaN(d.getTime()))[0];

      return {
        type: match.find((m) => m.length === 1 && (m === "+" || m === "-")) === "+" ? "in" : "out",
        amount: parseAmount(match[2]),
        time: date ? moment(date).format("HH:mm:ss") : '',
        date: date ? moment(date).format("YYYY-MM-DD") : '',
        description: match[5]?.trim() || "Transaction",
      };
    },
  },
  TECHCOMBANK: {
    regex: /TK\s+\d+\s+([\+\-])([\d,\.]+)d\s+(.+?)\s+Luc\s+(\d{2}:\d{2})\s+(\d{2}\/\d{2}\/\d{4})/i,
    parser: (match) => ({
      type: match[1] === "+" ? "in" : "out",
      amount: parseAmount(match[2]),
      description: match[3]?.trim() || "Transaction",
      time: match[4],
      date: parseDate(match[5]),
    }),
  },
  MBB: {
    regex: /\[?ACB\]?\s*TK\s+\d+\s+([\+\-])([\d,\.]+)\s*VND.*?(\d{2}\/\d{2}\/\d{4})\s+(\d{2}:\d{2}).*?([^.]+?)(?:\.|SD:|$)/i,
    parser: (match) => ({
      type: match[1] === "+" ? "in" : "out",
      amount: parseAmount(match[2]),
      date: parseDate(match[3]),
      time: match[4],
      description: match[5]?.trim() || "Transaction",
    }),
  },
  TPBANK: {
    regex: /Số dư TK VCB\s+\d+\s+([\+\-])([\d,\.]+)\s*VND\s+lúc\s+(\d{2})-(\d{2})-(\d{4})\s+(\d{2}:\d{2}:\d{2}).*?Ref\s+[A-Z0-9.]+\.([A-Z\s]+?)\s+(transfer)/i,
    parser: (match) => ({
      type: match[1] === "+" ? "in" : "out",
      amount: parseAmount(match[2]),
      date: parseDate(`${match[3]}/${match[4]}/${match[5]}`),
      time: match[6],
      description: `${match[7]?.trim() || "Transaction"} ${match[8]?.trim() || ""}`.trim(),
    }),
  },
  MOMO: {
    regex: /([+-])([\d,\.]+)\s*VND.*?vào lúc\s+(\d{2}:\d{2})\s+ngày\s+(\d{2}\/\d{2}\/\d{4}).*?Nội dung:\s*([^.]+?)(?:\.|$)/i,
    parser: (match) => ({
      type: match[1] === "+" ? "in" : "out",
      amount: parseAmount(match[2]),
      time: match[3],
      date: parseDate(match[4]),
      description: match[5]?.trim() || "Transaction",
    }),
  },
  SHOPEEPAY: {
    regex: /Bạn đã (nạp|rút) tiền ([\d,\.]+) VND.*?vào lúc (\d{2}:\d{2}) ngày (\d{2}\/\d{2}\/\d{4}).*?Nội dung:\s*([^.]+?)(?:\.|$)/i,
    parser: (match) => ({
      type: match[1] === "nạp" ? "in" : "out",
      amount: parseAmount(match[2]),
      time: match[3],
      date: parseDate(match[4]),
      description: match[5]?.trim() || "Transaction",
    }),
  },
  VPBANK: {
    regex: /TK\s+\d+\s+GD:([\+\-])([\d,\.]+)\s*VND.*?lúc\s+(\d{2}:\d{2})\s+(\d{2}\/\d{2}\/\d{4}).*?Nội dung:\s*([^.]+?)(?:\.|SD:|$)/i,
    parser: (match) => ({
      type: match[1] === "+" ? "in" : "out",
      amount: parseAmount(match[2]),
      time: match[3],
      date: parseDate(match[4]),
      description: match[5]?.trim() || "Transaction",
    }),
  },
  ZALOPAY: {
    regex: /Bạn đã (nạp|rút) tiền ([\d,\.]+) VND.*?vào lúc (\d{2}:\d{2}) ngày (\d{2}\/\d{2}\/\d{4}).*?Nội dung:\s*([^.]+?)(?:\.|$)/i,
    parser: (match) => ({
      type: match[1] === "nạp" ? "in" : "out",
      amount: parseAmount(match[2]),
      time: match[3],
      date: parseDate(match[4]),
      description: match[5]?.trim() || "Transaction",
    }),
  },
  LIOBANK: {
    regex: /TK\s+\d+\s+GD:([\+\-])([\d,\.]+)\s*VND.*?lúc\s+(\d{2}:\d{2})\s+(\d{2}\/\d{2}\/\d{4}).*?Nội dung:\s*([^.]+?)(?:\.|SD:|$)/i,
    parser: (match) => ({
      type: match[1] === "+" ? "in" : "out",
      amount: parseAmount(match[2]),
      time: match[3],
      date: parseDate(match[4]),
      description: match[5]?.trim() || "Transaction",
    }),
  },
  CASH: {
    regex: /Bạn (đã nhận|đã chi) ([\d,\.]+) VND.*?vào lúc (\d{2}:\d{2}) ngày (\d{2}\/\d{2}\/\d{4}).*?Nội dung:\s*([^.]+?)(?:\.|$)/i,
    parser: (match) => ({
      type: match[1] === "đã nhận" ? "in" : "out",
      amount: parseAmount(match[2]),
      time: match[3],
      date: parseDate(match[4]),
      description: match[5]?.trim() || "Transaction",
    }),
  },
};

function parseAmount(amountStr: string): number {
  // Remove all dots and commas used as thousand separators
  let cleanStr = amountStr.replace(/\./g, "").replace(/,/g, "");
  const amount = parseInt(cleanStr, 10);

  return isNaN(amount) ? 0 : amount;
}

function parseDate(dateStr: string): string {
  const match = dateStr.match(/(\d{2})\/(\d{2})\/(\d{2,4})/);

  if (!match) {
    return new Date().toISOString();
  }

  let [, day, month, year] = match;
  const yearNum = parseInt(year, 10);
  const fullYear = year.length === 2 ? (yearNum < 50 ? 2000 + yearNum : 1900 + yearNum) : yearNum;

  const date = new Date(`${fullYear}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`);

  // Validate date is not in the future
  if (date > new Date()) {
    return new Date().toISOString();
  }

  return date.toISOString();
}

const TPBankParser = (smsText: string, lang: 'vn' | 'en' = 'vn'): TParsedSMSTransaction[] => {
  const bankName = getBankName('TPBANK');

  if (lang === 'en') {
    const errorMessage = "English parsing not implemented yet";

    // Log unsupported language error
    void smsLogger.logFailure(smsText, "N/A", [], errorMessage, bankName);

    return [
      {
        date: '',
        time: '',
        type: 'in',
        amount: 0,
        description: '',
        status: "error",
        message: errorMessage,
        raw_sms: smsText
      }
    ]
  } else {

    // Split by "(TPBank):" marker to handle multiple SMS
    const sms_chunks = smsText.split(/(?=\(TPBank\):)/i).filter(chunk => chunk.trim());

    const results: TParsedSMSTransaction[] = [];

    for (let i = 0; i < sms_chunks.length; i++) {
      const chunk = sms_chunks[i].trim();

      if (!chunk) continue;

      try {
        // Split SMS into lines and trim whitespace
        const transaction_lines = chunk.split('\n').map(line => line.trim()).filter(line => line);

        if (transaction_lines.length < 6) {
          const errorMessage = "TPBank Transaction Notification format invalid";

          // Log invalid format error
          void smsLogger.logFailure(chunk, "N/A", [], errorMessage, bankName);

          results.push({
            date: '',
            time: '',
            type: 'in',
            amount: 0,
            description: '',
            status: "error",
            message: errorMessage,
            raw_sms: chunk
          });
          continue;
        }

        const parsed_result: TParsedSMSTransaction = {
          date: '',
          time: '',
          type: 'in',
          amount: 0,
          description: '',
          status: "error",
          message: "TPBank Transaction Notification format invalid",
          raw_sms: chunk
        };

        // Line 1: Extract date and time from "(TPBank): 27/10/25;18:44"
        const dateTimeMatch = transaction_lines[0].match(/\(TPBank\):\s*(.+)/i);

        console.log("🚀 ~ TPBankParser ~ dateTimeMatch:", dateTimeMatch)

        if (dateTimeMatch) {
          const [date_str, time_str] = dateTimeMatch[1].split(';').map(s => s.trim());

          parsed_result.date = moment(date_str, "DD/MM/YY").isValid() ? moment(date_str, "DD/MM/YY").format("YYYY-MM-DD") : '';
          parsed_result.time = moment(time_str, "HH:mm").isValid() ? moment(time_str, "HH:mm").format("HH:mm:ss") : '';
        }

        // Extract amount and type from "PS:-500.000VND" or "PS:+500.000VND"
        const amountMatch = transaction_lines.find(line => line.startsWith('PS:'))?.match(/PS:\s*([-+])?([0-9.,]+)\s*VND/i);

        if (amountMatch) {
          parsed_result.type = (amountMatch[1] || '+') === '+' ? 'in' : 'out';

          // Convert amount: remove dots (thousands separator), replace comma with dot (decimal)

          parsed_result.amount = parseFloat(amountMatch[2]
            .replace(/\./g, '') // Remove dots (12.932 -> 12932)
            .replace(/,/g, '.') // Replace comma with dot (12.332,500 -> 12332.500)
          ) || 0;

        }

        const descLine = transaction_lines.find(line => line.startsWith('ND:'));

        if (descLine) {
          const descMatch = descLine.match(/ND:\s*(.+)/i);
          const description = descMatch ? descMatch[1].trim() : '';

          parsed_result.description = description;
        }

        if (!parsed_result.date || !parsed_result.time || parsed_result.amount <= 0) {
          const errorMessage = "Invalid parsed data: missing date, time, or amount";

          parsed_result.status = "error";
          parsed_result.message = errorMessage;
          void smsLogger.logFailure(chunk, "/\\(TPBank\\):/", [], errorMessage, bankName);
        } else {
          parsed_result.status = "success";
          parsed_result.message = "Parsed successfully";

          void smsLogger.logSuccess(chunk, "/\\(TPBank\\):/", [chunk], parsed_result, bankName);
        }

        results.push(parsed_result);


      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to parse TPBank SMS";

        console.error(`SMS #${i + 1}: Lỗi khi parse -`, error);

        // Log parsing exception
        void smsLogger.logFailure(chunk, "/\\(TPBank\\):/", [], errorMessage, bankName);

        results.push({
          date: '',
          time: '',
          type: 'in',
          amount: 0,
          description: '',
          status: "error",
          message: errorMessage,
          raw_sms: chunk
        });
      }
    }

    return results;
  }
};

const VietcombankParser = (smsText: string, lang: 'vn' | 'en' = 'vn'): TParsedSMSTransaction[] => {
  const bankName = getBankName('VIETCOMBANK');

  if (lang === 'en') {
    const errorMessage = "English parsing not implemented yet";

    // Log unsupported language error
    void smsLogger.logFailure(smsText, "N/A", [], errorMessage, bankName);

    return [
      {
        date: '',
        time: '',
        type: 'in',
        amount: 0,
        description: '',
        status: "error",
        message: errorMessage,
        raw_sms: smsText
      }
    ]
  } else {
    const lines = smsText.split("\n").filter((line) => line.trim());
    const results: TParsedSMSTransaction[] = [];
    const pattern = BANK_SMS_PATTERNS['VIETCOMBANK'];

    if (!pattern) {
      const errorMessage = "Vietcombank pattern not found";

      void smsLogger.logFailure(smsText, "N/A", [], errorMessage, bankName);

      return [
        {
          date: '',
          time: '',
          type: 'in',
          amount: 0,
          description: '',
          status: "error",
          message: errorMessage,
          raw_sms: smsText
        }
      ];
    }

    for (let i = 0; i < lines.length; i++) {
      const trimmedLine = lines[i].trim();

      if (!trimmedLine) {
        continue;
      }

      try {
        const matched = trimmedLine.match(pattern.regex);

        if (!matched) {
          const errorMessage = "Unrecognized SMS format";
          const errorTransaction: TParsedSMSTransaction = {
            date: new Date().toISOString(),
            time: "00:00",
            type: "out",
            amount: 0,
            description: "",
            status: "error",
            message: errorMessage,
            raw_sms: trimmedLine,
          };

          results.push(errorTransaction);

          // Log regex match failure
          void smsLogger.logFailure(
            trimmedLine,
            pattern.regex.source,
            [],
            errorMessage,
            bankName
          );

          continue;
        }

        const parsed = pattern.parser(matched);

        // Log the parsed result immediately
        void smsLogger.logSuccess(trimmedLine, pattern.regex.source, matched, parsed, bankName);

        const transaction: TParsedSMSTransaction = {
          date: parsed.date || new Date().toISOString(),
          time: parsed.time || "00:00",
          type: parsed.type || "out",
          amount: parsed.amount || 0,
          description: parsed.description || "Transaction",
          status: "success",
          raw_sms: trimmedLine,
        };

        // Validate parsed transaction
        if (transaction.amount <= 0) {
          transaction.status = "error";
          transaction.message = "Invalid amount";

          results.push(transaction);

          // Log validation failure
          void smsLogger.logFailure(
            trimmedLine,
            pattern.regex.source,
            matched,
            "Invalid amount",
            bankName
          );
        } else {
          results.push(transaction);

          // Log successful parsing
          void smsLogger.logSuccess(trimmedLine, pattern.regex.source, matched, parsed, bankName);
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to parse SMS";

        results.push({
          date: new Date().toISOString(),
          time: "00:00",
          type: "out",
          amount: 0,
          description: "",
          status: "error",
          message: errorMessage,
          raw_sms: trimmedLine,
        });

        // Log parsing exception
        void smsLogger.logFailure(trimmedLine, pattern.regex.source, [], errorMessage, bankName);
      }
    }

    return results;
  }
};

export function parseBankSMS(smsText: string, bankCode: TBankCode): TParseSMSResult {
  if (!smsText.trim()) {
    return {
      transactions: [],
      summary: { total: 0, successful: 0, errors: 0, duplicates: 0 },
    };
  }

  const transactions: TParsedSMSTransaction[] = [];

  if (bankCode === "TPBANK") {
    transactions.push(...TPBankParser(smsText));
  } else if (bankCode === "VIETCOMBANK") {
    transactions.push(...VietcombankParser(smsText));
  } else {
    const errorMessage = `Unsupported bank code: ${bankCode}`;
    const errorTransaction: TParsedSMSTransaction = {
      date: new Date().toISOString(),
      time: "00:00",
      type: "out",
      amount: 0,
      description: "",
      status: "error",
      message: errorMessage,
      raw_sms: smsText,
    };

    transactions.push(errorTransaction);

    // Log unsupported bank code error
    void smsLogger.logFailure(smsText, "N/A", [], errorMessage, getBankName(bankCode));
  }

  const successful = transactions.filter((t) => t.status === "success").length;
  const errors = transactions.filter((t) => t.status === "error").length;
  const duplicates = transactions.filter((t) => t.status === "duplicate").length;

  return {
    transactions,
    summary: {
      total: transactions.length,
      successful,
      errors,
      duplicates,
    },
  };
}

export interface ParsedManualTransaction extends TAddTransaction {
  originalText: string;
  parsingStatus: "pending" | "success" | "error";
  errorMessage?: string;
}

export type TParseManualResult = {
  transactions: ParsedManualTransaction[];
  summary: {
    total: number;
    successful: number;
    errors: number;
  };
};

/**
 * Parse a single line of pipe-delimited transaction data
 * Format: card_identifier | amount | date | description | category_name
 *
 * Returns a complete transaction object with fallback values for invalid fields.
 * This function does NOT return early on errors - it continues parsing all fields
 * and uses fallback values for any invalid data.
 */
function parseManualTransactionLine(
  line: string,
  cards: TCard[],
  categories: TCategory[],
  lineIndex: number
): ParsedManualTransaction {
  const trimmedLine = line.trim();
  const originalText = line;

  // Initialize with fallback values
  const result: ParsedManualTransaction = {
    originalText,
    card_id: 0,
    direction: "out",
    category_id: null,
    date: "",
    amount: 0,
    description: "",
    parsingStatus: "success",
  };

  // Check if line is empty
  if (!trimmedLine) {
    result.parsingStatus = "error";
    result.errorMessage = `Line ${lineIndex + 1}: Empty line`;

    return result;
  }

  const parts = trimmedLine.split("|").map((p) => p.trim());

  // Check if line has correct number of parts
  if (parts.length !== 5) {
    result.parsingStatus = "error";
    result.errorMessage = `Line ${lineIndex + 1}: Invalid format. Expected 5 pipe-delimited fields (card_identifier | amount | date | description | category_name), got ${parts.length}`;

    return result;
  }

  // Parse card_identifier - use fallback 0 if not found
  const card = findManualCardByIdentifier(parts[0], cards);

  result.card_id = card?.card_id ?? 0;

  // Parse amount - use fallback 0 if invalid
  const parsedAmount = parseFloat(parts[1]);

  result.amount = isNaN(parsedAmount) ? 0 : Math.abs(parsedAmount);

  // Parse date - use fallback empty string if invalid
  const dateObj = moment(parts[2], "YYYY-MM-DD", true);

  result.date = dateObj.isValid() ? parts[2] : "";

  // Parse description - use fallback empty string if missing
  result.description = parts[3] || "";

  // Parse category_id - use fallback null if not found
  const category = findManualCategoryByName(parts[4], categories);

  result.category_id = category?.category_id ?? null;

  // Determine direction based on original amount sign
  result.direction = parsedAmount > 0 ? "in" : "out";

  return result;
}

function findManualCardByIdentifier(
  identifier: string,
  cards: TCard[]
): TCard | null {
  if (identifier.startsWith("*")) {
    // Match by last 4 digits
    const last4 = identifier.substring(1);

    return (
      cards.find((card) => card.card_number?.endsWith(last4)) || null
    );
  } else {
    // Exact match - try full card number or last 4 digits
    return (
      cards.find(
        (card) =>
          card.card_number === identifier ||
          card.card_number?.endsWith(identifier)
      ) || null
    );
  }
}

/**
 * Find a category by exact name match
 */
function findManualCategoryByName(
  categoryName: string,
  allCategories: TCategory[]
): TCategory | null {
  return (
    allCategories.find((cat) => cat.category_name === categoryName) || null
  );
}

/**
 * Validate and parse manual transaction input
 *
 * This function processes each line and returns a complete transaction object
 * with fallback values for any invalid fields. It does NOT fail early - instead,
 * it continues parsing all fields and collects all errors in the errorMessage.
 */
export function parseManualTransactions(
  input_text: string,
  cards: TCard[],
  categories: TCategory[]
): TParseManualResult {
  const lines = input_text.split("\n");
  const results: ParsedManualTransaction[] = [];

  lines.forEach((line, lineIndex) => {
    // Skip empty lines
    if (line.trim() === "") {
      return;
    }

    // Parse the line with fallback values for all invalid fields
    const parsed = parseManualTransactionLine(line, cards, categories, lineIndex);

    results.push(parsed);
  });

  // Calculate summary
  const summary = {
    total: results.length,
    successful: results.filter((t) => t.parsingStatus === "success").length,
    errors: results.filter((t) => t.parsingStatus === "error").length,
  };

  return {
    transactions: results,
    summary,
  };
}

