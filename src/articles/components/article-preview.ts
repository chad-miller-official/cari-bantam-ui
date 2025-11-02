import {css, html, LitElement} from "lit";
import {customElement, property} from "lit/decorators.js";
import {styleMap} from "lit/directives/style-map.js";
import {dateToString} from "../../util";

@customElement('article-preview')
export class ArticlePreview extends LitElement {

  static styles = css`
    @media screen and (max-width: 840px) {
      .article-preview {
        h2, h3 {
          width: 50%;
        }
      }

      .article-summary {
        background-color: rgba(233, 233, 233, 0.8);
        border-radius: 8px;
        font-size: xx-small;
        padding: 4px;
        -webkit-line-clamp: 3;
      }
    }

    @media screen and (min-width: 841px) and (max-width: 1199px) {
      .article-summary {
        font-size: x-small;
        -webkit-line-clamp: 5;
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

    .article-summary {
      display: -webkit-box;
      font-size: smaller;
      overflow: hidden;
      text-overflow: ellipsis;
      -webkit-box-orient: vertical;
    }

    .article-title {
      margin-block-end: 9px;
    }

    a {
      color: black;
    }

    p {
      margin-block-end: 0;
      margin-block-start: 0;
    }
  `

  @property()
  title: string = '(no title)'

  @property()
  author?: string

  @property()
  url: string = '#'

  @property()
  published: string = dateToString(new Date())

  @property()
  previewImageUrl?: string

  @property()
  backgroundColor: string = '#ffffff'

  render() {
    const styles = {}

    if (this.previewImageUrl) {
      styles['backgroundImage'] = `linear-gradient(to right, ${this.backgroundColor}e0 40%, transparent 75%), url(${this.previewImageUrl})`
    } else {
      styles['border'] = 'solid 1px black';
    }

    return html`
      <a href="${this.url}" class="article" style="${styleMap(styles)}">
        <div class="article-preview">
          <h2 class="article-title">${this.title}</h2>
          <h4 class="article-author">by ${this.author || '(unknown)'}</h4>
          <h5 class="article-author">${this.published}</h5>
          <div class="article-summary">
            <slot></slot>
          </div>
        </div>
      </a>
    `
  }
}