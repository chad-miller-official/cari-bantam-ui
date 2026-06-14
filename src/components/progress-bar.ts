import {css, html, LitElement} from "lit";
import {customElement, property} from "lit/decorators.js";

@customElement('cari-progress-bar')
export default class CariProgressBar extends LitElement {

  static styles = css`
    div {
      display: flex;
      gap: 1ch;
    }
    
    span {
      width: 4ch;
    }
  `

  @property()
  value: number = 0

  render() {
    const percentComplete = Math.min(100, Math.round(this.value * 100))

    return html`
      <div>
        <progress max="100" value="${percentComplete}"></progress>
        <span>${percentComplete}%</span>
      </div>
    `
  }
}