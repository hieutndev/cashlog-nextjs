"use client";

import { useState, useRef, useCallback, type DragEvent, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { LuCloudUpload } from "react-icons/lu";
import clsx from "clsx";

import { UploadingAnimation } from "./uploading-animation";
import { UploadIllustration } from "./upload-illustration";

type FileStatus = "idle" | "dragging" | "uploading" | "error";

interface FileError {
	message: string;
	code: string;
}

interface FileUploadProps {
	onUpload?: (file: File) => void;
	onUploadSuccess?: () => void;
	onUploadError?: (error: FileError) => void;
	acceptedFileTypes?: string[];
	maxFileSize?: number;
	onFileRemove?: () => void;
	/** Duration in milliseconds for the upload simulation. Defaults to 2000ms (2s), 0 for no simulation */
	uploadDelay?: number;
	validateFile?: (file: File) => FileError | null;

	currentUploadProgress?: number | null;
	className?: string;
}

const DEFAULT_MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const FILE_SIZES = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"] as const;

const formatBytes = (bytes: number, decimals = 2): string => {
	if (!+bytes) return "0 Bytes";
	const k = 1024;
	const dm = decimals < 0 ? 0 : decimals;
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	const unit = FILE_SIZES[i] || FILE_SIZES[FILE_SIZES.length - 1];

	return `${Number.parseFloat((bytes / k ** i).toFixed(dm))} ${unit}`;
};

export default function FileUpload({
	onUpload = () => {},
	onUploadSuccess = () => {},
	onUploadError = () => {},
	acceptedFileTypes = [],
	maxFileSize = DEFAULT_MAX_FILE_SIZE,
	onFileRemove = () => {},
	uploadDelay = 2000,
	validateFile = () => null,
	currentUploadProgress = null,
	className,
}: FileUploadProps) {
	const [file, setFile] = useState<File | null>(null);
	const [status, setStatus] = useState<FileStatus>("idle");
	const [progress, setProgress] = useState(0);
	const [error, setError] = useState<FileError | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const uploadIntervalRef = useRef<NodeJS.Timeout | null>(null);

	useEffect(() => {
		return () => {
			if (uploadIntervalRef.current) {
				clearInterval(uploadIntervalRef.current);
			}
		};
	}, []);

	const validateFileSize = useCallback(
		(file: File): FileError | null => {
			if (file.size > maxFileSize) {
				return {
					message: `File size exceeds ${formatBytes(maxFileSize)}`,
					code: "FILE_TOO_LARGE",
				};
			}

			return null;
		},
		[maxFileSize]
	);

	const validateFileType = useCallback(
		(file: File): FileError | null => {
			if (!acceptedFileTypes?.length) return null;

			const fileType = file.type.toLowerCase();
			const fileName = file.name.toLowerCase();
			const fileExtension = fileName.substring(fileName.lastIndexOf("."));

			// Check if file matches any accepted type (MIME type or extension)
			const isValidType = acceptedFileTypes.some((type) => {
				const normalizedType = type.toLowerCase();

				// Check MIME type match
				if (fileType && fileType.match(normalizedType)) {
					return true;
				}

				// Check file extension match (for types like .xlsx, .xls, .pdf, etc.)
				if (normalizedType.startsWith(".")) {
					return fileExtension === normalizedType;
				}

				// Check if the accepted type is a file extension without dot
				if (!normalizedType.includes("/") && !normalizedType.startsWith(".")) {
					return fileExtension === `.${normalizedType}`;
				}

				return false;
			});

			if (!isValidType) {
				return {
					message: `File type must be ${acceptedFileTypes.join(", ")}`,
					code: "INVALID_FILE_TYPE",
				};
			}

			return null;
		},
		[acceptedFileTypes]
	);

	const handleError = useCallback(
		(error: FileError) => {
			setError(error);
			setStatus("error");
			onUploadError?.(error);

			setTimeout(() => {
				setError(null);
				setStatus("idle");
			}, 3000);
		},
		[onUploadError]
	);
	const simulateUpload = useCallback(
		(uploadingFile: File) => {
			setTimeout(() => {
				onUpload?.(uploadingFile);
			}, uploadDelay);
		},
		[onUpload, uploadDelay]
	);

	useEffect(() => {
		console.log("🚀 ~ FileUpload useEffect ~ currentUploadProgress:", currentUploadProgress);
		if (currentUploadProgress !== null) {
			setProgress(currentUploadProgress);
			if (currentUploadProgress >= 100) {
				setTimeout(() => {
					setStatus("idle");

					onUploadSuccess?.();
				}, 1000);
			} else if (currentUploadProgress > 0) {
				setStatus("uploading");
			}
		} else {
			setStatus("idle");
			setProgress(0);
		}
	}, [currentUploadProgress, onUploadSuccess]);

	const handleFileSelect = useCallback(
		(selectedFile: File | null) => {
			if (!selectedFile) return;

			// Reset error state
			setError(null);

			// Validate file
			const sizeError = validateFileSize(selectedFile);

			if (sizeError) {
				handleError(sizeError);

				return;
			}

			const typeError = validateFileType(selectedFile);

			if (typeError) {
				handleError(typeError);

				return;
			}

			const customError = validateFile?.(selectedFile);

			if (customError) {
				handleError(customError);

				return;
			}

			setFile(selectedFile);
			setStatus("uploading");
			setProgress(0);
			simulateUpload(selectedFile);
		},
		[simulateUpload, validateFileSize, validateFileType, validateFile, handleError]
	);

	const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		e.stopPropagation();
		setStatus((prev) => (prev !== "uploading" ? "dragging" : prev));
	}, []);

	const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		e.stopPropagation();
		setStatus((prev) => (prev === "dragging" ? "idle" : prev));
	}, []);

	const handleDrop = useCallback(
		(e: DragEvent<HTMLDivElement>) => {
			e.preventDefault();
			e.stopPropagation();
			if (status === "uploading") return;
			setStatus("idle");
			const droppedFile = e.dataTransfer.files?.[0];

			if (droppedFile) handleFileSelect(droppedFile);
		},
		[status, handleFileSelect]
	);

	const handleFileInputChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const selectedFile = e.target.files?.[0];

			handleFileSelect(selectedFile || null);
			if (e.target) e.target.value = "";
		},
		[handleFileSelect]
	);

	const triggerFileInput = useCallback(() => {
		if (status === "uploading") return;
		fileInputRef.current?.click();
	}, [status]);

	const resetState = useCallback(() => {
		setFile(null);
		setStatus("idle");
		setProgress(0);
		if (onFileRemove) onFileRemove();
	}, [onFileRemove]);

	return (
		<div
			aria-label="File upload"
			className={clsx("relative w-full max-w-sm mx-auto", className)}
			role="complementary"
		>
			<div className="group relative w-full h-full rounded-xl bg-white dark:bg-black ring-1 ring-gray-200 dark:ring-white/10 p-0.5">
				<div className="absolute inset-x-0 -top-px h-px w-full bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />

				<div className="relative w-full rounded-[10px] bg-gray-50/50 dark:bg-white/[0.02] p-1.5">
					<div
						className={clsx(
							"relative mx-auto w-full overflow-hidden rounded-lg border border-gray-100 dark:border-white/[0.08] bg-white dark:bg-black/50"
							// {
							// 	"border-red-500/50": error,
							// }
						)}
					>
						<div
							className={clsx("absolute inset-0 transition-opacity duration-300", {
								"opacity-100": status === "dragging",
								"opacity-0": status !== "dragging",
							})}
						>
							<div className="absolute inset-x-0 top-0 h-[20%] bg-gradient-to-b from-blue-500/10 to-transparent" />
							<div className="absolute inset-x-0 bottom-0 h-[20%] bg-gradient-to-t from-blue-500/10 to-transparent" />
							<div className="absolute inset-y-0 left-0 w-[20%] bg-gradient-to-r from-blue-500/10 to-transparent" />
							<div className="absolute inset-y-0 right-0 w-[20%] bg-gradient-to-l from-blue-500/10 to-transparent" />
							<div className="absolute inset-[20%] bg-blue-500/5 rounded-lg transition-all duration-300 animate-pulse" />
						</div>

						<div className="absolute -right-4 -top-4 h-8 w-8 bg-gradient-to-br from-blue-500/20 to-transparent blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

						<div className="relative h-96">
							<AnimatePresence mode="wait">
								{status === "idle" || status === "dragging" ? (
									<motion.div
										key="dropzone"
										animate={{
											opacity: status === "dragging" ? 0.8 : 1,
											y: 0,
											scale: status === "dragging" ? 0.98 : 1,
										}}
										className="absolute inset-0 flex flex-col items-center justify-center p-6"
										exit={{ opacity: 0, y: -10 }}
										initial={{ opacity: 0, y: 10 }}
										transition={{ duration: 0.2 }}
										onDragLeave={handleDragLeave}
										onDragOver={handleDragOver}
										onDrop={handleDrop}
									>
										<div className="mb-4">
											<UploadIllustration />
										</div>

										<div className="text-center space-y-1.5 mb-4">
											<h3 className="text-lg font-semibold text-gray-900 dark:text-white tracking-tight">
												Drag and drop or
											</h3>{" "}
											<p className="text-xs text-gray-500 dark:text-gray-400">
												{acceptedFileTypes?.length
													? acceptedFileTypes
															.map((type) => {
																// Handle file extensions (.xlsx, .xls, etc.)
																if (type.startsWith(".")) {
																	return type.toUpperCase();
																}

																// Handle MIME types (image/png -> PNG)
																if (type.includes("/")) {
																	return type.split("/")[1].toUpperCase();
																}

																// Handle plain extensions (xlsx -> XLSX)
																return type.toUpperCase();
															})
															.join(", ")
													: "SVG, PNG, JPG or GIF"}{" "}
												{maxFileSize && `up to ${formatBytes(maxFileSize)}`}
											</p>
										</div>

										<button
											className="w-4/5 flex items-center justify-center gap-2 rounded-lg bg-gray-100 dark:bg-white/10 px-4 py-2.5 text-sm font-semibold text-gray-900 dark:text-white transition-all duration-200 hover:bg-gray-200 dark:hover:bg-white/20 group"
											type="button"
											onClick={triggerFileInput}
										>
											<span>Upload File</span>
											<LuCloudUpload className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
										</button>

										<p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
											or drag and drop your file here
										</p>

										<input
											ref={fileInputRef}
											accept={acceptedFileTypes?.join(",")}
											aria-label="File input"
											className="sr-only"
											type="file"
											onChange={handleFileInputChange}
										/>
									</motion.div>
								) : status === "uploading" ? (
									<motion.div
										key="uploading"
										animate={{ opacity: 1, scale: 1 }}
										className="absolute inset-0 flex flex-col items-center justify-center p-6"
										exit={{ opacity: 0, scale: 0.95 }}
										initial={{ opacity: 0, scale: 0.95 }}
									>
										<div className="mb-4">
											<UploadingAnimation progress={progress} />
										</div>

										<div className="text-center space-y-1.5 mb-4">
											<h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
												{file?.name}
											</h3>
											<div className="flex items-center justify-center gap-2 text-xs">
												<span className="text-gray-500 dark:text-gray-400">
													{formatBytes(file?.size || 0)}
												</span>
												<span className="font-medium text-blue-500">
													{Math.round(progress)}%
												</span>
											</div>
										</div>

										<button
											className="w-4/5 flex items-center justify-center gap-2 rounded-lg bg-gray-100 dark:bg-white/10 px-4 py-2.5 text-sm font-semibold text-gray-900 dark:text-white transition-all duration-200 hover:bg-gray-200 dark:hover:bg-white/20"
											type="button"
											onClick={resetState}
										>
											Cancel
										</button>
									</motion.div>
								) : null}
							</AnimatePresence>
						</div>

						<AnimatePresence>
							{error && (
								<motion.div
									animate={{ opacity: 1, y: 0 }}
									className="w-full h-full absolute top-0 left-0 transform flex justify-center items-center"
									exit={{ opacity: 0, y: -10 }}
									initial={{ opacity: 0, y: 10 }}
								>
									<div className={"bg-red-500/10 border border-red-500/20 rounded-lg p-2"}>
										<p className="text-sm text-red-500 dark:text-red-400">{error.message}</p>
									</div>
								</motion.div>
							)}
						</AnimatePresence>
					</div>
				</div>
			</div>
		</div>
	);
}
