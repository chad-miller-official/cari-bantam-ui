import {css, html, LitElement} from "lit";
import {customElement, property} from "lit/decorators.js";
import {styleMap} from "lit/directives/style-map.js";

@customElement('aesthetic-block')
export class AestheticBlock extends LitElement {

  static styles = css`
    @media screen and (max-width: 1231px) {
      .aesthetic-icon-text {
        flex-direction: column;
        justify-content: flex-start;
      }

      .aesthetic-icon-text h3 {
        background-color: rgba(75, 75, 75, 0.8);
        color: #dddddd;
        margin-block-start: 0;
        padding: 6px;
      }

      .aesthetic-icon-text h4 {
        display: none;
      }
    }

    @media screen and (max-width: 600px) {
      .aesthetic-icon {
        height: 40vw;
        width: 40vw;
      }
    }

    @media screen and (min-width: 601px) and (max-width: 959px) {
      .aesthetic-icon {
        height: 20vw;
        width: 20vw;
      }
    }

    @media screen and (min-width: 960px) and (max-width: 1231px) {
      .aesthetic-icon {
        height: 150px;
        width: 150px;
      }
    }

    @media screen and (min-width: 1232px) {
      .aesthetic-icon {
        height: 200px;
        width: 200px;
      }

      .aesthetic-icon-text {
        background-color: #e7e7e7;
        flex-flow: column wrap;
        justify-content: center;
        opacity: 0;
      }

      .aesthetic-icon-text:hover {
        opacity: 1;
        transition: 0.4s;
      }

      .aesthetic-icon-text h3, h4 {
        padding: 0 6px;
      }
    }

    .aesthetic-block-anchor {
      color: black;
      text-decoration: none;
    }

    .aesthetic-icon {
      display: flex;
      background-size: contain;
    }

    .aesthetic-icon-text {
      align-content: center;
      display: flex;
      flex-grow: 2;
      text-align: center;
    }

    a {
      color: black;
      text-decoration: none;
    }
  `

  @property()
  name: string

  @property()
  startYear: string = '?'

  @property()
  endYear: string = 'now'

  @property()
  urlSlug: string

  @property()
  displayImageUrl: string

  @property()
  preview: boolean

  @property()
  jobExecution?: number

  render() {
    const bg = styleMap({backgroundImage: `url(${this.displayImageUrl})`})
    const href = this.preview ? `/cms/job/preview?job=${this.jobExecution}&aesthetic=${this.urlSlug}` : `/aesthetics/${this.urlSlug}`

    return html`
      <a href="${href}">
        <div class="aesthetic-icon" style="${bg}">
          <div class="aesthetic-icon-text">
            <h3>${this.name}</h3>
            <h4>
              ${this.startYear} - ${this.endYear}
            </h4>
          </div>
        </div>
      </a>`
  }
}