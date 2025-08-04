import {customElement, property} from 'lit/decorators.js'
import {css, html, LitElement} from 'lit'
import {styleMap} from 'lit/directives/style-map.js'

@customElement('cari-progress-bar')
export default class CariProgressBar extends LitElement {

  @property()
  percentComplete: number

  static styles = css`
    #progressBarHolder {
      align-items: center;
      display: flex;
      gap: 0.5ch;
      width: fit-content;
    }
    
    .fill {
      background-color: #a3e1ff;
      border-top-left-radius: 0.25em;
      border-bottom-left-radius: 0.25em;
      height: 100%;
    }
    
    .percentage {
      width: 6ch;
    }

    .track {
      border: 1px solid black;
      border-radius: 0.25em;
      height: 1em;
      width: 200px;
    }
  `

  render() {
    const percentCompletePercentage = Math.round(
      ((this.percentComplete * 100) + Number.EPSILON) * 100) / 100

    let borderRadius = '0.25em'

    if (percentCompletePercentage < 100) {
      borderRadius = '0'
    }

    const style = {
      width: `${percentCompletePercentage}%`,
      borderTopRightRadius: borderRadius,
      borderBottomRightRadius: borderRadius,
    }

    return html`
      <div id="progressBarHolder">
        <div class="track">
          <div class="fill" style="${styleMap(style)}"></div>
        </div>
        <div class="percentage">
          ${percentCompletePercentage}%
        </div>
      </div>`
  }
}