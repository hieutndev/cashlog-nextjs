"use client";

import { useState, useCallback } from "react";
import { Divider } from "@heroui/divider";
import { Button } from "@heroui/button";
import { useRouter } from "next/navigation";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";

import UploadFileStep from "@/components/transactions/import-from-xlsx/steps-wizard/upload-file-step";
import { TImportFileXLSXResponse } from "@/types/transaction";
import CompareData from "@/components/transactions/import-from-xlsx/steps-wizard/compare-data";
import PreviewData from "@/components/transactions/import-from-xlsx/steps-wizard/preview-data";
import Container from "@/components/shared/container/container";
import Stepper, { Step } from "@/components/transactions/import-from-xlsx/steps-wizard/stepper";
import ICONS from "@/configs/icons";
import useScreenSize from "@/hooks/useScreenSize";

export default function ImportTransactionsPage() {
	const router = useRouter();

	const [currentStep, setCurrentStep] = useState<number>(1);
	const [uploadFileResult, setUploadFileResult] = useState<TImportFileXLSXResponse | null>(null);

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

	const {width} = useScreenSize();


	return (
		<Container
			gapSize={8}
			orientation={"vertical"}
		>
			<Stepper isDot={width < 640}
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
					onSubmitSuccess={() => handleUpdateStep("next")}
					// uploadResult={TEST_SAMPLE}
				/>
			)}
			{currentStep === 4 && (
				<Container className={"justify-center items-center"}>
					<div
						className={"w-full flex flex-col items-center gap-8 max-w-2xl p-8 border shadow-lg rounded-2xl"}
					>
						<DotLottieReact
							autoplay
							loop
							className={"w-full max-w-52 mx-auto"}
							src={"https://lottie.host/39a9ca9b-d612-43f9-aca5-5554b16dcb2e/eEfIFxK8kF.lottie"}
						/>

						<div className={"w-full flex flex-col gap-4 justify-center items-center"}>
							<h2 className={"text-2xl font-semibold text-primary"}>Import successful!</h2>
							<div className={"flex flex-col items-center gap-1"}>
								<p className={"w-full text-default-500 text-wrap text-center"}>
								All your <b className={"text-primary"}>{uploadFileResult?.mapped_column_data?.amount?.length ?? 0}</b> transactions have been imported successfully.
								</p>
							</div>
							<div className={"flex items-center gap-4"}>
								<Button
									color={"primary"}
									endContent={ICONS.NEXT.LG}
									size={"lg"}
									onPress={() => router.push("/transactions")}
								>
									Go to Transactions
								</Button>
							</div>
						</div>
					</div>
				</Container>
			)}
		</Container>
	);
}
