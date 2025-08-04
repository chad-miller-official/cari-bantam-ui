import {css, html, LitElement} from 'lit'
import {customElement, query, state} from 'lit/decorators.js'

@customElement('cari-modal')
export default class CariModal extends LitElement {
  static styles = css`
    #cariModal {
      background-color: rgba(0, 0, 0, 0.4);
      border: none;
      height: 100%;
      position: fixed;
      top: 0;
      width: 100%;
      z-index: 1;
    }

    #cariModalContent {
      align-items: flex-end;
      display: flex;
      flex-direction: column;
      left: 50%;
      max-height: 90vh;
      max-width: 90vw;
      position: absolute;
      top: 50%;
      transform: translate(-50%, -50%);
    }
    
    button {
      font-size: large;
      margin-bottom: 4px;
      padding: 0.3em;
    }
  `

  @query('#cariModal')
  cariModal: HTMLDivElement

  @state()
  open: Boolean = false

  close() {
    this.open = false
    this.dispatchEvent(new CustomEvent('modalclosed'))
  }

  connectedCallback() {
    super.connectedCallback()

    window.onclick = (event: PointerEvent) => {
      if (event.composedPath()[0] == this.cariModal) {
        this.close()
      }
    }

    window.onkeyup = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        this.close()
      }
    }
  }

  render() {
    return html`
      <link rel="stylesheet" href="/fontawesome/css/fontawesome.css">
      <link rel="stylesheet" href="/fontawesome/css/regular.css">
      <dialog id="cariModal" ?open=${this.open}>
        <div id="cariModalContent">
          <button @click=${this.close}>
            <i class="fa-regular fa-rectangle-xmark"></i>
            close
          </button>
          <slot></slot>
        </div>
      </dialog>`
  }
}