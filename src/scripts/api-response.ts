type ApiResponseParser<T> = (value: unknown) => T | null;

export const MAX_API_ERROR_MESSAGE_LENGTH = 500;

function apiErrorMessage(value: unknown): string | null {
  if (
    typeof value !== "object" ||
    value === null ||
    !("error" in value) ||
    typeof value.error !== "string"
  ) {
    return null;
  }
  const message = value.error.trim();
  return message && message.length <= MAX_API_ERROR_MESSAGE_LENGTH
    ? message
    : null;
}

export async function readApiResponse<T>(
  response: Response,
  parse: ApiResponseParser<T>,
  fallbackMessage: string,
): Promise<T> {
  let value: unknown;
  try {
    value = await response.json();
  } catch {
    throw new Error(fallbackMessage);
  }

  if (!response.ok) {
    throw new Error(apiErrorMessage(value) ?? fallbackMessage);
  }

  const parsed = parse(value);
  if (parsed === null) {
    throw new Error(fallbackMessage);
  }
  return parsed;
}

export async function requestApiResponse<T>(
  request: () => Promise<Response>,
  parse: ApiResponseParser<T>,
  fallbackMessage: string,
): Promise<T> {
  let response: Response;
  try {
    response = await request();
  } catch {
    throw new Error(fallbackMessage);
  }

  return readApiResponse(response, parse, fallbackMessage);
}

export async function requestPreparedApiResponse<TInput, TResult>(
  prepare: () => TInput,
  request: (input: TInput) => Promise<Response>,
  parse: ApiResponseParser<TResult>,
  fallbackMessage: string,
): Promise<TResult> {
  const input = prepare();
  return requestApiResponse(() => request(input), parse, fallbackMessage);
}
