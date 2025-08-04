import {JobLog} from "./types";

export type LogAppend = {
  logs: JobLog[],
  reset: boolean,
}

export type JobExecutionCreation = {
  jobExecution: number,
  started: string,
}

export type JobExecutionStatusChange = {
  status: string,
}

export type JobExecutionSelection = {
  jobExecution: number,
  outputFileUrl: string,
}