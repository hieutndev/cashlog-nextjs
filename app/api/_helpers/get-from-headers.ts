export function getFromHeaders<T = string>(request: Request, key: string, defaultValue: T): T {
    return request.headers.get(key) as T ?? defaultValue;
}