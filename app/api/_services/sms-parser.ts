import moment from "moment";

import { smsLogger } from "./logger";

import { getBankOptions } from "@/configs/bank";
import { TBankCode } from "@/types/bank";

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
            raw_sms: smsText
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
          raw_sms: smsText
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
        void smsLogger.logFailure(sms_chunks[i], "/\\(TPBank\\):/", [], errorMessage, bankName);
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

  const lines = smsText.split("\n").filter((line) => line.trim());
  const transactions: TParsedSMSTransaction[] = [];

  if (bankCode === "TPBANK") {
    transactions.push(...TPBankParser(smsText));
  }

  if (["VIETCOMBANK"].includes(bankCode)) {
    for (const line of lines) {
      const trimmedLine = line.trim();

      if (!trimmedLine) {
        continue;
      }

      const pattern = BANK_SMS_PATTERNS[bankCode];

      if (!pattern) {
        const errorMessage = `Unsupported bank code: ${bankCode}`;
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

        transactions.push(errorTransaction);

        // Log unsupported bank code error
        void smsLogger.logFailure(trimmedLine, "N/A", [], errorMessage, getBankName(bankCode));

        continue;
      }

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
          message: errorMessage,
          raw_sms: trimmedLine,
        });

        // Log parsing exception
        void smsLogger.logFailure(trimmedLine, pattern.regex.source, matched, errorMessage, getBankName(bankCode));
      }
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

