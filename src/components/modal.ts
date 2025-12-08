import {css, html, LitElement, PropertyValueMap, PropertyValues} from 'lit'
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
      <link rel="stylesheet"
            href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/7.0.0/css/fontawesome.min.css"
            integrity="sha512-J2Gce+WmOttffHOrVKLTlzxIalPXUMDbSfn5ADqp8Vj9EngnjNHr+jjiL3ZB8muEzo+K51gU10X+0eGqGNL7QA=="
            crossorigin="anonymous" referrerpolicy="no-referrer"/>
      <link rel="stylesheet"
            href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/7.0.0/css/regular.min.css"
            integrity="sha512-wwQ/gaGbUFM5xDtqajxQCwISzM1GWLK1T3Ml4ZIIrQ3AciO7bDi9eRynkzdpXwiwGBmdpCgZqfVYeZu5UjVeCw=="
            crossorigin="anonymous" referrerpolicy="no-referrer"/>
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

@customElement('fullscreen-modal')
export class FullscreenModal extends LitElement {
  static styles = css`
    dialog {
      background-color: rgba(255, 255, 255, 90%);
      border: none;
      height: 100%;
      left: 0;
      margin: 0;
      max-height: unset;
      max-width: unset;
      padding: 0;
      position: fixed;
      top: 0;
      width: 100%;
      z-index: 10000;
    }

    .modal-actions {
      position: fixed;
      top: 0;
    }

    .modal-actions > button {
      background-color: initial;
      border: none;
      color: #7f7f7f;
      cursor: pointer;
      font-size: 36px;
      padding: 8px;

      &:hover {
        background-color: initial;
        color: #414141;
      }
    }`

  @query('#modal')
  modal: HTMLDialogElement

  firstUpdated(changedProperties: PropertyValues) {
    super.firstUpdated(changedProperties);

    this.modal.addEventListener('close', (event) => {
      document.body.style.overflowY = 'unset'
      this.dispatchEvent(new Event('close'))
    })
  }

  showModal() {
    document.body.style.overflow = 'hidden'
    this.modal.showModal()
  }

  render() {
    return html`
      <link rel="stylesheet"
            href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/7.0.0/css/fontawesome.min.css"
            integrity="sha512-J2Gce+WmOttffHOrVKLTlzxIalPXUMDbSfn5ADqp8Vj9EngnjNHr+jjiL3ZB8muEzo+K51gU10X+0eGqGNL7QA=="
            crossorigin="anonymous" referrerpolicy="no-referrer"/>
      <link rel="stylesheet"
            href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/7.0.0/css/solid.min.css"
            integrity="sha512-SRwBRtvmT+LZLST1GBrRec8GROqtjKU1NK23RKSpdL6IRzn2xPeOfBYSeIlc/9iXYagKB5IX6MyKZF1nq4a1fw=="
            crossorigin="anonymous" referrerpolicy="no-referrer"/>
      <dialog id="modal">
        <slot></slot>
        <form method="dialog" class="modal-actions">
          <button>
            <i class="fa-solid fa-xmark"></i>
          </button>
        </form>
      </dialog>`
  }
}