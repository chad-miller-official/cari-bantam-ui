import {customElement, queryAssignedElements, state} from "lit/decorators.js";
import {css, html, LitElement} from "lit";
import {LogAppend} from "../events";

@customElement('log-viewer')
export class LogViewer extends LitElement {
  static styles = css`
    article {
      display: flex;
      flex-direction: column-reverse;
      padding: 4px;
      white-space: pre-wrap;
    }
  `

  @queryAssignedElements({slot: 'logs'})
  logItems: HTMLElement[]

  @state()
  showHiddenLogs: boolean = false

  connectedCallback() {
    super.connectedCallback()
    window.addEventListener('logappend', this.handleLogAppend.bind(this))
    window.addEventListener('toggledebuglogs', this.handleToggleDebugLogs.bind(this))
  }

  handleLogAppend(event: CustomEvent<LogAppend>) {
    const logAppendEvent = event.detail

    const newLogs = logAppendEvent.logs.map(log => {
      const logItem = document.createElement('code')

      logItem.innerText = log.formattedMessage
      logItem.hidden = !this.showHiddenLogs && log.logLevel === 1
      logItem.dataset.logLevel = log.logLevel.toString()
      logItem.slot = 'logs'

      return logItem
    })

    const logViewer = document.getElementById(this.id)

    if (logAppendEvent.reset) {
      logViewer.replaceChildren(...newLogs)
    } else {
      logViewer.prepend(...newLogs)
    }
  }

  handleToggleDebugLogs() {
    this.showHiddenLogs = !this.showHiddenLogs

    this.logItems.forEach(child => {
      const logLevel = parseInt((child as HTMLElement).dataset.logLevel)

      if (this.showHiddenLogs) {
        child.removeAttribute('hidden')
      } else if (logLevel === 1) {
        child.setAttribute('hidden', '')
      }
    })
  }

  render() {
    return html`
      <article>
        <slot name="logs">
          <code>No previous job history.</code>
        </slot>
      </article>`
  }
}