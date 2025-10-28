"use client";
import { Alert } from "@heroui/alert";
import { Textarea } from "@heroui/input";
import { addToast } from "@heroui/toast";
import { useState, useEffect } from "react";
import Image from "next/image";
import { Button } from "@heroui/button";
import { Select, SelectItem } from "@heroui/select";

import Container from "@/components/shared/container/container";
import BulkEditToolbar from "@/components/transactions/bulk-edit-toolbar";
import ParsedTransactionTable from "@/components/transactions/parsed-transaction-table";
import { getBankLogo, getBankOptions } from "@/configs/bank";
import { useCardEndpoint } from "@/hooks/useCardEndpoint";
import { useCategoryEndpoint } from "@/hooks/useCategoryEndpoint";
import { useImportTransactionEndpoint } from "@/hooks/useImportTransactionEndpoint";
import { useSmsImportEndpoint } from "@/hooks/useSmsImportEndpoint";
import { TCard } from "@/types/card";
import { TCategory } from "@/types/category";
import { FilterAndSortItem } from "@/types/global";
import { TAddTransaction } from "@/types/transaction";
import { LIST_BANKS, TBankCode } from "@/types/bank";

interface ParsedTransaction extends TAddTransaction {
    originalText: string;
    parsingStatus: "pending" | "success" | "error";
    errorMessage?: string;
}

export default function ImportTransactionsPage() {
    const [parsedTxn, setParsedTxn] = useState<ParsedTransaction[]>([]);
    const [selectedTxn, setSelectedTxn] = useState<number[]>([]);
    const [cardOptions, setCardOptions] = useState<FilterAndSortItem[]>([]);
    const [categoryOptions, setCategoryOptions] = useState<TCategory[]>([]);

    // SMS Import state
    const [smsText, setSmsText] = useState("");
    const [selectedBankCode, setSelectedBankCode] = useState<string>("VIETCOMBANK");
    const [smsCharCount, setSmsCharCount] = useState(0);

    const { useGetListCards } = useCardEndpoint();
    const { useGetCategories } = useCategoryEndpoint();
    const { useCreateMultipleTransactions } = useImportTransactionEndpoint();
    const { useParseSMS } = useSmsImportEndpoint();

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

    // SMS parsing hook
    const {
        data: parseSMSResult,
        loading: parsingFromSMS,
        error: parseSMSError,
        fetch: parseSMS,
    } = useParseSMS({ smsText, bankCode: selectedBankCode as any });





    const parseSMSTransactions = () => {
        if (!smsText.trim()) {
            addToast({
                color: "warning",
                title: "Empty SMS",
                description: "Please enter SMS text to parse",
            });

            return;
        }

        parseSMS();
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
        if (parseSMSResult?.results) {
            const smsTransactions = parseSMSResult.results.transactions.map((smsT) => ({
                originalText: smsT.raw_sms,
                card_id: 0,
                direction: smsT.type,
                category_id: null,
                date: smsT.date,
                amount: smsT.amount,
                description: smsT.description,
                parsingStatus: smsT.status as "success" | "error" | "pending",
                errorMessage: smsT.message,
            }));

            setParsedTxn(smsTransactions);
            setSmsText("");
            addToast({
                color: "success",
                title: "SMS Parsed",
                description: `Successfully parsed ${parseSMSResult.results.summary.successful} transactions`,
            });
        }


        if (parseSMSError) {
            const parseError = JSON.parse(parseSMSError);

            addToast({
                color: "danger",
                title: "Error",
                description: parseError.message || "Failed to parse SMS",
            });
        }
    }, [parseSMSResult, parseSMSError]);

    useEffect(() => {
        if (createMultipleResult) {
            addToast({
                color: "success",
                title: "Success",
                description: createMultipleResult.message,
            });

            setParsedTxn([]);
            setSelectedTxn([]);
            setSmsText("");
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
                        description={smsText.length > 0 ?
                            "Review and edit the parsed transactions below before submitting."
                            : "Paste SMS messages from your bank and we'll parse them automatically."}
                        title={`Found ${parsedTxn.length} transactions`}
                    />

                    <div className="w-full flex flex-col gap-2">
                        <Select
                            label="Select Bank"
                            labelPlacement="outside"
                            placeholder="Choose a bank"
                            renderValue={(items) => {
                                return (<div className="flex items-center gap-2">
                                    {items.map((item) => (
                                        <div
                                            key={item.key}
                                            className="flex items-center gap-1"
                                        >
                                            <Image
                                                alt={`card ${item.key} bank logo`}
                                                className={"w-4"}
                                                height={1200}
                                                src={getBankLogo(item.key as TBankCode, 1)}
                                                width={1200}
                                            />
                                            {item.rendered}
                                        </div>
                                    ))}
                                </div>)
                            }}
                            selectedKeys={[selectedBankCode]}
                            variant="bordered"
                            onChange={(e) => setSelectedBankCode(e.target.value)}
                        >
                            {LIST_BANKS.map((bank) => (
                                <SelectItem key={bank}
                                    startContent={
                                        <Image
                                            alt={`card ${bank} bank logo`}
                                            className={"w-4"}
                                            height={1200}
                                            src={getBankLogo(bank, 1)}
                                            width={1200}
                                        />
                                    }
                                >
                                    {getBankOptions.find(o => o.key === bank)?.value || bank}
                                </SelectItem>
                            ))}
                        </Select>
                        <Textarea
                            description={`${smsCharCount} characters`}
                            label="SMS Messages"
                            labelPlacement="outside"
                            maxRows={20}
                            minRows={6}
                            placeholder="Paste SMS messages from your bank here. One message per line."
                            value={smsText}
                            variant="bordered"
                            onValueChange={(value) => {
                                setSmsText(value);
                                setSmsCharCount(value.length);
                            }}
                        />
                        <Button
                            color="primary"
                            isDisabled={!smsText.trim() || parsingFromSMS}
                            isLoading={parsingFromSMS}
                            onPress={parseSMSTransactions}
                        >
                            {parsingFromSMS ? "Parsing..." : "Parse SMS"}
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