import {customElement, property, state} from "lit/decorators.js";
import {css, html, LitElement} from "lit";
import axios, {AxiosError, AxiosResponse} from "axios";
import {JobDataRequestResponse, JobResponse} from "../types";
import {Csrf} from "../../../types";
import {
  JobExecutionCreation,
  JobExecutionSelection,
  JobExecutionStatusChange,
  LogAppend
} from "../events";
import {Client, IMessage} from "@stomp/stompjs";
import {waitFor} from "../../../util";
import CariProgressBar from "../../../components/progress-bar";

declare const _csrf: Csrf

@customElement('job-toolbar')
export class JobToolbar extends LitElement {
  static styles = css`
    a {
      background-color: #f3f3f3;
      border: 1px solid #d1d1d1;
      border-radius: 3px;
      color: black;
      padding: 5px 7px;
      text-decoration: none;
    }

    a:not([disabled]):hover {
      background-color: #e9e9e9;
      cursor: pointer;
    }

    a:not([disabled]):active {
      background-color: #dfdfdf;
      cursor: pointer;
    }

    a[disabled] {
      color: lightgray;
      cursor: inherit;
      pointer-events: none;
    }`

  @property()
  jobEndpoint: string

  @property({type: Number})
  lastJobExecution: number

  @property({type: Number})
  lastJobExecutionLog: number

  @property({type: Number})
  lastJobExecutionStatus: number

  @property({type: Number})
  percentComplete: number

  @property()
  outputFileUrl: string

  @state()
  selectedJobExecution: number

  stompClient: Client

  constructor() {
    super()

    this.stompClient = new Client({
      brokerURL: '/cari-websocket',
      onConnect: () => {
        this.stompClient.subscribe('/topic/job-data', (data: IMessage) => {
          const response = JSON.parse(data.body) as JobDataRequestResponse

          if (response.last) {
            this.lastJobExecutionStatus = response.jobExecutionStatus
            const jobExecutionStatusChange = {status: response.status}

            this.dispatchEvent(new CustomEvent<JobExecutionStatusChange>('jobexecutionstatuschange', {
              detail: jobExecutionStatusChange,
              bubbles: true,
              composed: true,
            }))

            this.outputFileUrl = response.outputFileUrl
          }

          this.percentComplete = response.percentComplete

          if (response.logs.length > 0) {
            this.lastJobExecutionLog = response.logs[0].jobExecutionLog
          }

          if (response.jobExecution !== this.selectedJobExecution) {
            return
          }

          const logAppend = {logs: response.logs, reset: false}

          this.dispatchEvent(new CustomEvent<LogAppend>('logappend', {
            detail: logAppend,
            bubbles: true,
            composed: true,
          }))
        })

        this.pullLogs().then(() => this.stompClient.deactivate())
      },
      onWebSocketError: error => {
        console.error('WebSocket error', error)
      },
      onStompError: frame => {
        console.error(`Broker reported error: ${frame.headers['message']}`)
        console.error(`Additional details: ${frame.body}`)
      }
    })
  }

  connectedCallback() {
    super.connectedCallback()
    this.selectedJobExecution = this.lastJobExecution

    if (this.lastJobExecutionStatus === 1) {
      this.stompClient.activate()
    }
  }

  async firstUpdated() {
    window.addEventListener('jobexecutionselection', this.handleJobExecutionSelection.bind(this))
  }

  handleJobExecutionSelection(event: CustomEvent<JobExecutionSelection>) {
    this.selectedJobExecution = event.detail.jobExecution
    this.outputFileUrl = event.detail.outputFileUrl
  }

  async pullLogs() {
    while (this.lastJobExecutionStatus === 1) {
      this.stompClient.publish({
        destination: '/app/pull-job-data',
        body: JSON.stringify({
          jobExecution: this.lastJobExecution,
          lastJobExecutionLog: this.lastJobExecutionLog,
        })
      })

      await waitFor(1000)
    }
  }

  invokeJob() {
    if (this.lastJobExecutionStatus === 1) {
      alert('Job is already running.')
      return
    }

    const axiosConfig = {
      withCredentials: true,
      xsrfHeaderName: _csrf.headerName,
      headers: {[_csrf.headerName]: _csrf.token},
    }

    axios.post<JobResponse>(this.jobEndpoint, {}, axiosConfig)
    .then((res: AxiosResponse<JobResponse>) => {
      const jobResponse = res.data
      const error = jobResponse.error

      if (error) {
        alert(error.message)
      } else {
        const jobExecution = jobResponse.jobExecution

        this.percentComplete = 0
        this.lastJobExecution = jobExecution
        this.lastJobExecutionLog = 0
        this.lastJobExecutionStatus = 1
        this.selectedJobExecution = jobExecution

        const jobExecutionCreation = {jobExecution, started: jobResponse.started}

        this.dispatchEvent(new CustomEvent<JobExecutionCreation>('jobexecutioncreation', {
          detail: jobExecutionCreation,
          bubbles: true,
          composed: true,
        }))

        const logAppend = {reset: true, logs: []}

        this.dispatchEvent(new CustomEvent<LogAppend>('logappend', {
          detail: logAppend,
          bubbles: true,
          composed: true,
        }))

        this.outputFileUrl = null
        this.stompClient.activate()
      }
    })
    .catch((err: AxiosError) => {
      alert(`Job failed to start. Reason: ${err.message}`)
    })
  }

  toggleDebugLogs() {
    this.dispatchEvent(new CustomEvent<object>('toggledebuglogs', {
      detail: {},
      bubbles: true,
      composed: true
    }))
  }

  render() {
    let progressBar = null

    if (this.lastJobExecutionStatus === 1) {
      progressBar = document.createElement('cari-progress-bar') as CariProgressBar
      progressBar.percentComplete = this.percentComplete
    }

    return html`
      <link rel="stylesheet" href="/fontawesome/css/fontawesome.css">
      <link rel="stylesheet" href="/fontawesome/css/solid.css">
      <div>
        <button id="runJob" ?disabled="${[1, 5].includes(this.lastJobExecutionStatus)}"
                @click=${this.invokeJob}>
          Run Job
        </button>
        <input type="checkbox" id="showDebugLogs" @click=${this.toggleDebugLogs}>
        <label for="showDebugLogs">Show Debug Output</label>
      </div>
      <span ?hidden="${this.lastJobExecutionStatus == null || this.lastJobExecutionStatus != 5}">
        <a href="${`/cms/job/preview?job=${this.lastJobExecution}`}">
          <i class="fa-solid fa-eye"></i>
          Preview Pending Changes
        </a>
      </span>
      ${progressBar}
      <a href="${this.outputFileUrl || '#'}" ?disabled="${!this.outputFileUrl}">
        <i class="fa-solid fa-file-arrow-down"></i>
        Download Error File
      </a>`
  }
}

export {CariProgressBar}