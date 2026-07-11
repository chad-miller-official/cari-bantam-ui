import {customElement, queryAssignedElements, state} from "lit/decorators.js";
import {css, html, LitElement} from "lit";
import {JobLog} from "../types";

export function clearLogs(logViewer: LogViewer) {
  appendLogs(logViewer, [], true)
}

export function appendLogs(logViewer: LogViewer, logs: JobLog[], reset: boolean) {
  const newLogs = logs.map(log => {
    const line = document.createElement('code')

    line.textContent = log.formattedMessage
    line.dataset['logLevel'] = log.logLevel.toString()

    if (log.logLevel === 1 && !logViewer.showHiddenLogs) {
      line.setAttribute('hidden', 'hidden')
    }

    line.setAttribute('data-log-level', log.logLevel.toString())

    return line
  })

  if (reset) {
    logViewer.replaceChildren(...newLogs)
  } else {
    logViewer.prepend(...newLogs)
  }

  this.requestUpdate()
}

@customElement('log-viewer')
export class LogViewer extends LitElement {

  static styles = css`
    article {
      display: flex;
      flex-direction: column;
      height: 100%;
    }

    #logContainer {
      border: 1px solid #cdcdcd;
      box-sizing: border-box;
      display: flex;
      flex-direction: column-reverse;
      flex-grow: 1;
      overflow-y: scroll;
      padding: 4px;
      text-align: start;
      white-space: pre-wrap;
    }

    #options {
      margin-bottom: 8px;
    }
  `

  @state()
  showHiddenLogs = false

  @queryAssignedElements({flatten: true})
  logs: HTMLElement[]

  toggleDebugLogs() {
    this.showHiddenLogs = !this.showHiddenLogs
    let logs = this.logs

    for (const log of logs) {
      const logLevel = parseInt(log.dataset['logLevel'])

      if (this.showHiddenLogs) {
        log.removeAttribute('hidden')
      } else if (logLevel === 1) {
        log.setAttribute('hidden', 'hidden')
      }
    }
  }

  render() {
    return html`
      <article>
        <div id="options">
          <input type="checkbox" id="showDebugLogs" @change="${this.toggleDebugLogs}">
          <label for="showDebugLogs">Show Debug Output</label>
        </div>
        <div id="logContainer">
          <slot>
            <code>No previous job history.</code>
          </slot>
        </div>
      </article>
    `
  }
}