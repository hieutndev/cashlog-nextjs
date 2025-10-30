"use client";
import { addToast } from "@heroui/toast";
import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Divider } from "@heroui/divider";
import { useWindowSize } from "hieutndev-toolkit";
import moment from "moment";

import Container from "@/components/shared/container/container";
import InputCollectionStep from "@/components/transactions/import-from-sms/steps-wizard/input-collection-step";
import ReviewEditStep from "@/components/transactions/import-from-sms/steps-wizard/review-edit-step";
import SuccessConfirmationStep from "@/components/transactions/import-from-sms/steps-wizard/success-confirmation-step";
import Stepper, { Step } from "@/components/transactions/import-from-xlsx/steps-wizard/stepper";
import { getBankLogo } from "@/configs/bank";
import { useCardEndpoint } from "@/hooks/useCardEndpoint";
import { useCategoryEndpoint } from "@/hooks/useCategoryEndpoint";
import { useImportTransactionEndpoint } from "@/hooks/useImportTransactionEndpoint";
import { useSmsImportEndpoint } from "@/hooks/useSmsImportEndpoint";
import { TCard } from "@/types/card";
import { TCategory } from "@/types/category";
import { FilterAndSortItem } from "@/types/global";
import { TAddTransaction } from "@/types/transaction";

interface ParsedTransaction extends TAddTransaction {
    originalText: string;
    parsingStatus: "pending" | "success" | "error";
    errorMessage?: string;
}

export default function BulkAddTransactionsPage() {
    const { width } = useWindowSize();

    // Wizard state
    const [currentStep, setCurrentStep] = useState<number>(1);
    const [listSteps, setListSteps] = useState<Step[]>([
        {
            id: 1,
            title: "Input Collection",
            description: "Select bank and enter SMS messages",
            status: "current",
        },
        {
            id: 2,
            title: "Review & Edit",
            description: "Review and customize transactions",
            status: "pending",
        },
        {
            id: 3,
            title: "Success",
            description: "Transactions imported successfully",
            status: "pending",
        },
    ]);

    // SMS Import state
    const [parsedTxn, setParsedTxn] = useState<ParsedTransaction[]>([]);

    useEffect(() => {
        console.log('parsedTxn', parsedTxn);
    }, [parsedTxn]);

    const [smsText, setSmsText] = useState("");
    const [manualText, setManualText] = useState("");
    const [selectedCardId, setSelectedCardId] = useState<number>(0);
    const [allCards, setAllCards] = useState<TCard[]>([]);
    const [cardOptions, setCardOptions] = useState<FilterAndSortItem[]>([]);
    const [categoryOptions, setCategoryOptions] = useState<TCategory[]>([]);
    const [importedCount, setImportedCount] = useState<number>(0);
    const [inputMode, setInputMode] = useState<"sms" | "manual">("sms");

    const { useGetListCards } = useCardEndpoint();
    const { useGetCategories } = useCategoryEndpoint();
    const { useCreateMultipleTransactions } = useImportTransactionEndpoint();
    const { useParseSMS, useParseManual } = useSmsImportEndpoint();

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

    const selectedCard = allCards.find(c => c.card_id === selectedCardId);
    const selectedBankCode = selectedCard?.bank_code || "VIETCOMBANK";

    const {
        data: parseSMSResult,
        loading: parsingFromSMS,
        error: parseSMSError,
        fetch: parseSMS,
    } = useParseSMS({ smsText, bankCode: selectedBankCode as any });

    const {
        data: parseManualResult,
        loading: parsingFromManual,
        error: parseManualError,
        fetch: parseManual,
    } = useParseManual({ manualText, parseType: "manual" });

    // Step navigation handler
    const handleUpdateStep = useCallback(
        (type: "next" | "back" = "next", times: number = 1) => {
            const nextStep = type === "next" ? currentStep + times : currentStep - times;

            setCurrentStep(nextStep);

            setListSteps((prevSteps) =>
                prevSteps.map((step) => {
                    if (nextStep !== listSteps.length) {
                        if (step.id < nextStep) {
                            return {
                                ...step,
                                status: "completed",
                            };
                        } else if (step.id === nextStep) {
                            return {
                                ...step,
                                status: "current",
                            };
                        } else {
                            return {
                                ...step,
                                status: "pending",
                            };
                        }
                    } else {
                        return {
                            ...step,
                            status: "completed",
                        };
                    }
                })
            );
        },
        [currentStep, listSteps]
    );


    // Handler for parsing SMS
    const handleParseSMS = () => {
        if (!smsText.trim()) {
            addToast({
                color: "warning",
                title: "Empty SMS",
                description: "Please enter SMS text to parse",
            });

            return;
        }

        setInputMode("sms");
        parseSMS();
    };

    // Handler for parsing manual input
    const handleParseManualInput = () => {
        if (!manualText.trim()) {
            addToast({
                color: "warning",
                title: "Empty Input",
                description: "Please enter transaction data to parse",
            });

            return;
        }

        setInputMode("manual");
        parseManual();
    };

    // Handler for moving to step 2 after parsing
    const handleParseSuccess = () => {
        handleUpdateStep("next");
    };

    // Handler for updating a transaction
    const handleUpdateTxn = (index: number, updates: Partial<TAddTransaction>) => {
        setParsedTxn(prev =>
            prev.map((t, i) => (i === index ? { ...t, ...updates } : t))
        );
    };

    // Handler for removing a transaction
    const handleRemoveTxn = (index: number) => {
        setParsedTxn(prev => prev.filter((_, i) => i !== index));
    };

    // Handler for selection change
    const handleSelectionChange = (_selected: number[]) => {
        // This is handled in ReviewEditStep
    };

    // Handler for importing transactions
    const handleImport = () => {
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

        setImportedCount(validTransactions.length);

        createMultipleTransactions({
            body: {
                list_transactions: validTransactions.map(({ originalText: _originalText, parsingStatus: _parsingStatus, errorMessage: _errorMessage, ...transaction }) => {
                    transaction.date = moment(transaction.date, 'YYYY-MM-DD').toISOString();

                    return transaction
                }),
            },
        });
    };

    // Handler for starting a new import
    const handleNewImport = () => {
        setParsedTxn([]);
        setSmsText("");
        setManualText("");
        setCurrentStep(1);
        setListSteps([
            {
                id: 1,
                title: "Input Collection",
                description: "Select bank and enter SMS messages",
                status: "current",
            },
            {
                id: 2,
                title: "Review & Edit",
                description: "Review and customize transactions",
                status: "pending",
            },
            {
                id: 3,
                title: "Success",
                description: "Transactions imported successfully",
                status: "pending",
            },
        ]);
    };

    // Fetch cards and categories on mount
    useEffect(() => {
        fetchCards();
        fetchCategories();
    }, []);

    // Handle cards fetch result
    useEffect(() => {
        if (fetchCardsResult?.results) {
            setAllCards(fetchCardsResult.results);
            setCardOptions(fetchCardsResult.results.map((card: TCard) => ({
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
            })));
            // Set the first card as default if available
            if (fetchCardsResult.results.length > 0) {
                setSelectedCardId(fetchCardsResult.results[0].card_id);
            }
        }
    }, [fetchCardsResult]);

    // Handle categories fetch result
    useEffect(() => {
        if (fetchCategoriesResult) {
            setCategoryOptions(fetchCategoriesResult.results ?? []);
        }
    }, [fetchCategoriesResult]);

    // Handle SMS parsing result
    useEffect(() => {
        if (parseSMSResult?.results) {
            const smsTransactions = parseSMSResult.results.transactions.map((smsT) => ({
                originalText: smsT.raw_sms,
                card_id: selectedCardId, // Auto-assign the selected card
                direction: smsT.type,
                category_id: null,
                date: smsT.date,
                amount: smsT.amount,
                description: smsT.description,
                parsingStatus: smsT.status as "success" | "error" | "pending",
                errorMessage: smsT.message,
            }));

            setParsedTxn(smsTransactions);
            addToast({
                color: "success",
                title: "SMS Parsed",
                description: `Successfully parsed ${parseSMSResult.results.summary.successful} transactions`,
            });

            // Move to step 2
            handleParseSuccess();
        }

        if (parseSMSError) {
            const parseError = JSON.parse(parseSMSError);

            // Check if this is an unsupported bank error
            const isUnsupportedBankError = parseError.message?.includes("SMS parsing is not supported");

            addToast({
                color: "danger",
                title: isUnsupportedBankError ? "Bank Not Supported" : "Error",
                description: parseError.message || "Failed to parse SMS",
            });

            // Don't proceed to next step on error - user stays on current page
            // This prevents navigation when bank is unsupported
        }
    }, [parseSMSResult, parseSMSError, selectedCardId]);

    // Handle manual input parsing result
    useEffect(() => {
        if (parseManualResult?.results) {
            const manualTransactions = parseManualResult.results.transactions.map((manualT) => ({
                originalText: manualT.originalText,
                card_id: manualT.card_id,
                direction: manualT.direction,
                category_id: manualT.category_id,
                date: manualT.date,
                amount: manualT.amount,
                description: manualT.description,
                parsingStatus: manualT.parsingStatus as "success" | "error" | "pending",
                errorMessage: manualT.errorMessage,
            }));

            setParsedTxn(manualTransactions);
            addToast({
                color: "success",
                title: "Manual Input Parsed",
                description: `Successfully parsed ${parseManualResult.results.summary.successful} transactions`,
            });

            handleParseSuccess();
        }

        if (parseManualError) {
            const parseError = JSON.parse(parseManualError);

            addToast({
                color: "danger",
                title: "Error",
                description: parseError.message || "Failed to parse manual input",
            });
        }
    }, [parseManualResult, parseManualError]);

    useEffect(() => {
        if (createMultipleResult) {
            addToast({
                color: "success",
                title: "Success",
                description: createMultipleResult.message,
            });

            // Move to step 3 (success)
            handleUpdateStep("next");
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

    return (
        <Container gapSize={8} orientation={"vertical"}>
            <Stepper isDot={width < 640} steps={listSteps} />
            <Divider />

            {currentStep === 1 && (
                <InputCollectionStep
                    cardOptions={cardOptions}
                    cards={allCards}
                    isLoading={parsingFromSMS || parsingFromManual}
                    manualText={manualText}
                    selectedCardId={selectedCardId}
                    smsText={smsText}
                    onCardIdChange={setSelectedCardId}
                    onManualInputSubmit={handleParseManualInput}
                    onManualTextChange={setManualText}
                    onNext={handleParseSMS}
                    onSmsTextChange={setSmsText}
                />
            )}

            {currentStep === 2 && (
                <ReviewEditStep
                    allCards={allCards}
                    cardOptions={cardOptions}
                    categoryOptions={categoryOptions}
                    inputMode={inputMode}
                    isLoading={creatingMultiple}
                    transactions={parsedTxn}
                    onBack={() => handleUpdateStep("back")}
                    onImport={handleImport}
                    onSelectionChange={handleSelectionChange}
                    onTransactionRemove={handleRemoveTxn}
                    onTransactionUpdate={handleUpdateTxn}
                />
            )}

            {currentStep === 3 && (
                <SuccessConfirmationStep
                    transactionCount={importedCount}
                    onNewImport={handleNewImport}
                />
            )}
        </Container>
    );
}