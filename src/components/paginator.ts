import {css, html, LitElement, TemplateResult} from 'lit'
import {customElement, property} from 'lit/decorators.js'
import {PageChanged} from "../events";

const dummy = html`<li>...</li>`

@customElement('cari-paginator')
export class CariPaginator extends LitElement {
  static styles = css`
    li {
      font-size: 1.1em;
      height: 2em;
    }
    
    li button {
      font-size: 1.1em;
    }

    ol {
      align-items: baseline;
      display: flex;
      gap: 3px;
      list-style-type: none;
      margin: 32px auto 24px;
      padding-inline-start: 0;
      width: fit-content;
    }
  `

  @property({type: Number})
  pageCount = 1

  @property({type: Number})
  currentPage = 1

  render(): TemplateResult<1> {
    const numbers = [...Array(this.pageCount).keys()].map(logicalPageNum => {
      const physicalPageNum = logicalPageNum + 1

      return html`
        <li>
          <button ?disabled=${this.currentPage === physicalPageNum}
              @click=${() => this.currentPage !== physicalPageNum &&
                  this.handlePageChange(physicalPageNum)}>${physicalPageNum}</button>
        </li>`
    })

    let numbersToDisplay: TemplateResult<1>[]

    if (this.pageCount <= 5) {
      numbersToDisplay = numbers
    } else {
      numbersToDisplay = [numbers[0]]

      if (this.currentPage <= 3) {
        numbersToDisplay.push(...numbers.slice(1, this.currentPage + 1))
        numbersToDisplay.push(dummy)
      } else if (this.currentPage >= this.pageCount - 2) {
        numbersToDisplay.push(dummy)
        numbersToDisplay.push(...numbers.slice(this.currentPage - 2, this.pageCount - 1))
      } else {
        numbersToDisplay.push(dummy)
        numbersToDisplay.push(numbers[this.currentPage - 2])
        numbersToDisplay.push(numbers[this.currentPage - 1])
        numbersToDisplay.push(numbers[this.currentPage])
        numbersToDisplay.push(dummy)
      }

      numbersToDisplay.push(numbers[numbers.length - 1])
    }

    return html`
      <ol>
        <li>
          <button ?disabled=${this.currentPage === 1}
              @click=${() => this.currentPage > 1 && this.handlePageChange(this.currentPage - 1)}>Prev</button>
        </li>
        ${numbersToDisplay}
        <li>
          <button ?disabled=${this.currentPage === this.pageCount}
              @click=${() => this.currentPage < this.pageCount &&
                  this.handlePageChange(this.currentPage + 1)}>Next</button>
        </li>
      </ol>`
  }

  handlePageChange(newPage: number) {
    this.currentPage = newPage
    this.dispatchEvent(new CustomEvent<PageChanged>('pagechanged', {detail: {newPage}}))
  }
}