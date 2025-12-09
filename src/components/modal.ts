import {css, html, LitElement, PropertyValueMap, PropertyValues} from 'lit'
import {customElement, query, state} from 'lit/decorators.js'

@customElement('cari-modal')
export class CariModal extends LitElement {
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
    this.dispatchEvent(new Event('open'))
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