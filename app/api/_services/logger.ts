import { promises as fs } from "fs";
import path from "path";

export type LogLevel = "info" | "warn" | "error";

export interface LogEntry {
  timestamp: string; // ISO 8601 format
  level: LogLevel;
  bankName?: string; // Bank name (optional)
  inputString: string; // Original SMS message (sanitized)
  regexPattern: string; // Regex pattern used
  parseResult: unknown; // Extracted data or error message
  matched: string[]; // Regex matched groups
  status: "success" | "failure"; // Success or failure indicator
}

class SMSLogger {
  private logDir: string;
  private logFile: string;
  private isInitialized: boolean = false;

  constructor() {
    this.logDir = path.join(process.cwd(), "logs");
    this.logFile = path.join(this.logDir, "parsed-sms.log");
  }

  /**
   * Initialize the logger by ensuring the logs directory exists
   */
  private async ensureLogDirectory(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      await fs.mkdir(this.logDir, { recursive: true });
      this.isInitialized = true;
    } catch (error) {
      console.error("Failed to create logs directory:", error);
      // Don't throw - allow application to continue even if logging fails
    }
  }

  /**
   * Sanitize sensitive information from SMS text
   */
  private sanitizeInput(input: string): string {
    // Remove or mask account numbers, card numbers, etc.
    let sanitized = input;

    // Mask account numbers (TK followed by digits)
    sanitized = sanitized.replace(/TK\s+\d+/gi, "TK [MASKED]");

    // Mask phone numbers (10-11 digits)
    sanitized = sanitized.replace(/\b\d{10,11}\b/g, "[PHONE_MASKED]");

    // Mask email addresses
    sanitized = sanitized.replace(/[\w\.-]+@[\w\.-]+\.\w+/g, "[EMAIL_MASKED]");

    return sanitized;
  }

  /**
   * Format the log entry for human-readable output
   */
  private formatLogEntry(logEntry: LogEntry): string {
    const separator = "=".repeat(80);
    const minorSeparator = "-".repeat(20);

    // Format timestamp to be more readable
    const date = new Date(logEntry.timestamp);
    const formattedTime = date.toLocaleString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });

    // Status emoji and color indicator
    const statusIcon = logEntry.status === "success" ? "✅ SUCCESS" : "❌ FAILURE";
    const levelIcon = {
      info: "ℹ️  INFO",
      warn: "⚠️  WARN",
      error: "🚨 ERROR",
    }[logEntry.level];

    // Format parse result with proper indentation
    const formattedResult = JSON.stringify(logEntry.parseResult, null, 2)
      .split("\n")
      .map((line, index) => (index === 0 ? line : "  " + line))
      .join("\n");

    return `
${separator}
🏦 BANK:      ${logEntry.bankName ?? "-"}
🕒 TIMESTAMP: ${formattedTime}
📊 STATUS:    ${statusIcon}
📝 LEVEL:     ${levelIcon}
${minorSeparator}
INPUT MESSAGE (Sanitized):
${logEntry.inputString}
${minorSeparator}
🔍 REGEX PATTERN:
${logEntry.regexPattern}
${minorSeparator}
☑️ MATCHED RESULT:
[s
${logEntry.matched.join(",\n")}
]
${minorSeparator}
📦 PARSE RESULT:
${formattedResult}
${separator}
`;
  }

  /**
   * Log a parsing operation
   */
  async log(
    inputString: string,
    regexPattern: string,
    parseResult: unknown,
    status: "success" | "failure",
    matched: string[],
    bankName?: string,
    level: LogLevel = status === "success" ? "info" : "warn"
  ): Promise<void> {
    try {
      await this.ensureLogDirectory();

      const logEntry: LogEntry = {
        timestamp: new Date().toISOString(),
        level,
        bankName,
        inputString: this.sanitizeInput(inputString),
        regexPattern,
        parseResult,
        status,
        matched
      };

      // Format for human-readable viewing
      const readableLog = this.formatLogEntry(logEntry);

      // Append human-readable format to log file
      await fs.appendFile(this.logFile, readableLog, "utf-8");

    } catch (error) {
      // Silently fail to avoid disrupting SMS parsing operations
      console.error("Failed to write log entry:", error);
    }
  }

  /**
   * Log successful parsing
   */
  async logSuccess(
    inputString: string,
    regexPattern: string,
    matched: string[],
    parseResult: unknown,
    bankName?: string
  ): Promise<void> {
    await this.log(inputString, regexPattern, parseResult, "success", matched, bankName, "info");
  }

  /**
   * Log failed parsing
   */
  async logFailure(
    inputString: string,
    regexPattern: string,
    matched: string[],
    errorMessage: string,
    bankName?: string
  ): Promise<void> {
    await this.log(
      inputString,
      regexPattern,
      { error: errorMessage },
      "failure",
      matched,
      bankName,
      "warn"
    );
  }

  /**
   * Get the log file path (useful for testing/debugging)
   */
  getLogFilePath(): string {
    return this.logFile;
  }
}

// Export singleton instance
export const smsLogger = new SMSLogger();

