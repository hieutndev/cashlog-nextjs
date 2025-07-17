"use client";

import { useEffect } from "react";
import { Chip } from "@heroui/chip";
import { Button } from "@heroui/button";
import { Alert } from "@heroui/alert";
import { addToast } from "@heroui/toast";
import clsx from "clsx";
import Image from "next/image";
import { Spinner } from '@heroui/spinner';

import CompareCard from "./compare-card";

import Container from "@/components/shared/container/container";
import { TImportFileXLSXResponse, TValidateCardsResponse, TValidateCategoriesResponse } from "@/types/transaction";
import { useFetch } from "@/hooks/useFetch";
import { IAPIResponse } from "@/types/global";
import ICONS from "@/configs/icons";
import { ILLUSTRATION_PATH } from "@/configs/path-config";

export interface CompareDataProps {
	uploadResult: TImportFileXLSXResponse;
	onCompareSuccess: (type?: "next" | "back") => void;
}

export const NoExistingData = ({ message }: { message: string }) => {
	return (
		<div className={"h-full p-4"}>
			<div className={"w-full h-full flex justify-center items-center italic"}>{message}</div>
		</div>
	);
};

export const RenderCompareData = ({ data, type }: { data: string[]; type: "success" | "danger" }) => {
	return (
		<div className={"h-full flex flex-wrap item-start gap-2"}>
			{data.map((item) => {
				return (
					<Chip
						key={item}
						className={clsx({ "text-success": type === "success", "text-danger": type === "danger" })}
						// className={"text-white"}
						color={type}
						variant={"flat"}
					>
						{item}
					</Chip>
				);
			})}
		</div>
	);
};

export default function CompareData({ uploadResult, onCompareSuccess }: CompareDataProps) {
	/* Validate Categories */

	const {
		data: validateCategoriesResult,
		error: validateCategoriesError,
		loading: validatingCategories,
		fetch: validateCategories,
	} = useFetch<IAPIResponse<TValidateCategoriesResponse>>("/categories/validate", {
		method: "POST",
		body: {
			category_names: uploadResult.set_data.set_categories,
		},
		skip: true,
	});

	useEffect(() => {
		if (validateCategoriesResult) {
			// Handle successful validation
		}

		if (validateCategoriesError) {
			// Handle validation error
		}
	}, [validateCategoriesResult, validateCategoriesError]);

	/* Validate Cards */

	const {
		data: validateCardsResult,
		loading: validatingCards,
		fetch: validateCards,
	} = useFetch<IAPIResponse<TValidateCardsResponse>>("/cards/validate", {
		method: "POST",
		body: {
			card_names: uploadResult.set_data.set_cards,
		},
		skip: true,
	});

	/* Validate Import */

	useEffect(() => {
		if (uploadResult.set_data.set_categories.length > 0) {
			validateCategories();
		}
		if (uploadResult.set_data.set_cards.length > 0) {
			validateCards();
		}
	}, [uploadResult]);

	/* HANDLE INITIALIZE CARDS AND CATEGORIES */

	const {
		data: initCardsResult,
		error: initCardsError,
		fetch: initCards,
	} = useFetch<IAPIResponse>("/cards/create-multiple", {
		method: "POST",
		body: {
			card_names: uploadResult.set_data.set_cards,
		},
		skip: true,
	});

	/* HANDLE INITIALIZE CATEGORIES */

	const {
		data: initCategoriesResult,
		error: initCategoriesError,
		fetch: initCategories,
	} = useFetch<IAPIResponse>("/categories/create-multiple", {
		method: "POST",
		body: {
			category_names: uploadResult.set_data.set_categories,
		},
		skip: true,
	});

	const handleInitCardsAndCategories = () => {
		if (uploadResult.set_data.set_cards.length > 0) {
			initCards();
		}
		if (uploadResult.set_data.set_categories.length > 0) {
			initCategories();
		}
	};

	useEffect(() => {
		if (initCardsResult && initCategoriesResult) {
			validateCards();
			validateCategories();
			addToast({
				title: "Initialization Successful",
				description: "Cards and Categories have been initialized successfully.",
				color: "success",
			});
		}

		if (initCardsError) {
			const parsedError = JSON.parse(initCardsError);

			if (parsedError?.message) {
				addToast({
					title: "Error",
					description: parsedError.message,
					color: "danger",
				});
			}
		}

		if (initCategoriesError) {
			const parsedError = JSON.parse(initCategoriesError);

			if (parsedError?.message) {
				addToast({
					title: "Error",
					description: parsedError.message,
					color: "danger",
				});
			}
		}
	}, [initCardsResult, initCardsError, initCategoriesResult, initCategoriesError]);

	return Array.isArray(validateCategoriesResult?.results?.missing_categories) &&
		Array.isArray(validateCardsResult?.results?.missing_cards) &&
		validateCategoriesResult.results.missing_categories.length === 0 &&
		validateCardsResult.results.missing_cards.length === 0? (
		<Container className={"justify-center items-center"}>
			<div className={"w-full flex flex-col gap-8 max-w-2xl p-8 border shadow-lg rounded-2xl"}>
				<Image
					alt={"Completed Initialization"}
					className={"w-full max-w-32 mx-auto"}
					height={300}
					src={ILLUSTRATION_PATH + "/verified.png"}
					width={300}
				/>
				<div className={"w-full flex flex-col gap-4 justify-center items-center"}>
					<h2 className={"text-2xl font-semibold text-primary"}>Good job!</h2>
					<div className={"flex flex-col items-center gap-1"}>
						<p className={"min-w-max text-default-500 text-wrap w-3/4 text-center"}>
							All categories and cards are valid.
						</p>
						<p className={"min-w-max text-default-500 text-wrap w-3/4 text-center"}>
							You can proceed to the next step now.
						</p>
					</div>
					<div className={"flex items-center gap-4"}>
						<Button
							size={"lg"}
							startContent={ICONS.BACK.LG}
							variant={"flat"}
							onPress={() => onCompareSuccess("back")}
						>
							Previous Step
						</Button>
						<Button
							color={"primary"}
							endContent={ICONS.NEXT.LG}
							size={"lg"}
							onPress={() => onCompareSuccess("next")}
						>
							Next Step
						</Button>
					</div>
				</div>
			</div>
		</Container>
	) : 
		validatingCategories || validatingCards ?  (
			<Container className={"flex flex-col items-center justify-center h-full"}>
				<Spinner>Validating...</Spinner>
			</Container>
		) : (
		<Container
			className={"!p-0"}
			orientation={"vertical"}
		>
			<CompareCard
				emptyMessage={"All categories are valid"}
				existingData={
					Array.isArray(validateCategoriesResult?.results?.exists_categories)
						? validateCategoriesResult.results.exists_categories
						: []
				}
				isLoading={validatingCategories}
				missingData={
					Array.isArray(validateCategoriesResult?.results?.missing_categories)
						? validateCategoriesResult.results.missing_categories
						: []
				}
				title={"Categories"}
			/>

			<CompareCard
				emptyMessage={"All cards are valid"}
				existingData={
					Array.isArray(validateCardsResult?.results?.exists_cards)
						? validateCardsResult.results.exists_cards
						: []
				}
				isLoading={validatingCards}
				missingData={
					Array.isArray(validateCardsResult?.results?.missing_cards)
						? validateCardsResult.results.missing_cards
						: []
				}
				title={"Cards"}
			/>

			<div className={"flex flex-col gap-4"}>
				<Alert color={"warning"}>
					Warning: Excel import will fail if any cards or categories are missing. Please initialization before
					proceeding.
				</Alert>
				<Button
					color={"primary"}
					size={"lg"}
					startContent={ICONS.GIT_PULL_REQUEST.LG}
					onPress={handleInitCardsAndCategories}
				>
					Initialize Missing Cards & Categories
				</Button>
			</div>
		</Container>
	);
}
