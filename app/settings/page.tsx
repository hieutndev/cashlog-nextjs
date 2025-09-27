"use client";

import { useEffect } from "react";
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from "@heroui/modal";
import { useDisclosure } from "@heroui/modal";
import { addToast } from "@heroui/toast";
import { Spinner } from "@heroui/spinner";
import { clsx } from "clsx";
import { Alert } from "@heroui/alert";

import { useFetch } from "hieutndev-toolkit";
import { IAPIResponse } from "@/types/global";
import ICONS from "@/configs/icons";

export default function SettingsPage() {
	const { isOpen, onOpen, onOpenChange } = useDisclosure();

	const {
		data: resetDataResults,
		loading: resettingData,
		error: errorResetData,
		fetch: resetData,
	} = useFetch<IAPIResponse<any>>("/settings/reset", {
		method: "POST",
		skip: true,
	});

	// Handle reset response
	useEffect(() => {
		if (resetDataResults) {
			addToast({
				title: "Success",
				description: resetDataResults.message || "Account data has been successfully reset",
				color: "success",
			});
			onOpenChange();
		}

		if (errorResetData) {
			addToast({
				title: "Error",
				description: "Failed to reset account data. Please try again.",
				color: "danger",
			});
		}
	}, [resetDataResults, errorResetData]);

	const handleResetAccount = async () => {
		resetData();
	};

	return (
		<div className={clsx("w-full flex flex-col gap-4 lg:col-span-10 col-span-12")}>
			{/* General Settings Card */}
			<Card>
				<CardHeader className="flex gap-3">
					<div className="flex flex-col">
						<p className="text-md font-semibold">General Settings</p>
						<p className="text-small text-default-500">Manage your account preferences</p>
					</div>
				</CardHeader>
				<CardBody>
					<p className="text-default-600">General settings options will be available here.</p>
				</CardBody>
			</Card>

			{/* Reset Account Data Card */}
			<Alert
				classNames={{
					mainWrapper: "gap-2",
					title: "text-lg font-medium",
				}}
				color="danger"
				description={
					"This action will permanently delete all your account data including transactions, cards, categories, and forecasts. This action cannot be undone."
				}
				title={"Reset Account Data"}

			>
				<Button
					color={"danger"}
					fullWidth={false}
					startContent={ICONS.TRASH.MD}
					onPress={onOpen}
				>
					Reset Account Data
				</Button>
			</Alert>

			{/* Confirmation Modal */}
			<Modal
				backdrop="blur"
				isOpen={isOpen}
				size="lg"
				onOpenChange={onOpenChange}
			>
				<ModalContent>
					{(onClose) => (
						<>
							<ModalHeader className="flex flex-col gap-1">
								<div className="flex items-center gap-2 text-danger">
									{ICONS.ALERT_CIRCLE.LG}
									<span>Confirm Account Data Reset</span>
								</div>
							</ModalHeader>
							<ModalBody>
								<div className="space-y-4">
									<p className="text-foreground-600">
										<strong>Warning:</strong> This action will permanently delete all of your
										account data. This cannot be undone.
									</p>

									<div className="bg-danger-50 border border-danger-200 rounded-lg p-4">
										<h4 className="font-semibold text-danger-700 mb-2">
											The following data will be permanently deleted:
										</h4>
										<ul className="space-y-1 text-danger-600">
											<li className="flex items-center gap-2">
												<span className="w-1 h-1 bg-danger-600 rounded-full" />
												All transactions
											</li>
											<li className="flex items-center gap-2">
												<span className="w-1 h-1 bg-danger-600 rounded-full" />
												All cards and their associated data
											</li>
											<li className="flex items-center gap-2">
												<span className="w-1 h-1 bg-danger-600 rounded-full" />
												All transaction categories
											</li>
											<li className="flex items-center gap-2">
												<span className="w-1 h-1 bg-danger-600 rounded-full" />
												All forecasts and forecast details
											</li>
										</ul>
									</div>

									<p className="text-foreground-700 font-medium">
										Are you absolutely sure you want to proceed?
									</p>
								</div>
							</ModalBody>
							<ModalFooter>
								<Button
									color="default"
									isDisabled={resettingData}
									variant="light"
									onPress={onClose}
								>
									Cancel
								</Button>
								<Button
									color="danger"
									isLoading={resettingData}
									startContent={!resettingData ? ICONS.TRASH.MD : undefined}
									onPress={handleResetAccount}
								>
									{resettingData ? (
										<>
											<Spinner
												color="current"
												size="sm"
											/>
											Resetting...
										</>
									) : (
										"Yes, Reset All Data"
									)}
								</Button>
							</ModalFooter>
						</>
					)}
				</ModalContent>
			</Modal>
		</div>
	);
}
