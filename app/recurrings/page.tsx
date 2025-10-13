"use client";

import { useEffect, useState } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { getKeyValue, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@heroui/table";
import clsx from "clsx";
import moment from "moment";
import { Button } from "@heroui/button";
import { useRouter } from "next/navigation";
import { useFetch } from "hieutndev-toolkit";
import { useWindowSize } from "hieutndev-toolkit";
import { Chip } from "@heroui/chip";
import { addToast } from "@heroui/toast";
import { useDisclosure } from "@heroui/modal";

import { IAPIResponse } from "@/types/global";
import { TCard } from "@/types/card";
import ICONS from "@/configs/icons";
import { BREAK_POINT } from "@/configs/break-point";
import { TCompleteInstanceFormData, TRecurringInstance, TRecurringInstanceProjection, TRecurringInstancesResponse, TRecurringInstanceStatus } from "@/types/recurring";
import { API_ENDPOINT } from "@/configs/api-endpoint";
import CustomModal from "@/components/shared/custom-modal/custom-modal";
import RecurringInstanceForm from "@/components/recurrings/recurring-instance-form";
import LoadingBlock from "@/components/shared/loading-block/loading-block";
import SelectCardRadioGroup from "@/components/shared/select-card-radio-group/select-card-radio-group";

export default function RecurringPage() {
    const router = useRouter();
    const { width } = useWindowSize();

    const [recurringStats, setRecurringStats] = useState([
        { label: "Total Instances", value: "0", color: "primary" },
        { label: "Pending", value: "0", color: "warning" },
        { label: "Completed", value: "0", color: "success" },
        { label: "Overdue", value: "0", color: "danger" },
        { label: "Skipped", value: "0", color: "secondary" },
    ]);

    // Fetch cards for filter
    const {
        data: fetchCardResults,
        error: fetchCardError,
    } = useFetch<IAPIResponse<TCard[]>>(API_ENDPOINT.CARDS.BASE);

    const [listCards, setListCards] = useState<TCard[]>([]);
    const [selectedCard, setSelectedCard] = useState<number | null>(null);

    useEffect(() => {
        if (fetchCardResults) {
            const cards = fetchCardResults.results ?? [];

            setListCards(cards);

            if (cards.length > 0 && selectedCard === null) {
                setSelectedCard(cards[0].card_id);
            }
        }

        if (fetchCardError) {
            addToast({
                title: "Error",
                description: JSON.parse(fetchCardError).message,
                color: "danger",
            });
        }
    }, [fetchCardResults, fetchCardError, selectedCard]);

    const {
        data: fetchInstancesResults,
        loading: fetchingInstances,
        error: fetchInstancesError,
        fetch: fetchInstances
    } = useFetch<IAPIResponse<TRecurringInstancesResponse>>(
        API_ENDPOINT.RECURRINGS.INSTANCES,
        {
            card_id: selectedCard,
        },
        {
            method: "GET",
            skip: true,
        }
    );

    useEffect(() => {
        if (selectedCard !== null) {
            fetchInstances();
        }
    }, [selectedCard]);

    useEffect(() => {
        if (fetchInstancesResults && fetchInstancesResults.results) {
            const { total_instances, count_completed, count_pending, count_overdue, count_skipped } = fetchInstancesResults.results.analysis;

            setRecurringStats([
                { label: "Total Instances", value: total_instances.toLocaleString(), color: "primary" },
                {
                    label: "Pending",
                    value: count_pending.toLocaleString(),
                    color: "warning",
                },
                {
                    label: "Completed",
                    value: count_completed.toLocaleString(),
                    color: "success",
                },
                {
                    label: "Overdue",
                    value: count_overdue.toLocaleString(),
                    color: "danger",
                },
                {
                    label: "Skipped",
                    value: count_skipped.toLocaleString(),
                    color: "secondary",
                },
            ]);
        }

        if (fetchInstancesError) {
            const parsedError = JSON.parse(fetchInstancesError);

            addToast({
                title: "Error",
                description: parsedError.message,
                color: "danger",
            });
        }
    }, [fetchInstancesResults, fetchInstancesError]);

    /* HANDLE SELECTED INSTANCE */
    const [selectedInstance, setSelectedInstance] = useState<TRecurringInstanceProjection | null>(null);
    const [action, setAction] = useState<'skip' | 'create' | null>(null);

    const handleSelectedInstance = (instance: TRecurringInstanceProjection, action: 'skip' | 'create') => {
        setSelectedInstance(instance);
        setAction(action);
    };

    const resetSelectedInstance = () => {
        setSelectedInstance(null);
        setAction(null);
    }

    const { isOpen, onOpenChange } = useDisclosure();

    useEffect(() => {
        if (selectedInstance !== null && action !== null) {
            switch (action) {
                case 'create':
                    onOpenChange();
                    break;

                case 'skip':
                    // call skip API
                    skipInstance({
                        body: {
                            reason: 'Skipped by user'
                        }
                    });
                    resetSelectedInstance();
                    break;

                case 'create':
                    onOpenChange();
                    break;

                default:
                    break;
            }
        }
    }, [selectedInstance, action]);

    useEffect(() => {
        if (isOpen === false) {
            resetSelectedInstance();
        }
    }, [isOpen]);



    /* HANDLE CREATE TRANSACTION */

    const { data: createTransactionResult, error: createTransactionError, loading: creatingTransaction, fetch: createTransaction } = useFetch<IAPIResponse>(API_ENDPOINT.RECURRINGS.INSTANCE_CREATE_TRANSACTION(selectedInstance?.instance_id?.toString() ?? '-1'), {
        method: 'POST',
        skip: true,
    })

    useEffect(() => {
        if (createTransactionResult) {
            addToast({
                title: "Success",
                description: createTransactionResult.message,
                color: "success",
            });
            fetchInstances();
            onOpenChange();
        }

        if (createTransactionError) {
            const parsedError = JSON.parse(createTransactionError);

            addToast({
                title: "Error",
                description: parsedError.message,
                color: "danger",
            });
        }
    }, [createTransactionResult, createTransactionError]);

    /* HANDLE SKIP INSTANCE */

    const {
        data: skipInstanceResult,
        error: skipInstanceError,
        loading: skippingInstance,
        fetch: skipInstance
    } = useFetch<IAPIResponse>(API_ENDPOINT.RECURRINGS.INSTANCE_SKIP(selectedInstance?.instance_id?.toString() ?? '-1'), {
        method: 'POST',
        skip: true,
    })

    useEffect(() => {
        if (skipInstanceResult) {
            addToast({
                title: "Success",
                description: skipInstanceResult.message,
                color: "success",
            });
            fetchInstances();
        }

        if (skipInstanceError) {
            const parsedError = JSON.parse(skipInstanceError);

            addToast({
                title: "Error",
                description: parsedError.message,
                color: "danger",
            });
        }
    }, [skipInstanceResult, skipInstanceError]);



    const handleAddTransactionFromInstance = (instanceId: TRecurringInstance['instance_id'], payload: TCompleteInstanceFormData) => {
        createTransaction({
            url: API_ENDPOINT.RECURRINGS.INSTANCE_CREATE_TRANSACTION(instanceId.toString()),
            method: 'POST',
            body: {
                amount: payload.actual_amount,
                transaction_date: payload.actual_date,
                category_id: payload.category_id,
                note: payload.notes,
            },
        });
    }



    const getStatusColor = (status: TRecurringInstanceStatus): "success" | "warning" | "primary" | "default" | "danger" => {
        switch (status) {
            case 'completed':
                return 'success';
            case 'pending':
                return 'warning';
            case 'modified':
                return 'primary';
            case 'skipped':
            case 'cancelled':
                return 'default';
            case 'overdue':
                return 'danger';
            default:
                return 'default';
        }
    };

    const columns = [
        { key: "scheduled_date", label: "Date" },
        { key: "recurring_name", label: "Name" },
        { key: "old_balance", label: "Old Balance" },
        { key: "scheduled_amount", label: "Amount" },
        { key: "new_balance", label: "New Balance" },
        { key: "status", label: "Status" },
        { key: "actions", label: "Actions" },
    ];

    return (
        <section className={"flex flex-col gap-4"}>
            <div className={"flex items-center justify-between"}>
                <h3 className={"text-2xl font-semibold"}>Recurring Transactions Board</h3>
                <Button
                    color={"primary"}
                    isIconOnly={width < BREAK_POINT.SM}
                    startContent={ICONS.NEW.MD}
                    onPress={() => router.push("/settings/recurrings/new")}
                >
                    {width >= BREAK_POINT.SM ? "Create Recurring" : ""}
                </Button>
            </div>
            {/* Stats */}

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {
                    recurringStats.map((stat, index) => {
                        return (
                            <Card key={index} className={`bg-${stat.color}-50 rounded-lg`}>
                                <CardHeader className={`justify-center text-sm text-${stat.color}-400 font-medium`}>{stat.label}</CardHeader>
                                <CardBody className={`w-full text-center pt-0 text-2xl font-semibold text-${stat.color}-600`}>
                                    {stat.value}
                                </CardBody>
                            </Card>);
                    })
                }
            </div>

            {/* Filters */}
            <div className={"flex flex-col gap-2"}>
                <SelectCardRadioGroup
                    cards={listCards}
                    compact
                    label="Filter by card"
                    value={selectedCard ?? 0}
                    onValueChange={(value) => setSelectedCard(value ? parseInt(value) : null)}
                />
            </div>

            {/* Table */}
            <Table isHeaderSticky aria-label="Recurring instances table">
                <TableHeader columns={columns}>
                    {(column) => <TableColumn key={column.key}>{column.label}</TableColumn>}
                </TableHeader>
                <TableBody
                    emptyContent={fetchingInstances ? <LoadingBlock /> : "No recurring instances found"}
                    isLoading={fetchingInstances}
                    items={fetchInstancesResults?.results?.instances || []}
                >
                    {(item: TRecurringInstanceProjection) => {
                        return (
                            <TableRow key={item.instance_id}>
                                {(columnKey) => {
                                    switch (columnKey) {
                                        case "scheduled_date":
                                            return (
                                                <TableCell>
                                                    <div>
                                                        <p className="font-medium">
                                                            {moment(item.scheduled_date).format("DD-MM-YYYY")}
                                                        </p>
                                                        <p className="text-xs text-default-500">
                                                            {moment(item.scheduled_date).format("dddd")}
                                                        </p>
                                                    </div>
                                                </TableCell>
                                            );
                                        case "recurring_name":
                                            return (
                                                <TableCell>
                                                    <div>
                                                        <p className="font-medium">{item.recurring_name}</p>
                                                        {item.category_name && (
                                                            <p className="text-xs text-default-500">{item.category_name}</p>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            );
                                        case "old_balance":
                                            return (
                                                <TableCell>
                                                    <span className="font-medium">
                                                        {(item.old_balance || 0).toLocaleString()}
                                                    </span>
                                                </TableCell>
                                            );
                                        case "scheduled_amount":
                                            return (
                                                <TableCell>
                                                    <span
                                                        className={clsx("font-semibold", {
                                                            "text-success": item.direction === "in",
                                                            "text-danger": item.direction === "out",
                                                        })}
                                                    >
                                                        {item.direction === "in" ? "+" : "-"}
                                                        {item.scheduled_amount.toLocaleString()}
                                                    </span>
                                                </TableCell>
                                            );
                                        case "new_balance":
                                            return (
                                                <TableCell>
                                                    <span
                                                        className={clsx("font-semibold", {
                                                            "text-success": (item.new_balance || 0) >= 0,
                                                            "text-danger": (item.new_balance || 0) < 0,
                                                        })}
                                                    >
                                                        {(item.new_balance || 0).toLocaleString()}
                                                    </span>
                                                </TableCell>
                                            );
                                        case "status":
                                            return (
                                                <TableCell>
                                                    <Chip className={"capitalize"} color={getStatusColor(item.status)} size="sm" variant="flat">
                                                        {item.status}
                                                    </Chip>
                                                </TableCell>
                                            );
                                        case "actions":
                                            return (
                                                <TableCell>
                                                    <div className="flex gap-1">
                                                        <Button
                                                            isIconOnly
                                                            color="warning"
                                                            isDisabled={item.status !== 'pending' && item.status !== 'overdue'}
                                                            isLoading={skippingInstance}
                                                            size="sm"
                                                            title="Skip"
                                                            variant="flat"
                                                            onPress={() => handleSelectedInstance(item, 'skip')}
                                                        >
                                                            {ICONS.XMARK.MD}
                                                        </Button>

                                                        <Button
                                                            isIconOnly
                                                            color="primary"
                                                            isDisabled={item.status !== 'pending' && item.status !== 'overdue'}
                                                            isLoading={creatingTransaction}
                                                            size="sm"
                                                            title="Create Transaction"
                                                            variant="flat"
                                                            onPress={() => handleSelectedInstance(item, 'create')}
                                                        >
                                                            {ICONS.NEW.MD}
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            );
                                        default:
                                            return <TableCell>{getKeyValue(item, columnKey)}</TableCell>;
                                    }
                                }}
                            </TableRow>
                        );
                    }}
                </TableBody>
            </Table>
            <CustomModal
                isOpen={isOpen}
                title="Create Transaction From Instance"
                onOpenChange={onOpenChange}
            >
                <RecurringInstanceForm
                    instanceId={selectedInstance?.instance_id ?? -1}
                    isLoading={creatingTransaction}
                    onSubmit={handleAddTransactionFromInstance}
                />
            </CustomModal>
        </section>
    );
}
