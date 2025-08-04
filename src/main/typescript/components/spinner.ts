import {css, html, LitElement} from 'lit'
import {customElement} from 'lit/decorators.js'

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