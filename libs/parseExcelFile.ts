import * as xlsx from 'xlsx';

export interface ParseExcelOptions {
    /** Use first row as header. Default: true */
    useFirstRowAsHeader?: boolean;
    /** Value to use for empty cells. Default: null */
    defaultValue?: any;
    /** Specific sheet name to parse. If not provided, uses first sheet */
    sheetName?: string;
}

export interface ParseExcelResult {
    data: any[];
    sheetName: string;
    rowCount: number;
    columnCount: number;
    headers?: string[];
}

/**
 * Parse Excel file from File object and convert to JSON
 */
export async function parseExcelFile(
    file: File,
    options: ParseExcelOptions = {}
): Promise<ParseExcelResult> {
    const {
        useFirstRowAsHeader = true,
        defaultValue = null,
        sheetName: targetSheetName
    } = options;

    // Validate file
    if (!file) {
        throw new Error('No file provided');
    }

    // Check file type
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
        throw new Error('Invalid file type. Please upload an Excel file (.xlsx or .xls)');
    }

    // Convert file to array buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Read the workbook from buffer
    const workbook = xlsx.read(buffer, { type: 'buffer' });

    // Get the target sheet
    const sheetName = targetSheetName || workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    if (!worksheet) {
        throw new Error(`Sheet "${sheetName}" not found in the Excel file`);
    }

    // Convert sheet to JSON
    const data = xlsx.utils.sheet_to_json(worksheet, {
        header: useFirstRowAsHeader ? 1 : undefined,
        defval: defaultValue
    });    // Get headers if using first row as header

    let headers: string[] | undefined;

    if (useFirstRowAsHeader && data.length > 0) {
        headers = data[0] as string[];
        data.shift();
    }

    // Calculate column count
    const range = xlsx.utils.decode_range(worksheet['!ref'] || 'A1');
    const columnCount = range.e.c - range.s.c + 1;

    return {
        data,
        sheetName,
        rowCount: data.length,
        columnCount,
        headers
    };
}

/**
 * Get all sheet names from an Excel file
 */
export async function getExcelSheetNames(file: File): Promise<string[]> {
    if (!file) {
        throw new Error('No file provided');
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const workbook = xlsx.read(buffer, { type: 'buffer' });

    return workbook.SheetNames;
}