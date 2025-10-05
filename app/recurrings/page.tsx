"use client";

import { useEffect, useState } from "react";
import { RadioGroup } from "@heroui/radio";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { getKeyValue, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@heroui/table";
import clsx from "clsx";
import moment from "moment";
import { Button } from "@heroui/button";
import { useRouter } from "next/navigation";
import { useFetch } from "hieutndev-toolkit";
import { useWindowSize } from "hieutndev-toolkit";
import { Chip } from "@heroui/chip";
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@heroui/dropdown";
import { addToast } from "@heroui/toast";

import { IAPIResponse } from "@/types/global";
import { TCard } from "@/types/card";
import BankCardRadio from "@/components/shared/bank-card-radio/bank-card-radio";
import ICONS from "@/configs/icons";
import { BREAK_POINT } from "@/configs/break-point";
import { TRecurringResponse, TRecurringStatus, TFrequencyType } from "@/types/recurring";
import { SITE_CONFIG } from "@/configs/site-config";
import { useRecurringActions } from "@/hooks/useRecurringActions";

export default function RecurringPage() {
    const router = useRouter();
    const { width } = useWindowSize();

    const [recurringStats, setRecurringStats] = useState([
        { label: "Total Recurrings", value: "0", color: "primary" },
        { label: "Active", value: "0", color: "success" },
        { label: "Monthly Income", value: "0", color: "success" },
        { label: "Monthly Expenses", value: "0", color: "danger" },
    ]);

    // Fetch cards for filter
    const {
        data: fetchCardResults,
        error: fetchCardError,
    } = useFetch<IAPIResponse<TCard[]>>("/cards");

    const [listCards, setListCards] = useState<TCard[]>([]);
    const [selectedCard, setSelectedCard] = useState<number | null>(null);

    useEffect(() => {
        if (fetchCardResults) {
            setListCards(fetchCardResults.results ?? []);
        }

        if (fetchCardError) {
            addToast({
                title: "Error",
                description: JSON.parse(fetchCardError).message,
                color: "danger",
            });
        }
    }, [fetchCardResults, fetchCardError]);

    // const {recurrings, loading, error, refetch} = useRecurrings(filters);
    const { deleteRecurringAction } = useRecurringActions();

    const {
        data: fetchRecurringsResults,
        loading: fetchingRecurrings,
        error: fetchRecurringsError,
        fetch: fetchRecurrings
    } = useFetch<IAPIResponse<TRecurringResponse[]>>(`/recurrings`,
        {
            card_id: selectedCard,
        },
        {
            method: "GET",
        }
    );


    useEffect(() => {
        if (fetchRecurringsResults && fetchRecurringsResults.results) {
            setRecurringStats([
                { label: "Total Recurrings", value: (fetchRecurringsResults.results.length || 0).toLocaleString(), color: "primary" },
                {
                    label: "Active",
                    value: fetchRecurringsResults.results.filter((r) => r.status === 'active').length.toLocaleString(),
                    color: "success",
                },
                {
                    label: "Monthly Income",
                    value: fetchRecurringsResults.results.reduce((acc, r) => {
                        if (r.status === 'active' && r.direction === 'in') {
                            return acc + Number(r.amount);
                        }

                        return acc;
                    }, 0).toLocaleString() + SITE_CONFIG.CURRENCY_STRING,
                    color: "success",
                },
                {
                    label: "Monthly Expenses",
                    value: fetchRecurringsResults.results.reduce((acc, r) => {
                        if (r.status === 'active' && r.direction === 'out') {
                            return acc + Number(r.amount);
                        }

                        return acc;
                    }, 0).toLocaleString() + SITE_CONFIG.CURRENCY_STRING,
                    color: "danger",
                },
            ]);
        }

        if (fetchRecurringsError) {
            const parsedError = JSON.parse(fetchRecurringsError);

            console.log('parsedError', parsedError);

            addToast({
                title: "Error",
                description: parsedError.message,
                color: "danger",
            })
        }
    }, [fetchRecurringsResults, fetchRecurringsError]);

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this recurring transaction?')) {
            return;
        }

        const success = await deleteRecurringAction(id, {
            delete_instances: false,
            keep_completed_transactions: true,
        });

        if (success) {
            addToast({
                title: "Success",
                description: "Recurring transaction deleted successfully",
                color: "success",
            });
        }
    };

    const getStatusColor = (status: TRecurringStatus): "success" | "warning" | "primary" | "default" => {
        switch (status) {
            case 'active':
                return 'success';
            case 'paused':
                return 'warning';
            case 'completed':
                return 'primary';
            case 'cancelled':
                return 'default';
            default:
                return 'default';
        }
    };

    const formatFrequency = (frequency: TFrequencyType, interval: number) => {
        const base = frequency.charAt(0).toUpperCase() + frequency.slice(1);

        if (interval === 1) {
            return base;
        }

        return `Every ${interval} ${frequency}`;
    };

    const columns = [
        { key: "recurring_name", label: "Name" },
        { key: "amount", label: "Amount" },
        { key: "frequency", label: "Frequency" },
        { key: "card_name", label: "Card" },
        { key: "next_scheduled_date", label: "Next Date" },
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

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
            <div className={"flex flex-col md:flex-row gap-4"}>
                <RadioGroup
                    label={"Filter by card"}
                    orientation="horizontal"
                    value={selectedCard ? selectedCard.toString() ?? '' : ''}
                    onValueChange={(value) => setSelectedCard(value ? parseInt(value) : null)}
                >
                    {listCards && listCards.length > 0 ? (
                        listCards.map((card) => (
                            <BankCardRadio
                                key={card.card_id.toString()}
                                bank_code={card.bank_code}
                                card_balance={card.card_balance}
                                card_id={card.card_id}
                                card_name={card.card_name}
                            />
                        ))
                    ) : null}
                </RadioGroup>
            </div>

            {/* Table */}
            <Table isHeaderSticky aria-label="Recurring transactions table">
                <TableHeader columns={columns}>
                    {(column) => <TableColumn key={column.key}>{column.label}</TableColumn>}
                </TableHeader>
                <TableBody
                    emptyContent={fetchingRecurrings ? "Loading..." : "No recurring transactions found"}
                    isLoading={fetchingRecurrings}
                    items={fetchRecurringsResults?.results || []}
                >
                    {(item: TRecurringResponse) => (
                        <TableRow key={item.recurring_id}>
                            {(columnKey) => {
                                switch (columnKey) {
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
                                    case "amount":
                                        return (
                                            <TableCell>
                                                <span
                                                    className={clsx("font-semibold", {
                                                        "text-success": item.direction === "in",
                                                        "text-danger": item.direction === "out",
                                                    })}
                                                >
                                                    {item.direction === "in" ? "+" : "-"}
                                                    {item.amount.toLocaleString()}
                                                </span>
                                            </TableCell>
                                        );
                                    case "frequency":
                                        return (
                                            <TableCell>
                                                {formatFrequency(item.frequency, item.interval)}
                                            </TableCell>
                                        );
                                    case "card_name":
                                        return <TableCell>{item.card_name || "N/A"}</TableCell>;
                                    case "next_scheduled_date":
                                        return (
                                            <TableCell>
                                                {item.next_scheduled_date
                                                    ? moment(item.next_scheduled_date).format("DD-MM-YYYY")
                                                    : "N/A"}
                                            </TableCell>
                                        );
                                    case "status":
                                        return (
                                            <TableCell>
                                                <Chip color={getStatusColor(item.status)} size="sm" variant="flat">
                                                    {item.status}
                                                </Chip>
                                            </TableCell>
                                        );
                                    case "actions":
                                        return (
                                            <TableCell>
                                                <Dropdown>
                                                    <DropdownTrigger>
                                                        <Button isIconOnly size="sm" variant="light">
                                                            {ICONS.ELLIPSIS.MD}
                                                        </Button>
                                                    </DropdownTrigger>
                                                    <DropdownMenu aria-label="Actions">
                                                        <DropdownItem
                                                            key="view"
                                                            onPress={() => router.push(`/settings/recurrings/${item.recurring_id}`)}
                                                        >
                                                            View Details
                                                        </DropdownItem>
                                                        <DropdownItem
                                                            key="edit"
                                                            onPress={() => router.push(`/settings/recurrings/${item.recurring_id}`)}
                                                        >
                                                            Edit
                                                        </DropdownItem>
                                                        <DropdownItem
                                                            key="delete"
                                                            className="text-danger"
                                                            color="danger"
                                                            onPress={() => handleDelete(item.recurring_id)}
                                                        >
                                                            Delete
                                                        </DropdownItem>
                                                    </DropdownMenu>
                                                </Dropdown>
                                            </TableCell>
                                        );
                                    default:
                                        return <TableCell>{getKeyValue(item, columnKey)}</TableCell>;
                                }
                            }}
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </section>
    );
}
