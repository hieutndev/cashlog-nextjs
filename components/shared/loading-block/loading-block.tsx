import { Card, CardBody } from "@heroui/card";
import { Spinner } from "@heroui/spinner";
import clsx from "clsx";

interface LoadingBlockProps {
    className?: string;
    type?: "default" | "card"
}

export default function LoadingBlock({ className, type = "default" }: LoadingBlockProps) {
    if (type === "card") {
        return <Card>
            <CardBody className={clsx("w-full min-h-96 flex justify-center p-8", className)}>
                <Spinner size={"lg"}>Loading...</Spinner>
            </CardBody>
        </Card>
    }

    return <div className={clsx("w-full min-h-96 flex justify-center p-8", className)}>
        <Spinner size={"lg"}>Loading...</Spinner>
    </div>
}