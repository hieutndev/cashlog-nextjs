import { Spinner } from "@heroui/spinner";
import clsx from "clsx";

export default function RetrievingBlock() {
    return <div className={clsx("w-full min-h-96 flex justify-center p-8")}>
        <Spinner size={"lg"}>Retrieving...</Spinner>
    </div>
}