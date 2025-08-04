import {customElement, property, state} from 'lit/decorators.js'
import {css, html, LitElement} from 'lit'
import axios, {AxiosError, AxiosResponse} from 'axios'
import {JobDataRequestResponse, JobResponse} from '../types'
import {Csrf} from '../../../types'
import {Client, IMessage} from '@stomp/stompjs'
import {waitFor} from '../../../util'
import CariProgressBar from '../../../components/progress-bar'

declare const _csrf: Csrf

@customElement('preview-controls')
export class PreviewControls extends LitElement {
  static styles = css`
    div {
      display: flex;
      justify-content: space-around;
    }
    
    #indicatorContainer {
      flex-direction: column;
      align-items: center;
      gap: 0.5em;
    }
  `

  @state()
  judgmentJobExecution: number

  @state()
  judgmentSent: boolean = false

  @state()
  percentComplete: number = 0

  @state()
  judgmentJobExecutionStatus: number = 1

  @property({type: Number})
  jobExecution: number

  @property()
  redirectTo: string

  stompClient: Client

  constructor() {
    super()

    this.stompClient = new Client({
      brokerURL: '/cari-websocket',
      onConnect: () => {
        this.stompClient.subscribe('/topic/job-data', (data: IMessage) => {
          const response = JSON.parse(data.body) as JobDataRequestResponse
          this.percentComplete = response.percentComplete

          if (response.last) {
            this.percentComplete = 1
            this.judgmentJobExecutionStatus = response.jobExecutionStatus
          }
        })

        this.listen()
        .then(() => this.stompClient.deactivate())
        .then(() => waitFor(3000))
        .then(() => window.location.href = this.redirectTo)
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
  }

  async listen() {
    while (this.percentComplete < 1) {
      this.stompClient.publish({
        destination: '/app/pull-job-data',
        body: JSON.stringify({
          jobExecution: this.judgmentJobExecution,
          lastJobExecutionLog: 0,
        })
      })

      await waitFor(1000)
    }
  }

  sendJudgment(verb: string) {
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
        this.judgmentJobExecution = res.data.jobExecution
        this.judgmentSent = true
        this.stompClient.activate()
      }
    })
    .catch((err: AxiosError) => {
      alert(`Job failed to start. Reason: ${err.message}`)
    })
  }

  render() {
    let indicator = null

    if (this.judgmentSent && this.percentComplete < 1) {
      indicator = html`
        Working...
        <cari-progress-bar percentComplete="${this.percentComplete}"></cari-progress-bar>`
    } else if (this.judgmentJobExecutionStatus > 1) {
      switch (this.judgmentJobExecutionStatus) {
        case 2:
        case 4:
          indicator = html`<p>Something went wrong!</p>` // XXX
          break
        default:
          indicator = html`<p>Import complete. Redirecting to live page...</p>`
      }
    }

    return html`
      <div>
        <button @click=${() => this.sendJudgment('Approve')} ?disabled=${this.judgmentSent}>
          Approve
        </button>
        <button @click=${() => this.sendJudgment('Reject')} ?disabled=${this.judgmentSent}>
          Reject
        </button>
      </div>
      <div id="indicatorContainer">
        ${indicator}
      </div>`
  }
}

export {CariProgressBar}