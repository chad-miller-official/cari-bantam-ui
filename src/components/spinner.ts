import {css, html, LitElement} from 'lit'
import {customElement, query} from 'lit/decorators.js'

@customElement('cari-spinner')
export default class CariSpinner extends LitElement {
  static styles = css`
    .loader {
      animation: spin 2s linear infinite;
      border: 16px solid #f3f3f3;
      border-radius: 50%;
      border-top: 16px solid #cdcdcd;
      height: 120px;
      margin: 32px auto;
      width: 120px;
    }

    @keyframes spin {
      0% {
        transform: rotate(0deg);
      }
      100% {
        transform: rotate(360deg);
      }
    }
  `

  render() {
    return html`
      <div class="loader"></div>`
  }
}

@customElement('fullscreen-spinner')
export class FullscreenSpinner extends LitElement {
  static styles = css`
    dialog {
      align-items: center;
      background-color: transparent;
      height: 100%;
      justify-content: center;
      width: auto;
    }

    dialog[open] {
      display: flex;
    }

    dialog::backdrop {
      background-color: rgba(0, 0, 0, 0.2);
    }`

  @query('#modal')
  modal: HTMLDialogElement

  showModal() {
    this.modal.showModal()
  }

  close() {
    this.modal.close()
  }

  render() {
    return html`
      <dialog id="modal">
        ${new CariSpinner()}
      </dialog>`
  }
}