export type ProviderErrorCategory =
  | "NOT_FOUND"
  | "RATE_LIMIT"
  | "SCHEMA_CHANGED"
  | "TRANSIENT_NETWORK"
  | "PROVIDER_UNAVAILABLE"
  | "INVALID_INPUT";

export class ProviderError extends Error {
  constructor(
    message: string,
    readonly category: ProviderErrorCategory,
    readonly retryable: boolean,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "ProviderError";
  }
}
