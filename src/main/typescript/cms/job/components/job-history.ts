import {customElement, property, queryAssignedElements} from "lit/decorators.js";
import {css, html, LitElement} from "lit";
import axios, {AxiosResponse} from "axios";
import {JobHistoryResponse} from "../types";
import {
  JobExecutionCreation,
  JobExecutionSelection,
  JobExecutionStatusChange,
  LogAppend
} from "../events";

@customElement('job-history-entry')
export class JobHistoryEntry extends LitElement {
  static styles = css`
    li {
      border-bottom: 1px solid #cdcdcd;
      display: flex;
      flex-direction: column;
      gap: 1em;
      padding: 0.5em;
    }

    li:hover {
      background-color: #e7e7e7;
      cursor: pointer;
    }

    li[selected] {
      background-color: #e7e7e7;
      cursor: initial;
    }`

  @property({type: Number})
  jobExecution: number

  @property({type: Boolean})
  selected: boolean = false

  @property()
  id: string

  render() {
    return html`
      <li slot="logs" data-job-execution="${this.jobExecution}" ?selected="${this.selected}">
        <div>
            #${this.jobExecution} -
          <slot name="jobStarted"></slot>
        </div>
        <slot name="jobStatus">
          Running
        </slot>
      </li>`
  }
}

@customElement('job-history')
export class JobHistory extends LitElement {
  static styles = css`
    .placeholder {
      background-color: #e7e7e7;
      border-bottom: 1px solid #cdcdcd;
      padding: 0.5em;
    }

    li {
      text-align: center;
    }

    ol {
      list-style-type: none;
      height: 100%;
      margin: 0;
      padding-inline-start: 0;
    }
  `

  @queryAssignedElements({slot: 'previousJobs'})
  previousJobs: JobHistoryEntry[]

  async firstUpdated() {
    window.addEventListener('jobexecutioncreation', this.handleJobExecutionCreation.bind(this))
    window.addEventListener('jobexecutionstatuschange', this.handleJobExecutionStatusChange.bind(this))
  }

  clearSelectedJob() {
    this.previousJobs.forEach(child => child.selected = false)
  }

  handleJobExecutionCreation(event: CustomEvent<JobExecutionCreation>) {
    this.clearSelectedJob()
    const jobExecutionCreationEvent = event.detail

    const jobStartedSlot = document.createElement('span')
    jobStartedSlot.slot = 'jobStarted'
    jobStartedSlot.innerText = new Date(jobExecutionCreationEvent.started).toUTCString().split(' ').slice(1, 5).join(' ')

    const jobHistoryEntry = document.createElement('job-history-entry') as JobHistoryEntry
    jobHistoryEntry.slot = 'previousJobs'
    jobHistoryEntry.selected = true
    jobHistoryEntry.jobExecution = jobExecutionCreationEvent.jobExecution
    jobHistoryEntry.appendChild(jobStartedSlot)
    jobHistoryEntry.addEventListener('click', () => this.displayJobExecution(jobHistoryEntry))

    const jobHistory = document.getElementById(this.id)
    jobHistory.prepend(jobHistoryEntry)
  }

  handleJobExecutionStatusChange(event: CustomEvent<JobExecutionStatusChange>) {
    let jobStatus = this.previousJobs[0].querySelector('[slot=jobStatus]') as HTMLElement

    if (jobStatus == null) {
      jobStatus = document.createElement('span')
      jobStatus.slot = 'jobStatus'
      this.previousJobs[0].appendChild(jobStatus)
    }

    jobStatus.innerText = event.detail.status
  }

  displayJobExecution(jobHistoryEntry: JobHistoryEntry) {
    if (jobHistoryEntry.selected) {
      return
    }

    this.clearSelectedJob()
    jobHistoryEntry.selected = true
    const jobExecution = jobHistoryEntry.jobExecution

    axios.get<JobHistoryResponse>('/api/jobs/get-job-execution-data', {params: {jobExecution}})
    .then((res: AxiosResponse<JobHistoryResponse>) => {
      const jobExecutionSelection = {
        jobExecution: jobExecution,
        outputFileUrl: res.data.outputFileUrl,
      }

      this.dispatchEvent(new CustomEvent<JobExecutionSelection>('jobexecutionselection', {
        detail: jobExecutionSelection,
        bubbles: true,
        composed: true
      }))

      const logAppend = {reset: true, logs: res.data.logs}

      this.dispatchEvent(new CustomEvent<LogAppend>('logappend', {
        detail: logAppend,
        bubbles: true,
        composed: true,
      }))
    })
  }

  handlePreviousJobsSlotChange(slotChangeEvent: Event) {
    [...(slotChangeEvent.target as HTMLSlotElement).assignedElements()].forEach(
        child => child.addEventListener('click',
            () => this.displayJobExecution(child as JobHistoryEntry)))
  }

  render() {
    return html`
      <aside>
        <ol>
          <slot name="previousJobs" @slotchange="${this.handlePreviousJobsSlotChange}">
            <li class="placeholder">
              No previous job history.
            </li>
          </slot>
        </ol>
      </aside>`
  }
}