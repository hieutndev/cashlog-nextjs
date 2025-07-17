"use client";
import { Alert } from "@heroui/alert";
import { Card, CardHeader, CardBody } from "@heroui/card";
import { Divider } from "@heroui/divider";
import { useEffect } from "react";
import { Spinner } from "@heroui/spinner";
import { clsx } from "clsx";

import { RenderCompareData } from "./compare-data";

import ICONS from "@/configs/icons";

interface CompareCardProps {
	title: string;
	existingData: string[];
	missingData: string[];
	emptyMessage?: string;
	isLoading?: boolean;
}

export default function CompareCard({
	existingData,
	missingData,
	title,
	emptyMessage,
	isLoading = true,
}: CompareCardProps) {
	useEffect(() => {
		console.log("Existing Data: ", existingData);
		console.log("Missing Data: ", missingData);
	}, [existingData, missingData]);

	return (
		<Card>
			<CardHeader className={"py-4"}>
				<h2 className={"w-full text-center text-2xl font-medium text-default-200"}>{title}</h2>
			</CardHeader>
			<CardBody className={clsx("", {
                "p-6 py-12": isLoading,
                "p-6 pt-0": !isLoading
            })}>
				{isLoading ? (
					<Spinner>Validating...</Spinner>
				) : Array.isArray(missingData) && missingData.length > 0 ? (
					<div className={"w-full flex items-start gap-4"}>
						<div className={"w-1/2 flex flex-col gap-4"}>
							<div className={"flex items-center gap-2 text-success"}>
								{ICONS.CHECK_CIRCLE.LG}
								<h4 className={"text-lg font-medium"}>Existing Data</h4>
							</div>

							<RenderCompareData
								data={existingData}
								type="success"
							/>
						</div>
						<Divider orientation={"vertical"} />
						<div className={"w-1/2 flex flex-col gap-4"}>
							<div className={"flex items-center gap-2 text-danger"}>
								{ICONS.ALERT_CIRCLE.LG}
								<h4 className={"text-lg font-medium"}>Missing Data</h4>
							</div>
							<RenderCompareData
								data={missingData}
								type="danger"
							/>
						</div>
					</div>
				) : (
					<Alert color={"success"}>{emptyMessage}</Alert>
				)}
			</CardBody>
		</Card>
	);
}
