import {css, html, LitElement} from "lit";
import {customElement, property} from "lit/decorators.js";
import {styleMap} from "lit/directives/style-map.js";

const DATE_TIME_FORMAT = new Intl.DateTimeFormat(navigator.language, {
  month: 'long',
  day: 'numeric',
  year: 'numeric',
})

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
  title: string = '(no title)'

  @property()
  author: string = '(unknown)'

  @property()
  url: string = '#'

  @property()
  published: string = DATE_TIME_FORMAT.format(new Date())

  @property()
  previewImageUrl?: string

  @property()
  textColor: string = '#000000'

  render() {
    const textColor = styleMap({color: `${this.textColor} !important`})
    let styles = {color: this.textColor}

    if (this.previewImageUrl) {
      styles['backgroundImage'] = `url(${this.previewImageUrl})`
    } else {
      styles['border'] = 'solid 1px black';
    }

    const authorSlug = this.author.toLowerCase().replace(/\s+/g, '-')

    return html`
      <div class="article" style="${styleMap(styles)}">
        <h2>
          <a href="${this.url}" style="${textColor}">
            ${this.title}
          </a>
        </h2>
        <h3 class="article-author">
          by
          <a href="/team#${authorSlug}" style="${textColor}">${this.author}</a>
          // ${this.published}
        </h3>
        <slot></slot>
      </div>
    `
  }
}