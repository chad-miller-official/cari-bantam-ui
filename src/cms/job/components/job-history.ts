import {customElement, property} from "lit/decorators.js";
import {css, html, LitElement} from "lit";

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