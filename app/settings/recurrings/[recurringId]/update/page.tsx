"use client";

import type { IAPIResponse } from "@/types/global";
import type { TRecurringResponse } from "@/types/recurring";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "@heroui/spinner";
import { useFetch } from "hieutndev-toolkit";

import RecurringForm from "../../_components/recurring-form";

import ICONS from "@/configs/icons";
import SectionHeader from "@/components/shared/partials/section-header";
import LoadingBlock from "@/components/shared/loading-block/loading-block";

interface UpdateRecurringPageProps {
	params: Promise<{ recurringId: string }>;
}

export default function UpdateRecurringPage({ params }: UpdateRecurringPageProps) {
	const router = useRouter();
	const [recurringId, setRecurringId] = useState<string>("");
	const [recurringDetails, setRecurringDetails] = useState<TRecurringResponse | null>(null);

	useEffect(() => {
		params.then((p) => setRecurringId(p.recurringId));
	}, [params]);

	const {
		data: fetchRecurringResult,
		loading: loadingRecurring,
	} = useFetch<IAPIResponse<TRecurringResponse>>(`/recurrings/${recurringId}`, {
		method: "GET",
		skip: !recurringId,
	});

	useEffect(() => {
		if (fetchRecurringResult && fetchRecurringResult.results) {
			setRecurringDetails(fetchRecurringResult.results);
		}
	}, [fetchRecurringResult]);

	const handleSuccess = () => {
		router.push(`/settings/recurrings/${recurringId}`);
	};

	if (!recurringDetails) {
		// return (
		// 	router.push("/settings/recurrings")
		// );
	}

	return (
		<div className="col-span-12 lg:col-span-10 w-full flex flex-col gap-4">
			<SectionHeader customButton={{
				size: "md",
				variant: "light",
				color: "primary",
				startContent: ICONS.BACK.MD,
				href: `/settings/recurrings/${recurringId}`,
				children: "Back",
			}}
				title={"Update Recurring Transaction"}
			/>
			{loadingRecurring
				? <LoadingBlock />
				: <RecurringForm
					initialData={recurringDetails}
					mode="update"
					recurringId={recurringId}
					onSuccess={handleSuccess}
				/>
			}
		</div>
	);
}