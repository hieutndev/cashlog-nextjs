import { TBankCode } from "@/types/bank";

const basePath = "images/bank_logo";

export const getBankOptions: { key: TBankCode; value: string }[] = [
  {
    key: "MBB",
    value: "MB Bank"
  },
  {
    key: "MOMO",
    value: "Momo"
  },
  {
    key: "SHOPEEPAY",
    value: "Shopee Pay"
  },
  {
    key: "TECHCOMBANK",
    value: "Techcombank"
  },
  {
    key: "TPBANK",
    value: "TP Bank"
  },
  {
    key: "VIETCOMBANK",
    value: "Vietcombank"
  },
  {
    key: "VPBANK",
    value: "VP Bank"
  },
  {
    key: "ZALOPAY",
    value: "Zalopay"
  },
  {
    key: "LIOBANK",
    value: "Liobank"
  },
  {
    key: "CASH",
    value: "Cash"
  }
];

export function getBankLogo(bankCode: TBankCode, variant: number): string {
  const MAP_BANK_FOLDER: Record<TBankCode, string> = {
    MBB: "mbb",
    MOMO: "momo",
    SHOPEEPAY: "shopeepay",
    TECHCOMBANK: "techcombank",
    TPBANK: "tpbank",
    VIETCOMBANK: "vietcombank",
    VPBANK: "vpbank",
    ZALOPAY: "zalopay",
    LIOBANK: "liobank",
    CASH: "cash"
  };

  if (!(bankCode in MAP_BANK_FOLDER)) {
    return "/logow_b.png"; // fallback logo
  }

  return `/${basePath}/${MAP_BANK_FOLDER[bankCode]}/${variant}.png`;
}
