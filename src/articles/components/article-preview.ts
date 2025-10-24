import {css, html, LitElement} from "lit";
import {customElement, property} from "lit/decorators.js";
import {styleMap} from "lit/directives/style-map.js";

@customElement('article-preview')
export class ArticlePreview extends LitElement {

  static styles = css`
    .article {
      background-position: center;
      background-size: cover;
      border-radius: 24px;
      color: white;
      margin-bottom: 1em;
      padding: 1em 2em;
    }

    .article-author {
      font-style: italic;
    }

    .article-preview {
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 3;

      font-size: smaller;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  `

  @property()
  title: string

  @property()
  author: string

  @property()
  url: string

  @property()
  published: string

  @property()
  previewImageUrl: string

  @property()
  textColor: string = '#FFFFFF'

  render() {
    const textColor = styleMap({color: `${this.textColor} !important`})

    const bg = styleMap({
      backgroundImage: `url(${this.previewImageUrl})`,
      color: this.textColor,
    })

    const authorSlug = this.author.toLowerCase().replace(/\s+/g, '-')

    return html`
      <div class="article" style="${bg}">
        <h2>
          <a href="${this.url}" style="${textColor}" target="_blank">
            ${this.title}
          </a>
        </h2>
        <h3 class="article-author">
          by
          <a href="/team#${authorSlug}" style="${textColor}" target="_blank">${this.author}</a>
          // ${this.published}
        </h3>
        <p>
          <slot></slot>
        </p>
      </div>
    `
  }
}