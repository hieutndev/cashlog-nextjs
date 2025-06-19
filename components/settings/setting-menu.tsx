"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@heroui/button";

import { SETTING_MENU } from "@/config/site";

export default function SettingMenu() {
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (urls: string[]) => {
    return urls.some((pattern) => {
      try {

        const regex = new RegExp(pattern.endsWith("$") ? pattern : `${pattern}$`);

        return regex.test(pathname);
      } catch {
        return false;
      }
    });
  };

  return (
    <div className="col-span-2 flex flex-col gap-4 pr-4 border-r border-gray-200">
      {SETTING_MENU.map((button) => (
        <Button
          key={button.key}
          fullWidth
          className="justify-start"
          color={isActive(button.urls) ? "primary" : "default"}
          size="lg"
          startContent={button.icon}
          variant="light"
          onPress={() => router.push(button.key)}
        >
          {button.label[button.label.length - 1]}
        </Button>
      ))}
    </div>
  );
}
