import axios, {AxiosError, AxiosResponse} from "axios";
import {JobDataRequestResponse, JobResponse} from "../types";
import {waitFor} from "../../../util";
import {Csrf} from "../../../types";
import {Client, IMessage} from "@stomp/stompjs";
import CariProgressBar from "../../../components/progress-bar";
import {css, html, LitElement} from "lit";
import {customElement, property, query, queryAll, state} from "lit/decorators.js";
import {styleMap} from "lit/directives/style-map.js";
import {appendLogs, LogViewer} from "./log-viewer";

declare const _csrf: Csrf

declare const lastJobExecutionLog: number

@customElement('preview-controls')
export default class PreviewControls extends LitElement {

  static styles = css`
    p {
      line-height: 2;
    }

    .job-preview-green {
      background-color: #c9f5b7;
    }

    .job-preview-red {
      background-color: #f5bcbc;
    }

    .job-preview-yellow {
      background-color: #f3f2bc;
    }

    #logs {
      display: block;
      height: 20vh;
      padding-bottom: 1em;
    }

    #previewControls {
      align-items: center;
      display: flex;
      gap: 2em;
      justify-content: center;
    }

    #previewControlsContainer {
      font-size: smaller;
      left: 0;
      margin: auto;
      position: fixed;
      right: 0;
      text-align: center;
      top: 0;
      width: 33vw;
      z-index: 1;
    }

    #previewControlsContainer > details {
      background-color: rgba(39, 39, 39, 83%);
      border-bottom-left-radius: 0.5em;
      border-bottom-right-radius: 0.5em;
      color: white;
      margin: auto;
      padding: 1em;
    }

    #previewControlsContainer > details > summary {
      cursor: pointer;
    }
  `

  @property({type: Number})
  jobExecution: number

  @property({type: String})
  redirectTo: string

  @state()
  jobExecutionStatus = 0

  @state()
  lastJobExecutionLog = lastJobExecutionLog

  @queryAll('button')
  judgmentButtons: HTMLButtonElement[]

  @query('#logs')
  logViewer: LogViewer

  @query('#progressBar')
  progressBar: CariProgressBar

  private stompClient: Client

  constructor() {
    super()

    this.stompClient = new Client({
      brokerURL: '/cari-websocket',
      onConnect: () => {
        this.stompClient.subscribe('/topic/job-data', (data: IMessage) => {
          const response = JSON.parse(data.body) as JobDataRequestResponse

          const progressBar = this.progressBar.firstElementChild as CariProgressBar
          progressBar.value = Math.round(response.percentComplete * 100)

          if (response.last) {
            this.jobExecutionStatus = response.jobExecutionStatus

            const finishedMessage = document.createElement('p')
            let message = 'Import complete. Redirecting to live page...'

            if (this.jobExecutionStatus === 2 || this.jobExecutionStatus === 4) {
              message = 'Something went wrong!' // XXX TODO FIXME
            }

            finishedMessage.textContent = message
            this.progressBar.replaceWith(finishedMessage)
          }

          if (response.logs.length > 0) {
            this.lastJobExecutionLog = response.logs[0].jobExecutionLog
          }

          appendLogs(this.logViewer, response.logs, false)
        })

        this.listen()
          .then(() => this.stompClient.deactivate())
          .then(() => waitFor(3000))
          .then(() => window.location.href = this.redirectTo)
      },
      onWebSocketError: error => {
        // XXX TODO FIXME
        console.error('WebSocket error', error)
      },
      onStompError: frame => {
        // XXX TODO FIXME
        console.error(`Broker reported error: ${frame.headers['message']}`)
        console.error(`Additional details: ${frame.body}`)
      }
    })
  }

  async listen() {
    while (this.jobExecutionStatus === 1) {
      this.stompClient.publish({
        destination: '/app/pull-job-data',
        body: JSON.stringify({
          jobExecution: this.jobExecution,
          lastJobExecutionLog: this.lastJobExecutionLog,
        })
      })

      await waitFor(1000)
    }
  }

  sendJudgment(verb: string) {
    this.judgmentButtons.forEach(e => e.disabled = true)

    if (!confirm(`${verb} changes?`)) {
      return
    }

    const axiosConfig = {
      withCredentials: true,
      xsrfHeaderName: _csrf.headerName,
      headers: {[_csrf.headerName]: _csrf.token},
    }

    axios.post<JobResponse>(`/api/jobs/${verb.toLowerCase()}-job`, {jobExecution: this.jobExecution}, axiosConfig)
      .then((res: AxiosResponse<JobResponse>) => {
        const error = res.data.error

        if (error) {
          alert(error.message)
        } else {
          this.jobExecutionStatus = 1
          this.stompClient.activate()
        }
      })
      .catch((err: AxiosError) => {
        alert(`Job failed to start. Reason: ${err.message}`)
      })
  }

  render() {
    const visibility = this.jobExecutionStatus > 0 ? 'visible' : 'hidden';

    return html`
      <div id="previewControlsContainer">
        <details>
          <summary>This is a preview.</summary>
          <p>
            New objects are highlighted in
            <mark class="job-preview-green">green</mark>
            .
            <br/>
            Modified objects are highlighted in
            <mark class="job-preview-yellow">yellow</mark>
            .
            <br/>
            Removed objects are highlighted in
            <mark class="job-preview-red">red</mark>
            .
          </p>
          <p>
            If these changes look correct, click the Approve button.
            <br/>
            Otherwise, click the Reject button.
          </p>

          <log-viewer id="logs">
            <slot></slot>
          </log-viewer>

          <div id="previewControls">
            <button @click="${() => this.sendJudgment('Approve')}">Approve</button>
            <cari-progress-bar id="progressBar"
                               style="${styleMap({visibility})}"></cari-progress-bar>
            <button @click="${() => this.sendJudgment('Reject')}">Reject</button>
          </div>
        </details>
      </div>
    `
  }
}