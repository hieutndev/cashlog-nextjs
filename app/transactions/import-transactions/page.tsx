"use client";

import { useState, useCallback } from "react";
import { Divider } from "@heroui/divider";

import UploadFileStep from "@/components/transactions/import-from-xlsx/steps-wizard/upload-file-step";
import { TImportFileXLSXResponse } from "@/types/transaction";
import CompareData from "@/components/transactions/import-from-xlsx/steps-wizard/compare-data";
import PreviewData from "@/components/transactions/import-from-xlsx/steps-wizard/preview-data";
import Container from "@/components/shared/container/container";
import Stepper, { Step } from "@/components/transactions/import-from-xlsx/steps-wizard/stepper";

export default function ImportTransactionsPage() {
	const [currentStep, setCurrentStep] = useState<number>(1);
	const [uploadFileResult, setUploadFileResult] = useState<TImportFileXLSXResponse | null>(null);

	const handleUpdateStep = useCallback(
		(type: "next" | "back" = "next", times: number = 1) => {
			const nextStep = type === "next" ? currentStep + times : currentStep - times;

			setCurrentStep(nextStep);

			setListSteps((prevSteps) =>
				prevSteps.map((step) => {
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
				})
			);
		},
		[currentStep]
	);

	const handleUploadResult = useCallback((result: TImportFileXLSXResponse) => {
		setUploadFileResult(result);
	}, []);

	const [listSteps, setListSteps] = useState<Step[]>([
		{
			id: 1,
			title: "Upload File",
			description: "Upload your .XLSX or .XLS file to start",
			status: "current",
		},
		{
			id: 2,
			title: "Compare Data",
			description: "Compare and validate your data",
			status: "pending",
		},
		{
			id: 3,
			title: "Preview & Submit",
			description: "Review and submit your changes",
			status: "pending",
		},
		{
			id: 4,
			title: "Complete",
			description: "Your transactions have been imported successfully",
			status: "pending",
		},
	]);

	return (
		<Container
			gapSize={8}
			orientation={"vertical"}
		>
			<Stepper
				steps={listSteps}
			/>
			<Divider />
			{currentStep === 1 && (
				<UploadFileStep
					onUploadResult={handleUploadResult}
					onUploadSuccess={handleUpdateStep}
				/>
			)}
			{currentStep === 2 && (
				<CompareData
					uploadResult={uploadFileResult!}
					// uploadResult={TEST_SAMPLE}
					onCompareSuccess={handleUpdateStep}
				/>
			)}
			{currentStep === 3 && (
				<PreviewData
					uploadResult={uploadFileResult!}
					onCancelImport={() => handleUpdateStep("back", 2)}
					// uploadResult={TEST_SAMPLE}
				/>
			)}
		</Container>
	);
}
