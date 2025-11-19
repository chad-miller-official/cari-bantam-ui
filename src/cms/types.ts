export type RedirectResponse = {
  location?: string,
  error?: string,
}

export type ValidationException = {
  fieldName: string,
  readableFieldName: string,
  message: string,
}