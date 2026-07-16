const TIMEZONE = "America/Sao_Paulo";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const dateTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
  timeZone: TIMEZONE,
  dateStyle: "short",
  timeStyle: "short",
});

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  timeZone: TIMEZONE,
  dateStyle: "short",
});

const timeFormatter = new Intl.DateTimeFormat("pt-BR", {
  timeZone: TIMEZONE,
  timeStyle: "short",
});

/**
 * Valores monetários são armazenados como numeric(12,2) no Postgres (reais,
 * não centavos) — o driver retorna string para não perder precisão.
 */
export function formatCurrency(value: number | string): string {
  return currencyFormatter.format(typeof value === "string" ? Number(value) : value);
}

export function formatDateTime(date: Date | string): string {
  return dateTimeFormatter.format(new Date(date));
}

export function formatDate(date: Date | string): string {
  return dateFormatter.format(new Date(date));
}

export function formatTime(date: Date | string): string {
  return timeFormatter.format(new Date(date));
}

export { TIMEZONE };
