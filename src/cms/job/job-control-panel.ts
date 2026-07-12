import axios, {AxiosError, AxiosResponse} from "axios";
import {
  JobArgument,
  JobArgumentPutResponse,
  JobDataRequestResponse,
  JobHistoryResponse,
  JobResponse
} from "./types";
import {Csrf} from "../../types";
import {Client, IMessage} from "@stomp/stompjs";
import {waitFor} from "../../util";
import CariProgressBar from "../../components/progress-bar";
import CariSpinner from "../../components/spinner";
import {appendLogs, clearLogs, LogViewer} from "./components/log-viewer";

declare const _csrf: Csrf
declare const jobEndpoint: string

declare const lastJobExecution: number
declare const lastJobExecutionLog: number
declare const lastJobExecutionStatus: number

declare const args: JobArgument[]

let _lastJobExecution: number
let _lastJobExecutionLog: number
let _lastJobExecutionStatus: number

let selectedJobExecution: number
let stompClient: Client

let _args: JobArgument[]

/* LOG FUNCTIONS */

const getLogViewer = () => $('#logs').get(0) as LogViewer

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
        progressBar.id = 'jobProgressBar'

        $('#jobProgressBar').append(progressBar)

        selectedJobExecution = jobExecution

        appendJobExecution(jobExecution, jobResponse.started)
        clearLogs(getLogViewer())

        $('#outputFileUrl')
          .attr('href', '#')
          .attr('disabled', 'disabled')

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

function deleteArg() {
  const index = $(this).attr('id').replace(/^delete_/, '')
  const key = $(`#key_${index}`)
  const value = $(`#value_${index}`)

  if ($('.inputs-follow').nextAll('input').length <= 2) {
    key.val('')
    value.val('')
    $(this).attr('disabled', 'disabled')
    $('#addArg').attr('disabled', 'disabled')
  } else {
    key.remove()
    value.remove()
    $(this).remove()
  }

  $('#jobArgumentsForm button[type=submit]').removeAttr('disabled')
}

function cloneArgRow(index: number, key?: string, value?: string) {
  const keyInputId = `key_${index}`
  const valueInputId = `value_${index}`

  const argRow = $($('#argRow').prop('content')).clone()
  const submitButton = $('#jobArgumentsForm button[type=submit]')

  argRow.find('.key')
    .prop('id', keyInputId)
    .prop('name', keyInputId)
    .on('input', () => submitButton.removeAttr('disabled'))
    .val(key)

  argRow.find('.value')
    .prop('id', valueInputId)
    .prop('name', valueInputId)
    .on('input', () => submitButton.removeAttr('disabled'))
    .val(value)

  argRow.find('.delete-arg')
    .prop('id', `delete_${index}`)
    .on('click', deleteArg)

  return argRow
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

      const outputFileUrl = res.data.outputFileUrl
      const $outputFileUrl = $('#outputFileUrl').attr('href', outputFileUrl || '#')

      if (outputFileUrl) {
        $outputFileUrl.removeAttr('disabled')
      } else {
        $outputFileUrl.attr('disabled', 'disabled')
      }

      appendLogs(getLogViewer(), res.data.logs, true)
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
  _args = args

  selectedJobExecution = lastJobExecution

  $('#runJob').on('click', invokeJob)

  $('#jobsHistory > ol').children().each((_, child) => {
    child.onclick = () => displayJobExecution($(child as HTMLLIElement))
  })

  const jobArgumentsModal = $('#jobArgumentsModal')
  const submitButton = $('#jobArgumentsForm button[type=submit]')

  jobArgumentsModal.on('close', () => {
    const argList = $('#jobArgumentsForm .arg-list')
    argList.children('input, button.delete-arg').remove()

    const lastSavedArgs = _args.map((arg, index) => cloneArgRow(index, arg.key, arg.value))
    argList.children('.inputs-follow').after(lastSavedArgs)

    submitButton.attr('disabled', 'disabled')
  })

  $('#jobArguments').on('click', () => {
    (jobArgumentsModal.get(0) as HTMLDialogElement).showModal()
  })

  const addArg = $('#addArg')

  addArg.on('click', function () {
    const index = parseInt($('#jobArgumentsForm input.key')
      .last()
      .attr('id')
      .replace(/^key_/, '')) + 1

    const argRow = cloneArgRow(index)
    $(this).before(argRow)
  })

  $('#jobArgumentsForm input.key, input.value').on('input', () => {
    submitButton.removeAttr('disabled')
    $('button.delete-arg').removeAttr('disabled')
    addArg.removeAttr('disabled')
  })

  $('button.delete-arg').on('click', deleteArg)

  $('#jobArgumentsForm').on('submit', function (event) {
    event.preventDefault()

    const spinner = $(new CariSpinner())
    $('#jobArgumentsForm > fieldset').append(spinner)

    const putData = $('#jobArgumentsForm input.key').toArray().reduce((acc, elem: HTMLInputElement) => {
      const index = elem.id.replace(/^key_/, '')
      const key = elem.value
      acc[key] = $(`#value_${index}`).val()
      return acc
    }, {})

    const axiosConfig = {
      withCredentials: true,
      xsrfHeaderName: _csrf.headerName,
      headers: {[_csrf.headerName]: _csrf.token},
    }

    axios.put<JobArgumentPutResponse>($(this).attr('action'), putData, axiosConfig)
      .then(() => {
        _args = $('#jobArgumentsForm input.key').toArray().map((elem: HTMLInputElement) => {
          const index = elem.id.replace(/^key_/, '')
          const key = elem.value
          const value = $(`#value_${index}`).val()
          return {key, value: `${value}`}
        })

        spinner.remove();
        ($('#jobArgumentsModal').get(0) as HTMLDialogElement).close()
      })
      .catch((err: AxiosError) => {
        // TODO
        console.log(err)
      })
  })

  stompClient = new Client({
    brokerURL: '/cari-websocket',
    onConnect: () => {
      stompClient.subscribe('/topic/job-data', (data: IMessage) => {
        const response = JSON.parse(data.body) as JobDataRequestResponse
        const progressBarContainer = $('#jobProgressBar');

        (progressBarContainer.children('cari-progress-bar').get(0) as CariProgressBar).value = response.percentComplete

        if (response.jobExecutionStatus != 1) {
          _lastJobExecutionStatus = response.jobExecutionStatus

          if (response.jobExecutionStatus === 5) {
            $('#previewChanges').removeAttr('hidden')
          } else {
            $('#runJob').removeAttr('disabled')
          }

          progressBarContainer.empty()
          getPreviousJobs().find('.job-status').first().text(response.status)

          const outputFileUrl = response.outputFileUrl

          if (outputFileUrl) {
            $('#outputFileUrl')
              .attr('href', outputFileUrl)
              .removeAttr('disabled')
          }
        }

        if (response.logs.length > 0) {
          _lastJobExecutionLog = response.logs[0].jobExecutionLog
        }

        if (response.jobExecution !== selectedJobExecution) {
          return
        }

        appendLogs(getLogViewer(), response.logs, false)
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