import {css, html, LitElement} from "lit";
import {customElement, property} from "lit/decorators.js";
import {styleMap} from "lit/directives/style-map.js";
import {dateToString} from "../../util";

@customElement('article-preview')
export class ArticlePreview extends LitElement {

  static styles = css`
    @media screen and (max-width: 840px) {
      .article {
        background-image: initial !important;
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
      padding: 1em 2em;
      text-decoration: none;
    }

    .article-glow:hover {
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

    slot[name=summary] {
      font-size: smaller;
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

  @property()
  hoverEffect: string = 'glow'

  render() {
    const styles = {backgroundColor: this.backgroundColor}

    if (this.previewImageUrl) {
      styles['backgroundImage'] = `linear-gradient(to right, ${this.backgroundColor}e0 40%, transparent 75%), url(${this.previewImageUrl})`
      styles['color'] = this.textColor
    } else if (this.backgroundColor.toLowerCase() === '#ffffff') {
      styles['border'] = 'solid 1px black';
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

    const hoverEffectClass = (this.hoverEffect == null || this.hoverEffect == 'none') ? '' : `article-${this.hoverEffect}`

    if (this.url) {
      return html`
        <a href="${this.url}" class="article ${hoverEffectClass}" style="${styleMap(styles)}">
          ${articlePreview}
        </a>
      `
    } else {
      return html`
        <div class="article ${hoverEffectClass}" style="${styleMap(styles)}">
          ${articlePreview}
        </div>`
    }
  }
}