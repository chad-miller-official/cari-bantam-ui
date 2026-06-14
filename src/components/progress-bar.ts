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
    let percentComplete = this.value

    if (percentComplete % 1) {
      // Assume this.value is a decimal between 0.0 and 1.0
      percentComplete = Math.round(percentComplete * 100)
    }

    return html`
      <div>
        <progress max="100" value="${percentComplete}"></progress>
        <span>${percentComplete}%</span>
      </div>
    `
  }
}