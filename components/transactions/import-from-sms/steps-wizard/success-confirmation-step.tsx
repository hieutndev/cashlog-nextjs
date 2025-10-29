"use client";

import { useRouter } from "next/navigation";
import { Button } from "@heroui/button";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";

import Container from "@/components/shared/container/container";
import ICONS from "@/configs/icons";

interface SuccessConfirmationStepProps {
  transactionCount: number;
  onNewImport?: () => void;
}

export default function SuccessConfirmationStep({
  transactionCount,
  onNewImport,
}: SuccessConfirmationStepProps) {
  const router = useRouter();

  return (
    <Container className={"justify-center items-center"}>
      <div className={"w-full flex flex-col items-center gap-8 max-w-2xl p-8 border shadow-lg rounded-2xl"}>
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
              All your <b className={"text-primary"}>{transactionCount}</b> transaction{transactionCount !== 1 ? "s have" : " has"} been imported successfully.
            </p>
          </div>
          <div className={"flex items-center gap-4"}>
            <Button
              color={"default"}
              variant="bordered"
              size={"lg"}
              onPress={onNewImport}
            >
              Import More
            </Button>
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
  );
}

