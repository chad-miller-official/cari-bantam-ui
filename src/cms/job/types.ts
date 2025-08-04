export type JobError = {
  code: number,
  message: string,
}

export type JobLog = {
  formattedMessage: string,
  jobExecutionLog: number,
  logLevel: number,
}

export type JobHistoryResponse = {
  logs: JobLog[],
  outputFileUrl?: string,
}

export type JobDataRequestResponse = {
  jobExecution: number,
  jobExecutionStatus: number,
  last: boolean,
  logs: JobLog[],
  outputFileUrl?: string,
  percentComplete: number,
  status: string,
}

export type JobResponse = {
  error?: JobError,
  jobExecution: number,
  started: string,
  status: number,
}