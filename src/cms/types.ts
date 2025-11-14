export type RedirectResponse = {
  redirectTo: string & Location,
}

export type ValidationException = {
  fieldName: string,
  readableFieldName: string,
  message: string,
}