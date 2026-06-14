import axios, {AxiosError, AxiosResponse} from "axios";
import {JobDataRequestResponse, JobResponse} from "./types";
import {waitFor} from "../../util";
import {Csrf} from "../../types";
import {Client, IMessage} from "@stomp/stompjs";
import CariProgressBar from "../../components/progress-bar";

declare const _csrf: Csrf

declare const jobExecution: number
declare const redirectTo: string

let judgmentJobExecution: number
let judgmentJobExecutionStatus = 1

const stompClient = new Client({
  brokerURL: '/cari-websocket',
  onConnect: () => {
    stompClient.subscribe('/topic/job-data', (data: IMessage) => {
      const response = JSON.parse(data.body) as JobDataRequestResponse

      const progressBarContainer = $('#previewJobProgressBar')
      const progressBar = progressBarContainer.children('cari-progress-bar').get(0) as CariProgressBar

      progressBar.value = Math.round(response.percentComplete * 100)

      if (response.last) {
        judgmentJobExecutionStatus = response.jobExecutionStatus

        const finishedMessage = $('<p>')
        let message = 'Import complete. Redirecting to live page...'

        if (judgmentJobExecutionStatus === 2 || judgmentJobExecutionStatus === 4) {
          message = 'Something went wrong!' // XXX
        }

        finishedMessage.text(message)
        progressBarContainer.empty().append(finishedMessage)
      }
    })

    listen()
      .then(() => stompClient.deactivate())
      .then(() => waitFor(3000))
      .then(() => window.location.href = redirectTo)
  },
  onWebSocketError: error => {
    // XXX
    console.error('WebSocket error', error)
  },
  onStompError: frame => {
    // XXX
    console.error(`Broker reported error: ${frame.headers['message']}`)
    console.error(`Additional details: ${frame.body}`)
  }
})

async function listen() {
  while (judgmentJobExecutionStatus === 1) {
    stompClient.publish({
      destination: '/app/pull-job-data',
      body: JSON.stringify({
        jobExecution: judgmentJobExecution,
        lastJobExecutionLog: 0,
      })
    })

    await waitFor(1000)
  }
}

function sendJudgment(verb: string) {
  if (!confirm(`${verb} changes?`)) {
    return
  }

  const axiosConfig = {
    withCredentials: true,
    xsrfHeaderName: _csrf.headerName,
    headers: {[_csrf.headerName]: _csrf.token},
  }

  axios.post<JobResponse>(`/api/jobs/${verb.toLowerCase()}-job`, {jobExecution: jobExecution}, axiosConfig)
    .then((res: AxiosResponse<JobResponse>) => {
      const error = res.data.error

      if (error) {
        alert(error.message)
      } else {
        judgmentJobExecution = res.data.jobExecution

        $('#previewJobProgressBar')
          .append(
            $('<span>').text('Working...'),
            new CariProgressBar()
          )

        stompClient.activate()
      }
    })
    .catch((err: AxiosError) => {
      alert(`Job failed to start. Reason: ${err.message}`)
    })
}

$(() => {
  $('#previewControls > button.approve, button.reject').on('click', (event) => sendJudgment(event.target.textContent))
})