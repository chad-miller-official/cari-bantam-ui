import {AestheticBlock} from "./components/aesthetic-block"
import {ArenaApiResponse, BlockClass, GalleryContent, GalleryImages} from './types'
import Modal from '../components/modal'
import CariModal from '../components/modal'
import {CariPaginator} from '../components/paginator'
import CariSpinner from '../components/spinner'
import axios, {AxiosResponse} from 'axios'
import {css, html, LitElement, TemplateResult} from 'lit'
import {customElement, property, query, state} from 'lit/decorators.js'
import {unsafeHTML} from 'lit-html/directives/unsafe-html.js'
import {styleMap} from 'lit/directives/style-map.js'
import {PageChanged} from "../events";

const maxPageSize = 20
const textBlockPreviewMaxLength = 100

@customElement('aesthetic-gallery')
export class AestheticGallery extends LitElement {
  static styles = css`
    @media screen and (max-width: 959px) {
      .modal-trigger {
        display: none;
      }
    }

    @media screen and (min-width: 960px) {
      .no-modal-trigger {
        display: none;
      }
    }

    @media screen and (max-width: 600px) {
      #contentContainer {
        gap: 3vw;
        grid-template-columns: auto auto;
      }

      .gallery-block {
        height: 40vw;
        width: 40vw;
      }
    }

    @media screen and (min-width: 601px) and (max-width: 959px) {
      #contentContainer {
        gap: 3vw;
        grid-template-columns: auto auto auto auto;
      }

      .gallery-block {
        height: 20vw;
        width: 20vw;
      }
    }

    @media screen and (min-width: 960px) {
      #contentContainer {
        gap: 10px;
        grid-template-columns: auto auto auto auto auto;
      }
    }

    @media screen and (min-width: 960px) and (max-width: 1231px) {
      .gallery-block {
        height: 150px;
        width: 150px;
      }
    }

    @media screen and (min-width: 1232px) {
      .gallery-block {
        height: 200px;
        width: 200px;
      }
    }

    #contentContainer {
      display: grid;
      justify-content: center;
    }

    #modalCaption {
      align-items: flex-end;
      display: flex;
      flex-direction: column;
      flex-grow: 2;
      gap: 20px;
    }

    #modalCaption button {
      font-size: 1em;
      height: 2em;
    }

    .gallery-block {
      background-position: center;
      background-size: cover;
      cursor: pointer;
    }

    .text-block {
      overflow: scroll;
      padding: 0 8px 8px 0;
    }

    figcaption {
      display: flex;
      flex-direction: column;
      gap: 4px;
      max-height: 80vh;
      max-width: 15vw;
      overflow: scroll;
      overflow-wrap: anywhere;
      padding: 0 8px 8px 0;
      width: auto;
    }

    figure {
      background-color: white;
      display: grid;
      grid-template-columns: auto auto;
      grid-column-gap: 24px;
      margin: 0;
      padding: 24px;
    }

    figure > :first-child {
      max-height: 80vh;
      max-width: 80vw;
    }

    figure > :first-child img {
      max-height: 100%;
      max-width: 100%;
      width: 100%;
    }
  `

  @property()
  mediaSourceUrl: string

  @query('#paginator')
  paginator: CariPaginator

  @query('#modal')
  modal: CariModal

  @state()
  galleryContent: GalleryContent[] = []

  @state()
  modalContent: GalleryContent

  openBlock(block: GalleryContent) {
    this.modalContent = block
    this.modal.open = true
  }

  buildBlock(block: GalleryContent): TemplateResult {
    const blockClass = block.class

    if (blockClass === BlockClass.Link || blockClass === BlockClass.Image || blockClass ===
        BlockClass.Media) {
      const style = styleMap({'background-image': `url(${block.image.square.url})`})

      return html`
        <div style=${style} class="gallery-block modal-trigger"
             @click=${() => this.openBlock(block)}></div>
        <a href=${block.source?.url || block.image.original.url} class="no-modal-trigger"
           target="_blank" rel="noopener noreferrer">
          <div style=${style} class="gallery-block"></div>
        </a>`
    } else if (blockClass === BlockClass.Text) {
      const blockContent = block.content

      const contentPreview = html`
        <p>
          ${blockContent.length >= textBlockPreviewMaxLength ?
              blockContent.substring(0, textBlockPreviewMaxLength - 3) + '...' : blockContent}
        </p>`

      return html`
        <div class="gallery-block modal-trigger" @click=${() => this.openBlock(block)}>
          ${contentPreview}
        </div>
        <div class="gallery-block no-modal-trigger">
          ${contentPreview}
        </div>`
    } else if (blockClass === BlockClass.Attachment) {
      const blockImage: GalleryImages = block.image

      if (blockImage) {
        const style = styleMap({'background-image': `url(${blockImage.square.url})`})

        if (block.attachment.content_type.split('/')[0] === 'video') {
          return html`
            <div style=${style} class="gallery-block modal-trigger"
                 @click=${() => this.openBlock(block)}></div>
            <a href=${block.attachment.url} class="no-modal-trigger" target="_blank"
               rel="noopener noreferrer">
              <div style=${style} class="gallery-block"></div>
            </a>`
        } else {
          return html`
            <a href=${block.attachment.url} target="_blank" rel="noopener noreferrer">
              <div style=${style} class="gallery-block"></div>
            </a>`
        }
      } else {
        const preview = html`
          <h3>
            No Preview
            <br/>
            ${block.attachment.content_type}
          </h3>`

        return html`
          <div class="gallery-block modal-trigger" @click=${() => this.openBlock(block)}>
            ${preview}
          </div>
          <a href=${block.attachment.url} class="no-modal-trigger" target="_blank"
             rel="noopener noreferrer">
            <div class="gallery-block">
              ${preview}
            </div>
          </a>`
      }
    } else {
      const preview = html`
        <h3>
          No Preview
          <br/>
          ${blockClass}
        </h3>`

      return html`
        <div class="gallery-block modal-trigger" @click=${() => this.openBlock(block)}>
          ${preview}
        </div>
        <div class="gallery-block no-modal-trigger">
          ${preview}
        </div>`
    }
  }

  connectedCallback() {
    super.connectedCallback()

    axios.get<ArenaApiResponse>(`${this.mediaSourceUrl}?page=1&per=${maxPageSize}`)
    .then((res: AxiosResponse<ArenaApiResponse>) => {
      const responseData: ArenaApiResponse = res.data
      this.galleryContent = responseData.contents
      this.paginator.pageCount = (Math.floor(responseData.length / maxPageSize) + 1)
    })
  }

  onPageChanged(event: CustomEvent<PageChanged>) {
    this.galleryContent = []

    axios.get<ArenaApiResponse>(`${this.mediaSourceUrl}?page=${event.detail.newPage}&per=${maxPageSize}`)
    .then((res: AxiosResponse<ArenaApiResponse>) => this.galleryContent = res.data.contents)
  }

  closeModal() {
    this.modalContent = undefined
  }

  renderModalContent(): TemplateResult<1> {
    if (this.modalContent) {
      const blockClass = this.modalContent.class

      if (blockClass === BlockClass.Link || blockClass == BlockClass.Image) {
        const image = this.modalContent.image

        return html`
          <a href=${this.modalContent.source?.url || image.original.url} target="_blank"
             rel="noopener noreferrer">
            <img alt=${this.modalContent.description} src=${image.display.url}/>
          </a>`
      } else if (blockClass === BlockClass.Attachment) {
        const attachment = this.modalContent.attachment
        const contentType = attachment.content_type
        const contentTypeParts = contentType.split('/')

        if (contentTypeParts[0] === 'video') {
          return html`
            <video autoplay controls muted>
              <source src=${attachment.url}/>
              Your browser does not support video playback.
            </video>`
        } else {
          return html`<p>This media type is not yet supported.</p>`
        }
      } else if (blockClass === BlockClass.Media) {
        return html`${unsafeHTML(this.modalContent.embed.html)}`
      } else if (blockClass === BlockClass.Text) {
        return html`
          <div class="text-block">${unsafeHTML(this.modalContent.content_html)}</div>`
      } else {
        return html`<p>This media type is not yet supported.</p>`
      }
    }

    return null
  }

  render() {
    let content: TemplateResult | CariSpinner

    if (this.galleryContent.length > 0) {
      content = html`
        <div id="contentContainer">
          ${this.galleryContent.map((block: GalleryContent) => this.buildBlock(block))}
        </div>`
    } else {
      content = new CariSpinner()
    }

    const title = this.modalContent?.title
    const description = this.modalContent?.description_html

    return html`
      ${content}
      <cari-paginator id="paginator" @pagechanged=${this.onPageChanged}></cari-paginator>
      <cari-modal id="modal" @modalclosed=${this.closeModal}>
        <figure>
          ${this.renderModalContent()}
          <figcaption>
            <div>
              <strong>Title</strong>
              <p>${title ? unsafeHTML(title) : '(untitled)'}</p>
            </div>
            <div>
              <strong>Description</strong>
              ${description ? unsafeHTML(description) : html`<p>(no description)</p>`}
            </div>
          </figcaption>
        </figure>
      </cari-modal>`
  }
}

export {AestheticBlock, CariPaginator, CariSpinner, Modal}