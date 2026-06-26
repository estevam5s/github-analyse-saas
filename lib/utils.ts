import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const brl = (cents: number) =>
  (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0 });

export const fmtInt = (n: number) => Number(n || 0).toLocaleString("pt-BR");

export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "GitAnalytica";
