import moment from "moment";

import { smsLogger } from "./logger";

import { getBankOptions } from "@/configs/bank";
import { TBankCode } from "@/types/bank";

// Helper function to get bank name from bank code
function getBankName(bankCode: TBankCode): string {
  const bank = getBankOptions.find((b) => b.key === bankCode);

  return bank?.value || bankCode;
}

export interface ParsedSMSTransaction {
  date: string; // ISO 8601 format
  time: string; // HH:mm format
  type: "in" | "out";
  amount: number;
  description: string;
  balance?: number;
  status: "success" | "error" | "duplicate";
  errorMessage?: string;
  rawSMS: string;
}

export interface ParseSMSResult {
  transactions: ParsedSMSTransaction[];
  summary: {
    total: number;
    successful: number;
    errors: number;
    duplicates: number;
  };
}

// Bank-specific SMS patterns
const BANK_SMS_PATTERNS: Record<TBankCode, { regex: RegExp; parser: (match: RegExpMatchArray) => Partial<ParsedSMSTransaction> }> = {
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

export function parseBankSMS(smsText: string, bankCode: TBankCode): ParseSMSResult {
  if (!smsText.trim()) {
    return {
      transactions: [],
      summary: { total: 0, successful: 0, errors: 0, duplicates: 0 },
    };
  }

  const lines = smsText.split("\n").filter((line) => line.trim());
  const transactions: ParsedSMSTransaction[] = [];

  for (const line of lines) {
    const trimmedLine = line.trim();

    if (!trimmedLine) {
      continue;
    }

    const pattern = BANK_SMS_PATTERNS[bankCode];

    if (!pattern) {
      const errorMessage = `Unsupported bank code: ${bankCode}`;
      const errorTransaction: ParsedSMSTransaction = {
        date: new Date().toISOString(),
        time: "00:00",
        type: "out",
        amount: 0,
        description: "",
        status: "error",
        errorMessage,
        rawSMS: trimmedLine,
      };

      transactions.push(errorTransaction);

      // Log unsupported bank code error
      void smsLogger.logFailure(trimmedLine, "N/A", [], errorMessage, getBankName(bankCode));

      continue;
    }

    const matched = trimmedLine.match(pattern.regex);

    if (!matched) {
      const errorMessage = "Unrecognized SMS format";
      const errorTransaction: ParsedSMSTransaction = {
        date: new Date().toISOString(),
        time: "00:00",
        type: "out",
        amount: 0,
        description: "",
        status: "error",
        errorMessage,
        rawSMS: trimmedLine,
      };

      transactions.push(errorTransaction);

      // Log regex match failure
      void smsLogger.logFailure(
        trimmedLine,
        pattern.regex.source,
        [],
        errorMessage,
        getBankName(bankCode)
      );

      continue;
    }

    try {
      const parsed = pattern.parser(matched);

      // Log the parsed result immediately
      void smsLogger.logSuccess(trimmedLine, pattern.regex.source, matched, parsed, getBankName(bankCode));

      const transaction: ParsedSMSTransaction = {
        date: parsed.date || new Date().toISOString(),
        time: parsed.time || "00:00",
        type: parsed.type || "out",
        amount: parsed.amount || 0,
        description: parsed.description || "Transaction",
        status: "success",
        rawSMS: trimmedLine,
      };

      // Validate parsed transaction
      if (transaction.amount <= 0) {
        transaction.status = "error";
        transaction.errorMessage = "Invalid amount";

        transactions.push(transaction);

        // Log validation failure
        void smsLogger.logFailure(
          trimmedLine,
          pattern.regex.source,
          matched,
          "Invalid amount",
          getBankName(bankCode)
        );
      } else {
        transactions.push(transaction);

        // Log successful parsing
        void smsLogger.logSuccess(trimmedLine, pattern.regex.source, matched, parsed, getBankName(bankCode));
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to parse SMS";

      transactions.push({
        date: new Date().toISOString(),
        time: "00:00",
        type: "out",
        amount: 0,
        description: "",
        status: "error",
        errorMessage,
        rawSMS: trimmedLine,
      });

      // Log parsing exception
      void smsLogger.logFailure(trimmedLine, pattern.regex.source, matched, errorMessage, getBankName(bankCode));
    }
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

