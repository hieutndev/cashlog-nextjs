"use client";

import { useRouter } from "next/navigation";

import RecurringForm from "../../../../components/recurrings/recurring-form";

import ICONS from "@/configs/icons";
import SectionHeader from "@/components/shared/partials/section-header";

export default function NewRecurringPage() {
	const router = useRouter();

	const handleSuccess = () => {
		router.push("/settings/recurrings");
	};

	return (
		<div className="col-span-12 lg:col-span-10 w-full flex flex-col gap-4">
			<SectionHeader
				customButton={{
					size: "md",
					variant: "light",
					color: "primary",
					startContent: ICONS.BACK.MD,
					href: "/settings/recurrings",
					children: "Back",
				}}
				title="New Recurring Transaction"
			/>
			<RecurringForm
				mode="create"
				onSuccess={handleSuccess}
			/>
		</div>
	);
}