import axios, {AxiosError, AxiosResponse} from "axios";
import {JobDataRequestResponse, JobHistoryResponse, JobLog, JobResponse} from "./types";
import {Csrf} from "../../types";
import {Client, IMessage} from "@stomp/stompjs";
import CariProgressBar from "../../components/progress-bar";
import {waitFor} from "../../util";

declare const _csrf: Csrf
declare const jobEndpoint: string

declare const lastJobExecution: number
declare const lastJobExecutionLog: number
declare const lastJobExecutionStatus: number

let _lastJobExecution: number
let _lastJobExecutionLog: number
let _lastJobExecutionStatus: number

let selectedJobExecution: number
let showHiddenLogs = false
let stompClient: Client

/* LOG FUNCTIONS */

async function pullLogs() {
  while (_lastJobExecutionStatus === 1) {
    stompClient.publish({
      destination: '/app/pull-job-data',
      body: JSON.stringify({
        jobExecution: _lastJobExecution,
        lastJobExecutionLog: _lastJobExecutionLog,
      })
    })

    await waitFor(1000)
  }
}

function appendLogs(logs: JobLog[], reset: boolean) {
  const newLogs = logs.map(log => $('<code>')
    .text(log.formattedMessage)
    .prop('hidden', !showHiddenLogs && log.logLevel === 1)
    .data('logLevel', log.logLevel)
    .attr('data-log-level', log.logLevel)
  )

  const logViewer = $('#logs')

  if (reset) {
    logViewer.empty()
  }

  logViewer.prepend(newLogs)
}

function toggleDebugLogs() {
  showHiddenLogs = !showHiddenLogs

  $('#logs').children().each((_, child) => {
    const $child = $(child)
    const logLevel = parseInt($child.data('logLevel'))

    if (showHiddenLogs) {
      $child.removeAttr('hidden')
    } else if (logLevel === 1) {
      $child.attr('hidden', 'hidden')
    }
  })
}

/* JOB FUNCTIONS */

function getPreviousJobs() {
  return $('#jobsHistory > ol').children() as JQuery<HTMLLIElement>
}

function invokeJob() {
  if (_lastJobExecutionStatus === 1) {
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

        _lastJobExecution = jobExecution
        _lastJobExecutionLog = 0
        _lastJobExecutionStatus = 1

        $('#previewChanges')
          .attr('hidden', 'hidden')
          .children('a')
            .attr('href', `/cms/job/preview?job=${_lastJobExecution}`)

        $('#runJob').attr('disabled', 'disabled')

        const progressBar = new CariProgressBar()
        progressBar.percentComplete = 0

        $('#jobProgressBar').append(progressBar)

        selectedJobExecution = jobExecution

        appendJobExecution(jobExecution, jobResponse.started)
        appendLogs([], true)

        $('#outputFileUrl').prop('href', '#').prop('disabled', 'disabled')

        stompClient.activate()
      }
    })
    .catch((err: AxiosError) => {
      alert(`Job failed to start. Reason: ${err.message}`)
    })
}

function clearSelectedJob() {
  getPreviousJobs().each((_, child) => {
    $(child).removeAttr('selected')
  })
}

/* JOB EXECUTION FUNCTIONS */

function displayJobExecution(jobHistoryEntry: JQuery<HTMLLIElement>) {
  if (jobHistoryEntry.attr('selected')) {
    return
  }

  clearSelectedJob()
  jobHistoryEntry.attr('selected', 'selected')

  const jobExecution = jobHistoryEntry.data('jobExecution')

  axios.get<JobHistoryResponse>('/api/jobs/get-job-execution-data', {params: {jobExecution}})
    .then((res: AxiosResponse<JobHistoryResponse>) => {
      selectedJobExecution = jobExecution
      $('#outputFileUrl').prop('href', res.data.outputFileUrl).removeProp('disabled')
      appendLogs(res.data.logs, true)
    })
}

function appendJobExecution(jobExecution: number, started: string) {
  clearSelectedJob()

  const jobHistoryEntryTemplate = $('#jobHistoryEntry').get(0) as HTMLTemplateElement
  const jobHistoryEntry = $(document.importNode(jobHistoryEntryTemplate.content, true).firstElementChild as HTMLLIElement)

  jobHistoryEntry.prop('selected', true)
    .data('jobExecution', jobExecution)
    .on('click', () => displayJobExecution(jobHistoryEntry))

  jobHistoryEntry.find('.job-execution')
    .text(jobExecution)

  jobHistoryEntry.find('.job-started')
    .text(new Date(started).toUTCString().split(' ').slice(1, 5).join(' '))

  $('#jobsHistory > ol').prepend(jobHistoryEntry)
}

/* END FUNCTIONS */

$(() => {
  _lastJobExecution = lastJobExecution
  _lastJobExecutionLog = lastJobExecutionLog
  _lastJobExecutionStatus = lastJobExecutionStatus

  selectedJobExecution = lastJobExecution

  $('#runJob').on('click', invokeJob)
  $('#showDebugLogs').on('click', toggleDebugLogs)

  $('#jobsHistory > ol').children().each((_, child) => {
    child.onclick = () => displayJobExecution($(child as HTMLLIElement))
  })

  stompClient = new Client({
    brokerURL: '/cari-websocket',
    onConnect: () => {
      stompClient.subscribe('/topic/job-data', (data: IMessage) => {
        const response = JSON.parse(data.body) as JobDataRequestResponse
        const progressBar = $('#jobProgressBar')

        if (response.last) {
          _lastJobExecutionStatus = response.jobExecutionStatus

          if (response.jobExecutionStatus === 5) {
            $('#previewChanges').removeAttr('hidden')
          } else {
            $('#runJob').removeAttr('disabled')
          }

          progressBar.empty()
          getPreviousJobs().find('.job-status').first().text(response.status)
          $('#outputFileUrl').prop('href', response.outputFileUrl)
        } else {
          (progressBar.children('cari-progress-bar').get(0) as CariProgressBar).percentComplete = response.percentComplete
        }

        if (response.logs.length > 0) {
          _lastJobExecutionLog = response.logs[0].jobExecutionLog
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

  if (lastJobExecutionStatus === 1) {
    stompClient.activate()
  }
})