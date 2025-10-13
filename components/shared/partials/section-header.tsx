import { Button, ButtonProps } from "@heroui/button";
import { useRouter } from "next/navigation";

interface SectionHeaderProps {
    title: string;
    customButton?: ButtonProps & { href: string };
}

export default function SectionHeader({
    title,
    customButton,
}: SectionHeaderProps) {

    const router = useRouter();

    const { href, children, ...btnProps } = customButton || {};

    return (
        <div className={"w-full flex items-center justify-between"}>
            <h3 className={"text-2xl font-semibold"}>{title}</h3>
            {customButton && (
                <div className={"flex items-center gap-2"}>
                    <Button {...btnProps}
                        onPress={() => router.push(href!)}
                    >
                        {children}
                    </Button>

                </div>
            )}
        </div>
    );
}