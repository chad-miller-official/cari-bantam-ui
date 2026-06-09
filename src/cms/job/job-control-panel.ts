import {JobHistoryEntry} from "./components/job-history";
import axios, {AxiosError, AxiosResponse} from "axios";
import {JobDataRequestResponse, JobHistoryResponse, JobLog, JobResponse} from "./types";
import {Csrf} from "../../types";
import {Client, IMessage} from "@stomp/stompjs";
import CariProgressBar from "../../components/progress-bar";
import {waitFor} from "../../util";

declare const _csrf: Csrf

let stompClient = new Client({
  brokerURL: '/cari-websocket',
  onConnect: () => {
    stompClient.subscribe('/topic/job-data', (data: IMessage) => {
      const response = JSON.parse(data.body) as JobDataRequestResponse

      if (response.last) {
        lastJobExecutionStatus = response.jobExecutionStatus
        updateJobExecutionStatus(response.status)

        $('#outputFileUrl').prop('href', response.outputFileUrl)
      }

      ($('#jobProgressBar').get(0) as CariProgressBar).percentComplete = response.percentComplete

      if (response.logs.length > 0) {
        lastJobExecutionLog = response.logs[0].jobExecutionLog
      }

      if (response.jobExecution !== selectedJobExecution) {
        return
      }

      appendLogs(response.logs, false)
    })

    pullLogs().then(() => stompClient.deactivate())
  },
  onWebSocketError: error => {
    console.error('WebSocket error', error)
  },
  onStompError: frame => {
    console.error(`Broker reported error: ${frame.headers['message']}`)
    console.error(`Additional details: ${frame.body}`)
  }
})

async function pullLogs() {
  while (lastJobExecutionStatus === 1) {
    stompClient.publish({
      destination: '/app/pull-job-data',
      body: JSON.stringify({
        jobExecution: lastJobExecution,
        lastJobExecutionLog: lastJobExecutionLog,
      })
    })

    await waitFor(1000)
  }
}

function invokeJob() {
  if (lastJobExecutionStatus === 1) {
    alert('Job is already running.')
    return
  }

  const axiosConfig = {
    withCredentials: true,
    xsrfHeaderName: _csrf.headerName,
    headers: {[_csrf.headerName]: _csrf.token},
  }

  axios.post<JobResponse>(jobEndpoint, {}, axiosConfig)
  .then((res: AxiosResponse<JobResponse>) => {
    const jobResponse = res.data
    const error = jobResponse.error

    if (error) {
      alert(error.message)
    } else {
      const jobExecution = jobResponse.jobExecution

      percentComplete = 0
      lastJobExecution = jobExecution
      lastJobExecutionLog = 0
      lastJobExecutionStatus = 1
      selectedJobExecution = jobExecution

      appendJobExecution(jobExecution, jobResponse.started)
      appendLogs([], true)

      outputFileUrl = null
      stompClient.activate()
    }
  })
  .catch((err: AxiosError) => {
    alert(`Job failed to start. Reason: ${err.message}`)
  })
}

function getPreviousJobs() {
  return $('#jobsHistory > ol').children() as JQuery<JobHistoryEntry>
}

function clearSelectedJob() {
  getPreviousJobs().each((_, child) => child.selected = false)
}

function appendLogs(logs: JobLog[], reset: boolean) {
  const newLogs = logs.map(log => {
    const logItem = document.createElement('code')

    logItem.innerText = log.formattedMessage
    logItem.hidden = !showHiddenLogs && log.logLevel === 1
    logItem.dataset.logLevel = log.logLevel.toString()
    logItem.slot = 'logs'

    return logItem
  })

  const logViewer = $('#logs')

  if (reset) {
    logViewer.children().replaceWith(newLogs)
  } else {
    logViewer.prepend(newLogs)
  }
}

function displayJobExecution(jobHistoryEntry: JobHistoryEntry) {
  if (jobHistoryEntry.selected) {
    return
  }

  clearSelectedJob()
  jobHistoryEntry.selected = true

  const jobExecution = jobHistoryEntry.jobExecution

  axios.get<JobHistoryResponse>('/api/jobs/get-job-execution-data', {params: {jobExecution}})
  .then((res: AxiosResponse<JobHistoryResponse>) => {
    selectedJobExecution = jobExecution
    outputFileUrl = res.data.outputFileUrl
    appendLogs(res.data.logs, true)
  })
}

function appendJobExecution(jobExecution: number, started: string) {
  clearSelectedJob()

  const jobStartedSlot = $('<span>')
  jobStartedSlot.prop('slot', 'jobStarted')
  jobStartedSlot.text(new Date(started).toUTCString().split(' ').slice(1, 5).join(' '))

  const jobHistoryEntry = new JobHistoryEntry()
  jobHistoryEntry.slot = 'previousJobs'
  jobHistoryEntry.selected = true
  jobHistoryEntry.jobExecution = jobExecution
  jobHistoryEntry.appendChild(jobStartedSlot.get(0))
  jobHistoryEntry.addEventListener('click', () => displayJobExecution(jobHistoryEntry))

  const jobHistory = $('#jobsHistory')
  jobHistory.prepend(jobHistoryEntry)
}

function updateJobExecutionStatus(status: string) {
  const previousJobs = getPreviousJobs()
  let jobStatus = previousJobs.find('[slot=jobStatus]')

  if (jobStatus == null) {
    jobStatus = $('<span>')
    jobStatus.prop('slot', 'jobStatus')
    previousJobs.append(jobStatus)
  }

  jobStatus.text(status)
}

function toggleDebugLogs() {
  showHiddenLogs = !showHiddenLogs

  $('#logs').children().each((_, child) => {
    const logLevel = parseInt(child.dataset.logLevel)

    if (showHiddenLogs) {
      child.removeAttribute('hidden')
    } else if (logLevel === 1) {
      child.setAttribute('hidden', '')
    }
  })
}

$(() => {
  $('#runJob').on('click', invokeJob)
  $('#showDebugLogs').on('click', toggleDebugLogs)

  selectedJobExecution = lastJobExecution

  if (lastJobExecutionStatus === 1) {
    stompClient.activate()
  }

  $('#jobHistory > ol').children().each((_, child) => {
    child.onclick = () => displayJobExecution(child as JobHistoryEntry)
  })
})