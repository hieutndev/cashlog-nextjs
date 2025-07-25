import { useEffect, useState, useRef } from "react";
import { Divider } from "@heroui/divider";
import { LuFileSpreadsheet } from "react-icons/lu";
import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@heroui/table";
import { Chip } from "@heroui/chip";
import { Alert } from "@heroui/alert";

import FileUpload from "../../../shared/file-upload/file-upload";

import Container from "@/components/shared/container/container";
import { useFetch } from "@/hooks/useFetch";
import { IAPIResponse } from "@/types/global";
import { TImportFileXLSXResponse } from "@/types/transaction";
import useScreenSize from "@/hooks/useScreenSize";
import { BREAK_POINT } from "@/configs/break-point";

export default function UploadFileStep({
	onUploadSuccess,
	onUploadResult,
}: {
	className?: string;
	onUploadSuccess?: () => void;
	onUploadResult?: (result: TImportFileXLSXResponse) => void;
}) {
	const { width } = useScreenSize();
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [currentUploadProgress, setCurrentUploadProgress] = useState<number | null>(null);
	const [alertMessage, setAlertMessage] = useState<string | null>(null);
	const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

	/* Handle Upload File XLSX */
	const {
		data: uploadFileResult,
		error: uploadFileError,
		loading: uploadFileLoading,
		fetch: uploadFile,
	} = useFetch<IAPIResponse<TImportFileXLSXResponse>>("/transactions/import-from-xlsx", {
		method: "POST",
		skip: true,
		options: {
			removeContentType: true,
		},
	});

	useEffect(() => {
		if (selectedFile) {
			const formData = new FormData();

			// Reset progress and set initial value
			setCurrentUploadProgress(10);

			formData.append("file", selectedFile);
			uploadFile({
				body: formData,
			});
			setSelectedFile(null);
		}
	}, [selectedFile, uploadFile]);

	// Track loading state for better progress indication
	useEffect(() => {
		if (uploadFileLoading) {
			// Clear any existing interval
			if (progressIntervalRef.current) {
				clearInterval(progressIntervalRef.current);
			}

			// Only start progress if we don't already have 100%
			if (currentUploadProgress !== null && currentUploadProgress < 90) {
				progressIntervalRef.current = setInterval(() => {
					setCurrentUploadProgress((prev) => {
						if (prev !== null && prev < 90) {
							return prev + 10;
						}

						return prev;
					});
				}, 200);
			}
		} else {
			// Clear interval when not loading
			if (progressIntervalRef.current) {
				clearInterval(progressIntervalRef.current);
				progressIntervalRef.current = null;
			}
		}

		// Cleanup on unmount
		return () => {
			if (progressIntervalRef.current) {
				clearInterval(progressIntervalRef.current);
			}
		};
	}, [uploadFileLoading]); // Only depend on uploadFileLoading

	useEffect(() => {
		if (uploadFileResult) {
			// Reset progress to 100% when upload is successful
			console.log("🚀 ~ useEffect ~ uploadFileResult:", uploadFileResult);
			setCurrentUploadProgress(100);
			setAlertMessage(null); // Clear any previous alert messages
			// Pass the result to parent component
			if (onUploadResult && uploadFileResult.results) {
				onUploadResult(uploadFileResult.results);
			}

			// Move to next step after a short delay
			setTimeout(() => {
				if (onUploadSuccess) {
					onUploadSuccess();
				}
			}, 1000);
		}

		if (uploadFileError) {
			const parsedError = JSON.parse(uploadFileError);

			setAlertMessage(parsedError.message || "An error occurred while uploading the file.");
			setCurrentUploadProgress(null); // Reset progress on error
		}
	}, [uploadFileResult, uploadFileError, onUploadResult, onUploadSuccess]);

	const handleFileUpload = (file: File) => {
		setSelectedFile(file);
	};

	return (
		<Container
			className={"!p-0"}
			gapSize={8}
			orientation={width < BREAK_POINT.LG ? "vertical" : "horizontal"}
		>
			<div className={"lg:w-3/5 w-full flex flex-col gap-4"}>
				<FileUpload
					acceptedFileTypes={[".xlsx", ".xls"]}
					className={"!max-w-full min-h-96"}
					currentUploadProgress={currentUploadProgress}
					uploadDelay={1000}
					onUpload={handleFileUpload}
					onUploadSuccess={onUploadSuccess}
				/>
				{alertMessage && <Alert color={"danger"}>{alertMessage}</Alert>}
			</div>
			<Divider orientation={width < BREAK_POINT.LG ? "horizontal" : "vertical"} />
			<div className={"lg:w-2/5 w-full flex flex-col gap-4"}>
				<div className={"flex items-center gap-2"}>
					<LuFileSpreadsheet />
					<h2 className={"text-xl font-semibold"}>File Requirements:</h2>
				</div>
				<div className={"flex gap-2 items-center"}>
					<p className={"text-base font-semibold"}>Accept File Types:</p>
					<Chip
						color={"primary"}
						variant={"flat"}
					>
						.xlsx
					</Chip>
					<p className={"text-sm"}>or</p>
					<Chip
						color={"primary"}
						variant={"flat"}
					>
						.xls
					</Chip>
				</div>
				<div className={"flex flex-col gap-2"}>
					<p className={"text-base font-semibold"}>Required Columns:</p>
					<Table removeWrapper>
						<TableHeader>
							<TableColumn className={"w-2/5"}>Column Name</TableColumn>
							<TableColumn className={"w-3/5"}>Type</TableColumn>
						</TableHeader>
						<TableBody>
							{/* "date", "direction", "description", "amount", "category_name", "card_name" */}
							<TableRow>
								<TableCell>`date`</TableCell>
								<TableCell>
									<Chip
										color={"primary"}
										variant={"flat"}
									>
										Date
									</Chip>
								</TableCell>
							</TableRow>
							<TableRow>
								<TableCell>`direction`</TableCell>
								<TableCell>
									<Chip
										color={"primary"}
										variant={"flat"}
									>
										&quot;in&quot; | &quot;out&quot;
									</Chip>
								</TableCell>
							</TableRow>
							<TableRow>
								<TableCell>`description`</TableCell>
								<TableCell>
									<Chip
										color={"primary"}
										variant={"flat"}
									>
										String
									</Chip>
								</TableCell>
							</TableRow>
							<TableRow>
								<TableCell>`amount`</TableCell>
								<TableCell>
									<Chip
										color={"primary"}
										variant={"flat"}
									>
										Number
									</Chip>
								</TableCell>
							</TableRow>
							<TableRow>
								<TableCell>`category_name`</TableCell>
								<TableCell>
									<Chip
										color={"primary"}
										variant={"flat"}
									>
										String
									</Chip>
								</TableCell>
							</TableRow>
							<TableRow>
								<TableCell>`card_name`</TableCell>
								<TableCell>
									<Chip
										color={"primary"}
										variant={"flat"}
									>
										String
									</Chip>
								</TableCell>
							</TableRow>
						</TableBody>
					</Table>
				</div>
			</div>
		</Container>
	);
}
