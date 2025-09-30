import { Metadata } from "next";
import { Divider } from "@heroui/divider";

import Container from "@/components/shared/container/container";
import ContentHeader, { BreadcrumbsType } from "@/components/shared/partials/content-header";

export const metadata: Metadata = {
    title: "Recurring",
};

export default function RecurringLayout({ children }: { children: React.ReactNode }) {
    const recurringBreadcrumbs: BreadcrumbsType[] = [
        {
            label: ["Recurring"],
            key: "^/recurring",
        },
    ];

    return (
        <Container
            shadow
            className={"bg-white border border-gray-200 rounded-xl"}
            orientation={"vertical"}
        >
            <ContentHeader
                breadcrumbs={recurringBreadcrumbs}
                title={"Recurring"}
            />
            <Divider />
            {children}
        </Container>
    );
}
