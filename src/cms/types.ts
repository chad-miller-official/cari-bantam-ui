export type RedirectResponse = {
  redirectTo: string,
}

export type ValidationException = {
  fieldName: string,
  readableFieldName: string,
  message: string,
}