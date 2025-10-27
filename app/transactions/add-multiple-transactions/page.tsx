"use client";
import { Alert } from "@heroui/alert";
import { Textarea } from "@heroui/input";
import { addToast } from "@heroui/toast";
import { useState, useEffect } from "react";
import Image from "next/image";
import { Button } from "@heroui/button";

import Container from "@/components/shared/container/container";
import BulkEditToolbar from "@/components/transactions/bulk-edit-toolbar";
import ParsedTransactionTable from "@/components/transactions/parsed-transaction-table";
import { getBankLogo } from "@/configs/bank";
import { useCardEndpoint } from "@/hooks/useCardEndpoint";
import { useCategoryEndpoint } from "@/hooks/useCategoryEndpoint";
import { useDebounce } from "@/hooks/useDebounce";
import { useImportTransactionEndpoint } from "@/hooks/useImportTransactionEndpoint";
import { TCard } from "@/types/card";
import { TCategory } from "@/types/category";
import { FilterAndSortItem } from "@/types/global";
import { TAddTransaction } from "@/types/transaction";

interface ParsedTransaction extends TAddTransaction {
    originalText: string;
    parsingStatus: "pending" | "success" | "error";
    errorMessage?: string;
}

export default function ImportTransactionsPage() {
    const [inputText, setInputText] = useState("");
    const [parsedTxn, setParsedTxn] = useState<ParsedTransaction[]>([]);
    const [isParsing, setIsParsing] = useState(false);
    const [selectedTxn, setSelectedTxn] = useState<number[]>([]);
    const [cardOptions, setCardOptions] = useState<FilterAndSortItem[]>([]);
    const [categoryOptions, setCategoryOptions] = useState<TCategory[]>([]);
    const { useGetListCards } = useCardEndpoint();
    const { useGetCategories } = useCategoryEndpoint();
    const { useCreateMultipleTransactions } = useImportTransactionEndpoint();

    const {
        data: createMultipleResult,
        loading: creatingMultiple,
        error: createMultipleError,
        fetch: createMultipleTransactions,
    } = useCreateMultipleTransactions();

    const {
        data: fetchCardsResult,
        fetch: fetchCards,
    } = useGetListCards();

    const {
        data: fetchCategoriesResult,
        fetch: fetchCategories,
    } = useGetCategories();

    // Detect card from transaction text by matching card names and numbers
    const detectCardFromText = (text: string, cards: TCard[]): number => {
        const lowerText = text.toLowerCase();

        // Try to match card names (exact or partial match)
        for (const card of cards) {
            const cardNameLower = card.card_name.toLowerCase();

            // Check for exact card name match
            if (lowerText.includes(cardNameLower)) {
                return card.card_id;
            }

            // Check for partial match (first few words of card name)
            const cardNameWords = cardNameLower.split(/\s+/);

            if (cardNameWords.length > 0 && lowerText.includes(cardNameWords[0])) {
                return card.card_id;
            }
        }

        // Try to match card numbers (last 4 digits)
        const cardNumberMatch = text.match(/(\d{4})/);

        if (cardNumberMatch) {
            const lastFourDigits = cardNumberMatch[1];

            for (const card of cards) {
                if (card.card_number.endsWith(lastFourDigits)) {
                    return card.card_id;
                }
            }
        }

        // Try to match full card numbers
        const fullCardNumberMatch = text.match(/(\d{13,19})/);

        if (fullCardNumberMatch) {
            const cardNumber = fullCardNumberMatch[1];

            for (const card of cards) {
                if (card.card_number === cardNumber) {
                    return card.card_id;
                }
            }
        }

        return 0; // No card detected
    };

    const parseTransactions = async () => {
        if (!bankNotificationTexts.trim()) return;

        setIsParsing(true);
        const lines = bankNotificationTexts.split('\n').filter(line => line.trim());

        const transactions: ParsedTransaction[] = lines.map(line => ({
            originalText: line.trim(),
            card_id: 0, // Will be set by user or auto-detected
            direction: "out", // Default to out, will be detected
            category_id: null,
            date: new Date().toISOString(),
            amount: 0,
            description: "",
            parsingStatus: "pending" as const,
        }));

        setParsedTxn(transactions);

        // Parse each transaction
        for (let i = 0; i < transactions.length; i++) {
            try {
                const parsed = await parseTransactionText(transactions[i].originalText);

                // Auto-detect card from text
                const detectedCardId = detectCardFromText(transactions[i].originalText, fetchCardsResult?.results ?? []);

                setParsedTxn(prev =>
                    prev.map((t, index) =>
                        index === i
                            ? {
                                ...t,
                                ...parsed,
                                card_id: detectedCardId || parsed.card_id || 0,
                                parsingStatus: "success" as const
                              }
                            : t
                    )
                );
            } catch {
                setParsedTxn(prev =>
                    prev.map((t, index) =>
                        index === i
                            ? { ...t, parsingStatus: "error" as const, errorMessage: "Failed to parse transaction" }
                            : t
                    )
                );
            }
        }

        setIsParsing(false);
    };

    const bankNotificationTexts = useDebounce(inputText, 500);

    useEffect(() => {
        // parseTransactions();
    }, [bankNotificationTexts]);

    useEffect(() => {
        const handlePasteAnywhere = (event: ClipboardEvent) => {
            const text = event.clipboardData?.getData('text');

            if (text) {
                const modifiedText = text.replace(/\n/g, ' ');

                setInputText((prev) => prev + modifiedText + '\n');
                event.preventDefault();
            }
        };

        window.addEventListener('paste', handlePasteAnywhere);

        return () => {
            window.removeEventListener('paste', handlePasteAnywhere);
        };
    }, []);

    const parseAmount = (amountStr: string): number => {
        let cleanStr = amountStr.replace(/,/g, '').replace(/\s/g, '').toUpperCase();
        const multipliers: { [key: string]: number } = {
            'K': 1000,
            'M': 1000000,
            'B': 1000000000,
            'T': 1000000000000,
        };

        for (const [suffix, multiplier] of Object.entries(multipliers)) {
            if (cleanStr.includes(suffix)) {
                const parts = cleanStr.split(suffix);
                const beforeSuffix = parseFloat(parts[0]) || 0;
                const afterSuffix = parseFloat(parts[1]) || 0;

                return Math.round(beforeSuffix * multiplier + afterSuffix);
            }
        }

        // No suffix, just parse as number
        return parseInt(cleanStr) || 0;
    };

    // Parse date from text (supports formats like DD/MM, DD/MM/YYYY, DD-MM-YYYY)
    const parseDate = (text: string): string => {
        const currentYear = new Date().getFullYear();

        // Pattern: DD/MM/YYYY or DD-MM-YYYY
        const fullDateMatch = text.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);

        if (fullDateMatch) {
            const [, day, month, year] = fullDateMatch;

            return new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`).toISOString();
        }

        // Pattern: DD/MM or DD-MM (assume current year)
        const shortDateMatch = text.match(/(\d{1,2})[\/\-](\d{1,2})/);

        if (shortDateMatch) {
            const [, day, month] = shortDateMatch;

            return new Date(`${currentYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`).toISOString();
        }

        // Default to current date
        return new Date().toISOString();
    };

    // Simple regex-based parsing for common bank patterns
    const parseTransactionText = async (text: string): Promise<Partial<TAddTransaction>> => {
        // Common Vietnamese bank notification patterns
        const patterns = [
            // Pattern: "TK 1234: -500,000VND luc 10:30 15/10. SD: 1,500,000VND"
            {
                regex: /TK\s*\d+:\s*([+-]?)([\d,\.]+[KkMmTt]?)\s*VND.*?(\d{1,2}[\/\-]\d{1,2}(?:[\/\-]\d{4})?)/i,
                handler: (match: RegExpMatchArray) => ({
                    amount: parseAmount(match[2]),
                    direction: (match[1] === '+' ? "in" : "out") as "in" | "out",
                    description: `Transaction from ${text.substring(0, 50)}...`,
                    date: parseDate(match[3]),
                })
            },
            // Pattern: "Chuyen khoan den: 500,000VND" or "Chuyen khoan den: 50k"
            {
                regex: /Chuyen khoan den:\s*([\d,\.]+[KkMmTt]?)\s*VND/i,
                handler: (match: RegExpMatchArray) => ({
                    amount: parseAmount(match[1]),
                    direction: "out" as "in" | "out",
                    description: "Chuyển khoản đi",
                    date: parseDate(text),
                })
            },
            // Pattern: "Nhan chuyen khoan: 1,000,000VND" or "Nhan chuyen khoan: 1M"
            {
                regex: /Nhan chuyen khoan:\s*([\d,\.]+[KkMmTt]?)\s*VND/i,
                handler: (match: RegExpMatchArray) => ({
                    amount: parseAmount(match[1]),
                    direction: "in" as "in" | "out",
                    description: "Nhận chuyển khoản",
                    date: parseDate(text),
                })
            },
            // Pattern: Simple amount detection with VND
            {
                regex: /([+-]?)([\d,\.]+[KkMmTt]?)\s*VND/i,
                handler: (match: RegExpMatchArray) => ({
                    amount: parseAmount(match[2]),
                    direction: (match[1] === '+' ? "in" : "out") as "in" | "out",
                    description: text.substring(0, 100),
                    date: parseDate(text),
                })
            },
            // Pattern: Simple amount detection without VND
            {
                regex: /([+-]?)([\d,\.]+[KkMmTt]?)/i,
                handler: (match: RegExpMatchArray) => ({
                    amount: parseAmount(match[2]),
                    direction: (match[1] === '+' ? "in" : "out") as "in" | "out",
                    description: text.substring(0, 100),
                    date: parseDate(text),
                })
            }
        ];

        for (const pattern of patterns) {
            const match = text.match(pattern.regex);

            if (match) {
                return pattern.handler(match);
            }
        }

        return {
            amount: 0,
            direction: "out" as "in" | "out",
            description: text.substring(0, 100),
            date: new Date().toISOString(),
        };
    };

    const handleUpdateTxn = (index: number, updates: Partial<TAddTransaction>) => {
        setParsedTxn(prev =>
            prev.map((t, i) => (i === index ? { ...t, ...updates } : t))
        );
    };

    const handleBulkUpdate = (updates: Partial<TAddTransaction>) => {
        if (selectedTxn.length === 0) return;

        setParsedTxn(prev =>
            prev.map((t, i) =>
                selectedTxn.includes(i) ? { ...t, ...updates } : t
            )
        );
    };

    const handleRemoveTxn = (index: number) => {
        setParsedTxn(prev => prev.filter((_, i) => i !== index));
        setSelectedTxn(prev => prev.filter(i => i !== index));
    };

    const handleSelectionChange = (selected: number[]) => {
        setSelectedTxn(selected);
    };

    const handleSubmit = () => {
        const validTransactions = parsedTxn.filter(
            t => t.parsingStatus === "success" && t.amount > 0 && t.card_id > 0
        );

        if (validTransactions.length === 0) {
            addToast({
                color: "warning",
                title: "No valid transactions",
                description: "Please ensure all transactions have valid amounts and are assigned to a card.",
            });

            return;
        }

        createMultipleTransactions({
            body: {
                list_transactions: validTransactions.map(({ originalText: _originalText, parsingStatus: _parsingStatus, errorMessage: _errorMessage, ...transaction }) => transaction),
            },
        });
    };

    useEffect(() => {
        fetchCards();
        fetchCategories();
    }, []);

    useEffect(() => {
        if (fetchCardsResult) {
            setCardOptions(fetchCardsResult?.results?.map((card: TCard) => ({
                key: card.card_id.toString(),
                label: card.card_name,
                startIcon: (
                    <Image
                        alt={`card ${card.card_id} bank logo`}
                        className={"w-4"}
                        height={1200}
                        src={getBankLogo(card.bank_code, 1)}
                        width={1200}
                    />
                ),
            })) ?? [])
        }
    }, [fetchCardsResult]);

    useEffect(() => {
        if (fetchCategoriesResult) {
            setCategoryOptions(fetchCategoriesResult.results ?? []);
        }
    }, [fetchCategoriesResult]);

    useEffect(() => {
        if (createMultipleResult) {
            addToast({
                color: "success",
                title: "Success",
                description: createMultipleResult.message,
            });

            setInputText("");
            setParsedTxn([]);
            setSelectedTxn([]);
        }

        if (createMultipleError) {
            const parseError = JSON.parse(createMultipleError);

            addToast({
                color: "danger",
                title: "Error",
                description: parseError.message || "Failed to create transactions",
            });
        }
    }, [createMultipleResult, createMultipleError]);

    useEffect(() => {
        setInputText("");
        setParsedTxn([]);
        setSelectedTxn([]);
    }, []);

    const hasValidTransactions = parsedTxn.some(
        t => t.parsingStatus === "success" && t.amount > 0 && t.card_id > 0
    );

    return (
        <Container
            gapSize={8}
            orientation={"vertical"}
        >

            <div className="w-full flex flex-row gap-4">
                <div className="w-1/3 flex flex-col gap-4 border-r pr-4">
                    <Alert
                        color="primary"
                        description={inputText.length > 0 ?
                            "Review and edit the parsed transactions below before submitting."
                            : "Try pasting your bank notification texts and see how we parse them automatically."}
                        title={`Found ${parsedTxn.length} transactions`}
                    />
                    <div className="w-full flex flex-col gap-2">
                        <Textarea
                            label="Bank Notification Texts"
                            labelPlacement="outside"
                            minRows={6}
                            placeholder={'Paste bank notification texts here. Example: TK 1234: -500,000VND luc 10:30 15/10'}
                            value={inputText}
                            variant="bordered"
                            onValueChange={setInputText}
                        />
                        <Button
                            color="primary"
                            isDisabled={!inputText.trim() || isParsing}
                            isLoading={isParsing}
                            onPress={parseTransactions}
                        >
                            {isParsing ? "Parsing..." : "Parse Transactions"}
                        </Button>
                    </div>
                </div>
                <div className="w-2/3 flex flex-col gap-4">

                    {selectedTxn.length > 0 && (
                        <BulkEditToolbar
                            listCards={cardOptions}
                            listCategories={categoryOptions}
                            selectedCount={selectedTxn.length}
                            onBulkUpdate={handleBulkUpdate}
                        />
                    )}

                    <ParsedTransactionTable
                        selectedTransactions={selectedTxn}
                        transactions={parsedTxn}
                        onSelectionChange={handleSelectionChange}
                        onTransactionRemove={handleRemoveTxn}
                        onTransactionUpdate={handleUpdateTxn}
                    />


                </div>
            </div>


            <div className="w-full flex justify-between items-center">
                <div className="text-sm text-default-500">
                    {hasValidTransactions
                        ? `${parsedTxn.filter(t => t.parsingStatus === "success" && t.amount > 0 && t.card_id > 0).length} valid transactions ready to submit`
                        : "No valid transactions to submit"
                    }
                </div>
                <Button
                    color="success"
                    isDisabled={!hasValidTransactions || creatingMultiple}
                    isLoading={creatingMultiple}
                    onPress={handleSubmit}
                >
                    {creatingMultiple ? "Creating..." : `Create ${parsedTxn.filter(t => t.parsingStatus === "success" && t.amount > 0 && t.card_id > 0).length} Transactions`}
                </Button>
            </div>

        </Container>

    );
}