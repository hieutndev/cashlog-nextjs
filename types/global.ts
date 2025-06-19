import { ErrorObject } from "ajv";

export type TSizeBase =
  | "sm"
  | "md"
  | "lg"
  | "xl"
  | "2xl"
  | "3xl"
  | "4xl"
  | "5xl"
  | "6xl"
  | "7xl"
  | "8xl"
  | "9xl"
  | "10xl";

export type TRadiusSize = Extract<TSizeBase, "sm" | "md" | "lg" | "xl" | "2xl">;

export type TColor =
  | "red"
  | "orange"
  | "amber"
  | "yellow"
  | "lime"
  | "green"
  | "emerald"
  | "teal"
  | "cyan"
  | "sky"
  | "blue"
  | "indigo"
  | "violet"
  | "purple"
  | "fuchsia"
  | "pink"
  | "rose"
  | "slate"
  | "gray"
  | "zinc"
  | "neutral"
  | "stone";

export const ListColors: TColor[] = [
  "red",
  "orange",
  "amber",
  "yellow",
  "lime",
  "green",
  "emerald",
  "teal",
  "cyan",
  "sky",
  "blue",
  "indigo",
  "violet",
  "purple",
  "fuchsia",
  "pink",
  "rose",
  "slate",
  "gray",
  "zinc",
  "neutral",
  "stone"
];

export interface IAPIResponse<TResponse = any, TError = any> {
  status: "success" | "failure" | "error";
  message: string;
  results?: TResponse;
  errors?: TError;
  validateErrors?: ErrorObject[];
}

export interface IDataTable<T> {
  columns: {
    key: keyof T;
    label: string;
  }[];
  rows: T[];
}
