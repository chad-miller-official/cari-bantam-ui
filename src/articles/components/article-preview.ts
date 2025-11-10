import {css, html, LitElement} from "lit";
import {customElement, property} from "lit/decorators.js";
import {styleMap} from "lit/directives/style-map.js";
import {dateToString, invertColor} from "../../util";

@customElement('article-preview')
export class ArticlePreview extends LitElement {

  static styles = css`
    @media screen and (max-width: 840px) {
      .article-preview {
        h2, h3 {
          width: 50%;
        }
      }
    }

    @media screen and (min-width: 841px) {
      .article-preview {
        width: 50%;
      }
    }

    .article {
      background-position: center;
      background-size: cover;
      border-radius: 24px;
      display: flex;
      margin-bottom: 1em;
      padding: 1em 2em;
      text-decoration: none;
    }

    .article:hover {
      filter: brightness(1.1);
      transition: 0.2s ease-in;
    }

    .article-author {
      font-style: italic;
      margin-block-end: 8px;
      margin-block-start: 0;
    }

    .article-title {
      margin-block-end: 9px;
    }

    a {
      color: black;
    }
  `

  @property()
  title: string = '(no title)'

  @property()
  author?: string

  @property()
  url?: string

  @property()
  published: string = dateToString(new Date())

  @property()
  previewImageUrl?: string

  @property()
  backgroundColor: string = '#ffffff'

  @property()
  textColor: string = '#000000'

  render() {
    const styles = {}

    if (this.previewImageUrl) {
      styles['backgroundImage'] = `linear-gradient(to right, ${this.backgroundColor}e0 40%, transparent 75%), url(${this.previewImageUrl})`
      styles['color'] = this.textColor
    } else if (this.backgroundColor.toLowerCase() === '#ffffff') {
      styles['border'] = 'solid 1px black';
    } else {
      styles['background-color'] = this.backgroundColor
    }

    const articlePreview = html`
      <div class="article-preview">
        <h2 class="article-title">
          <slot name="title">${this.title || '(untitled)'}</slot>
        </h2>
        <h4 class="article-author">by ${this.author || '(unknown)'}</h4>
        <h5 class="article-author">${this.published || '(not published)'}</h5>
        <slot name="summary"></slot>
      </div>`

    if (this.url) {
      return html`
        <a href="${this.url}" class="article" style="${styleMap(styles)}">
          ${articlePreview}
        </a>
      `
    } else {
      return html`
        <div class="article" style="${styleMap(styles)}">
          ${articlePreview}
        </div>`
    }
  }
}