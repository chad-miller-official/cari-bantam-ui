import {customElement, property} from "lit/decorators.js";
import {css, html, LitElement} from "lit";
import {styleMap} from "lit/directives/style-map.js";

@customElement('article-reader')
export class ArticleReader extends LitElement {

  static styles = css`
    article {
      display: flex;
      flex-direction: column;
      margin: auto;
      padding: 0;
    }

    .body {
      padding: 1em;
    }

    .header {
      background-position: center;
      background-size: cover;
      padding: 2em 2em 5em 2em;
    }

    .header h1, h3 {
      margin: revert;
      width: 50%;
    }
  `

  @property()
  title: string = '(no title)'

  @property()
  author: string = '(unknown)'

  @property()
  published: string

  @property()
  originalPublicationUrl: string

  @property()
  previewImageUrl: string

  @property()
  backgroundColor: string = '#ffffff'

  @property()
  textColor: string = '#000000'

  @property({type: Boolean, attribute: 'data-round-edges'})
  roundEdges: Boolean = false

  render() {
    const styles = {
      color: this.textColor,
      backgroundImage: `linear-gradient(transparent, transparent 50%, white), linear-gradient(to right, ${this.backgroundColor} 40%, transparent 75%), url(${this.previewImageUrl})`
    }

    if (this.roundEdges) {
      styles['borderTopLeftRadius'] = '20px'
      styles['borderTopRightRadius'] = '20px'
    }

    let originallyPublishedAt = null

    if (this.originalPublicationUrl) {
      originallyPublishedAt = html`
        <i>
          Originally published at
          <a href="${this.originalPublicationUrl}" target="_blank">
            ${new URL(this.originalPublicationUrl).hostname}
          </a>
        </i>
      `
    }

    return html`
      <article>
        <div class="header" style="${styleMap(styles)}">
          <h1>${this.title}</h1>
          <h3>by ${this.author} // ${this.published}</h3>
          ${originallyPublishedAt}
        </div>
        <div class="body">
          <slot></slot>
        </div>
      </article>
    `
  }
}