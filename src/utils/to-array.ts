export const toArray = <T>(value: T | T[]): NonNullable<T>[] => {
  if (value == null) {
    // null or undefined
    return []
  }

  return Array.isArray(value)
    ? (value as NonNullable<T>[])
    : [value as NonNullable<T>]
}
