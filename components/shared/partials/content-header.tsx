"use client";

import { BreadcrumbItem, Breadcrumbs } from "@heroui/breadcrumbs";
import { Button, ButtonProps } from "@heroui/button";
import { usePathname, useRouter } from "next/navigation";

export type BreadcrumbsType = {
  label: string[];
  key: string;
  customButton?: (ButtonProps & { href: string })[];
};

interface ContentHeaderProps {
  title?: string;
  breadcrumbs?: BreadcrumbsType[];
}

export default function ContentHeader({
                                        title,
                                        breadcrumbs
                                      }: ContentHeaderProps) {
  const pathname = usePathname();

  const router = useRouter();

  // const parseBreadcrumbs = breadcrumbs?.find((_v) => _v.key === pathname);
  const parseBreadcrumbs = breadcrumbs?.find((_v) => {
    try {
      const regex = new RegExp(_v.key.endsWith("$") ? _v.key : `${_v.key}$`); // assume _v.key is a regex pattern string

      return regex.test(pathname);
    } catch {
      return false; // in case _v.key is an invalid regex
    }
  });

  return (
    <div className="flex flex-col gap-2">
      <div className={"w-full flex justify-between items-center gap-4"}>
        <h1 className="text-3xl font-bold">{title}</h1>
        <div className={"flex gap-2"}>
          {parseBreadcrumbs?.customButton &&
            parseBreadcrumbs?.customButton.map((button, index) => (
              <Button
                key={index}
                {...button}
                onPress={() => {
                  button?.href && router.push(button.href);
                }}
              />
            ))}
        </div>
      </div>
      {parseBreadcrumbs && (
        <Breadcrumbs key={parseBreadcrumbs.key} size={"lg"}>
          {parseBreadcrumbs.label.map((label, index) => (
            <BreadcrumbItem key={index}>{label}</BreadcrumbItem>
          ))}
        </Breadcrumbs>
      )}
    </div>
  );
}
