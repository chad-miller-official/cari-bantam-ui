import axios, {AxiosResponse} from 'axios'
import {css, html, LitElement} from 'lit'
import {customElement, property, query, queryAssignedElements, state} from 'lit/decorators.js'
import {styleMap} from 'lit/directives/style-map.js'
import {stringify} from 'qs'

import {Aesthetic} from './types'
import {CariPaginator} from '../components/paginator'
import CariSpinner from '../components/spinner'
import {FormValidationError} from '../exception/exception'
import {Page} from '../types'
import {PageChanged} from "../events"
import {AestheticBlock} from "./components/aesthetic-block"

enum EraBound {
  After = 1,
  Before = 2,
  Between = 3,
}

enum EraField {
  Start = 'start',
  End = 'end',
}

enum SortField {
  Name = 'name',
  StartEra = 'startEra',
  EndEra = 'endEra',
  Decade = 'decade',
}

const SORT_ORDER_LABELS = new Map<string, string[]>([
  [SortField.Name, ['A-Z', 'Z-A']],
  [SortField.StartEra, ['Earliest to Latest', 'Latest to Earliest']],
  [SortField.EndEra, ['Earliest to Latest', 'Latest to Earliest']],
  [SortField.Decade, ['Earliest to Latest', 'Latest to Earliest']]
])

const INITIAL_PARAMS = new URLSearchParams(window.location.search)

function formatQueryParams(query: any): string {
  return stringify(query, {
    allowDots: true,
    arrayFormat: 'indices',
  })
}

@customElement('aesthetic-list-paginator')
export class AestheticListPaginator extends LitElement {
  static styles = css`
    @media screen and (max-width: 1231px) {
      #aestheticBlocks {
        gap: 3vw;
      }

      form {
        display: none;
      }
    }

    @media screen and (max-width: 600px) {
      #aestheticBlocks {
        grid-template-columns: auto auto;
      }
    }

    @media screen and (min-width: 601px) and (max-width: 959px) {
      #aestheticBlocks {
        grid-template-columns: auto auto auto auto;
      }
    }

    @media screen and (min-width: 960px) {
      #aestheticBlocks {
        grid-gap: 15px;
        grid-template-columns: auto auto auto auto auto;
      }
    }

    @media screen and (min-width: 1232px) {
      form {
        display: flex;
        padding: 0 16px 16px 16px;
      }
    }

    button {
      height: 2em;
    }

    div {
      align-items: center;
      display: flex;
      gap: 6px;
    }

    div :not(label) {
      flex-grow: 1;
    }

    fieldset {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 14px;
    }

    fieldset, input, select {
      border: #cdcdcd 1px solid;
    }

    input, select {
      background-color: #fdfdfd;
      padding: 4px;
    }

    .validation-message {
      color: red;
    }

    #aestheticBlocks {
      display: grid;
      justify-content: center;
    }

    #filtersFieldset {
      width: 70%;
    }

    #endEraValidationErrorMessage, #startEraValidationErrorMessage {
      color: red;
    }

    #sortFieldset {
      justify-content: space-between;
      width: 30%;
    }

    #sortInputs {
      align-items: stretch;
      display: flex;
      flex-direction: column;
    }
  `

  @property({type: Number})
  pageCount: number

  @property()
  specifierEraYearMapPropertyName: string

  @property()
  sortOrderLabel: string[]

  @property()
  apiEndpoint: string

  @property()
  jobExecution?: number

  @query('#keyword')
  keyword: HTMLInputElement

  @query('#startEraValidationMessage')
  startEraValidationMessage: HTMLSpanElement

  @query('#endEraValidationMessage')
  endEraValidationMessage: HTMLSpanElement

  @query('#sortField')
  sortField: HTMLSelectElement

  @query('#sortDirection')
  sortDirection: HTMLSelectElement

  @query('#paginator')
  paginator: CariPaginator

  @queryAssignedElements({slot: 'startEraFilter'})
  startEraFilters: HTMLElement[]

  @queryAssignedElements({slot: 'endEraFilter'})
  endEraFilters: HTMLElement[]

  @queryAssignedElements({slot: 'decadeFilter'})
  decadeFilter: HTMLElement[]

  @queryAssignedElements({slot: 'aestheticBlocks'})
  aestheticBlocks: HTMLElement[]

  @state()
  searchPerformed = false

  connectedCallback() {
    super.connectedCallback()
    this.sortOrderLabel = SORT_ORDER_LABELS.get(INITIAL_PARAMS.get('sort') || SortField.Name)
  }

  validateAndBuildQueryParams(newPage: number): Record<string, any> {
    const params = {
      asc: parseInt(this.sortDirection.value) === 1,
      sort: this.sortField.value,
    }

    if (newPage !== 0) {
      params['page'] = newPage
    }

    const keyword = this.keyword.value

    if (keyword) {
      params['keyword'] = encodeURIComponent(keyword)
    }

    const decade = (this.decadeFilter[0].querySelector('#decade') as HTMLSelectElement).value

    if (decade !== '0') {
      params['decade'] = parseInt(decade)
    }

    [[this.startEraFilters[0], EraField.Start], [this.endEraFilters[0], EraField.End]].forEach(tuple => {
      const eraFilters = tuple[0] as HTMLElement
      const eraField = tuple[1]

      const errorMessageElem = this[`${eraField}EraValidationMessage`]
      errorMessageElem.textContent = ''

      const eraBound = parseInt((eraFilters.querySelector(
          `#${eraField}EraBound`) as HTMLSelectElement).value) || 0 as EraBound

      const eraSpecifier0 = parseInt((eraFilters.querySelector(
          `#${eraField}EraSpecifier0`) as HTMLSelectElement).value) || 0

      const eraSpecifier1 = parseInt((eraFilters.querySelector(
          `#${eraField}EraSpecifier1`) as HTMLSelectElement).value) || 0

      const eraYear0 = parseInt((eraFilters.querySelector(
          `#${eraField}EraYear0`) as HTMLSelectElement).value) || 0

      const eraYear1 = parseInt((eraFilters.querySelector(
          `#${eraField}EraYear1`) as HTMLSelectElement).value) || 0

      if (eraBound && eraYear0) {
        const eraParams = [{
          specifier: eraSpecifier0,
          year: eraYear0,
        }]

        if (eraBound === EraBound.Between) {
          if (Boolean(eraYear0) !== Boolean(eraYear1)) {
            throw new FormValidationError(errorMessageElem, '"Between" range must have both start and end.')
          } else if (eraYear1) {
            eraParams.push({
              specifier: eraSpecifier1,
              year: eraYear1,
            })
          }
        } else {
          if (eraYear0 === 0) {
            throw new FormValidationError(errorMessageElem, 'Year is required.')
          }
        }

        params[`${eraField}Era`] = {
          boundType: eraBound,
          period: eraParams,
        }
      }
    })

    return params
  }

  callApi(newPage: number, doUpdatePageCount: boolean) {
    let params: Record<string, any>

    try {
      params = this.validateAndBuildQueryParams(newPage)
    } catch (ex) {
      if (ex instanceof FormValidationError) {
        const errorMessageElem = ex.getTarget()
        errorMessageElem.textContent = ex.message
        errorMessageElem.style['visibility'] = 'visible'
      } else {
        alert(ex.message)
      }

      return
    }

    if (this.jobExecution) {
      params['job'] = this.jobExecution.toString()
    }

    const options = {
      params,
      paramsSerializer: formatQueryParams
    }

    axios.get<Page<Aesthetic>>(this.apiEndpoint, options)
    .then((res: AxiosResponse<Page<Aesthetic>>) => {
      const pageData = res.data

      const aestheticBlocksSlot = document.getElementById(this.id)
      aestheticBlocksSlot.querySelectorAll('[slot="aestheticBlocks"]').forEach(elem => elem.remove())

      if (pageData.page.totalElements > 0) {
        const newBlocks = pageData.content.map(aesthetic => {
          const aestheticBlock = new AestheticBlock()
          aestheticBlock.urlSlug = aesthetic.urlSlug
          aestheticBlock.displayImageUrl = aesthetic.displayImageUrl
          aestheticBlock.name = aesthetic.name

          if (aesthetic.startYear) {
            aestheticBlock.startYear = aesthetic.startYear
          }

          if (aesthetic.endYear) {
            aestheticBlock.endYear = aesthetic.endYear
          }

          aestheticBlock.setAttribute('slot', 'aestheticBlocks')

          if (aesthetic.isPreview) {
            aestheticBlock.preview = true
            aestheticBlock.jobExecution = this.jobExecution

            if (aesthetic.importStatusLabel) {
              aestheticBlock.classList.add(`${aesthetic.importStatusLabel.toLowerCase()}-object`, 'aesthetic-job-object')
            }
          }

          return aestheticBlock
        })

        aestheticBlocksSlot.append(...newBlocks)
      } else {
        const noResults = document.createElement('h3')
        noResults.textContent = 'No results match your search criteria.'
        noResults.setAttribute('slot', 'aestheticBlocks')
        aestheticBlocksSlot.append(noResults)
      }

      if (doUpdatePageCount) {
        this.paginator.pageCount = pageData.page.totalPages
        this.paginator.currentPage = 1
      }

      if (Object.keys(params)) {
        const search = formatQueryParams(params)
        let urlWithParams = window.location.pathname.concat(`?${search}`)
        window.history.pushState(params, '', urlWithParams)
      }
    })
    .catch(err => {
      const error = err.response.data
      const errorMessageElem = this[`${(error.data.field as string).toLowerCase()}EraValidationMessage`]
      errorMessageElem.textContent = error.message
      errorMessageElem.style['visibility'] = 'visible'
    })
  }

  updateFilters(event: Event) {
    event.preventDefault()
    this.searchPerformed = true
    this.callApi(0, true)
  }

  resetFilters(event: Event) {
    event.preventDefault()

    this.searchPerformed = true
    this.keyword.value = '';

    [[this.startEraFilters[0], EraField.Start], [this.endEraFilters[0], EraField.End]].forEach(eraTuple => {
      const eraFilters = eraTuple[0] as HTMLElement
      const eraField = eraTuple[1];

      [0, 1].forEach(idx => {
        (eraFilters.querySelector(`#${eraField}EraSpecifier${idx}`) as HTMLSelectElement).value =
            '0';

        const yearSelector = eraFilters.querySelector(`#${eraField}EraYear${idx}`) as HTMLSelectElement
        yearSelector.value = '0'
        yearSelector.disabled = true
      });

      (eraFilters.querySelector(`#${eraField}EraBound`) as HTMLSelectElement).value =
          EraBound.Between.toString();

      (eraFilters.querySelector('.between-end-range') as HTMLElement).style['visibility'] =
          'visible'
    });

    (this.decadeFilter[0].querySelector('#decade') as HTMLSelectElement).value = '0'
    this.sortField.value = SortField.Name
    this.sortDirection.value = '1'

    this.callApi(0, true)
  }

  handleEraBoundChange(event: Event, betweenEndRangeContainer: HTMLDivElement) {
    const value = parseInt((event.target as HTMLOptionElement).value)
    betweenEndRangeContainer.style['visibility'] = value === EraBound.Between ? 'visible' : 'hidden'
  }

  handleEraSpecifierChange(event: Event, yearSelector: HTMLSelectElement) {
    const value = (event.target as HTMLOptionElement).value

    if (value === '0') {
      yearSelector.value = '0'
      yearSelector.disabled = true
    } else {
      yearSelector.disabled = false
    }
  }

  handleSortFieldChange(event) {
    this.sortOrderLabel = SORT_ORDER_LABELS.get(event.target.value || SortField.Name)
  }

  onPageChanged(pageChangedEvent: CustomEvent<PageChanged>) {
    this.callApi(pageChangedEvent.detail.newPage - 1, false)
  }

  onEraFilterSlotChange(eraFilter: HTMLElement, eraField: EraField) {
    [0, 1].forEach(idx => {
      eraFilter.querySelector(`#${eraField}EraSpecifier${idx}`)
      .addEventListener('change', event => {
        const yearSelector = eraFilter.querySelector(
            `#${eraField}EraYear${idx}`) as HTMLSelectElement

        this.handleEraSpecifierChange(event, yearSelector)
      })
    })

    eraFilter.querySelector(`#${eraField}EraBound`).addEventListener('change', event => {
      const betweenEndRangeContainer = eraFilter.querySelector(
          '.between-end-range') as HTMLDivElement

      this.handleEraBoundChange(event, betweenEndRangeContainer)
    })
  }

  render() {
    const visibilityHidden = styleMap({visibility: 'hidden'})

    const currentPage = (parseInt(INITIAL_PARAMS.get('page')) || 0) + 1
    const sort = INITIAL_PARAMS.get('sort')
    const asc = !INITIAL_PARAMS.has('asc') || INITIAL_PARAMS.get('asc') === 'true'

    const blocksPlaceholder = this.searchPerformed ? new CariSpinner() : html`<h3>No results match
      your search criteria.</h3>`

    return html`
      <form id="filters" @submit=${this.updateFilters} @reset=${this.resetFilters}>
        <fieldset id="filtersFieldset">
          <legend>Search and filter by...</legend>
          <div>
            <label for="keyword">Keyword</label>
            <input type="text" name="keyword" id="keyword" placeholder="global, pastel, etc."
                   value=${INITIAL_PARAMS.get('keyword')}>
          </div>
          <slot name="startEraFilter"
                @slotchange=${() => this.onEraFilterSlotChange(this.startEraFilters[0],
                    EraField.Start)}></slot>
          <span id="startEraValidationMessage" class="validation-message"
                style=${visibilityHidden}></span>
          <slot name="endEraFilter"
                @slotchange=${() => this.onEraFilterSlotChange(this.endEraFilters[0],
                    EraField.End)}></slot>
          <span id="endEraValidationMessage" class="validation-message"
                style=${visibilityHidden}></span>
          <slot name="decadeFilter"></slot>
        </fieldset>
        <fieldset id="sortFieldset">
          <legend>Sort and order by...</legend>
          <div id="sortInputs">
            <div>
              <label for="sortField">Sort by</label>
              <select name="sortField" id="sortField" @change=${this.handleSortFieldChange}>
                <option value="name" ?selected=${sort == SortField.Name}>Name</option>
                <option value="startEra" ?selected=${sort == SortField.StartEra}>
                  Earliest Known Example
                </option>
                <option value="endEra" ?selected=${sort == SortField.EndEra}>
                  End of Popularity
                </option>
                <option value="decade" ?selected=${sort == SortField.Decade}>
                  Relevant Decade
                </option>
              </select>
            </div>
            <div>
              <label for="sortDirection">Order</label>
              <select name="sortDirection" id="sortDirection">
                <option value="1" ?selected=${asc}>${this.sortOrderLabel[0]}</option>
                <option value="0" ?selected=${!asc}>${this.sortOrderLabel[1]}</option>
              </select>
            </div>
          </div>
          <div>
            <button type="reset">
              <slot name="resetFiltersText"></slot>
            </button>
            <button type="submit">
              <slot name="searchText"></slot>
            </button>
          </div>
        </fieldset>
      </form>
      <slot name="aestheticBlocks" id="aestheticBlocks">
        ${blocksPlaceholder}
      </slot>
      <cari-paginator id="paginator" pageCount=${this.pageCount}
                      @pagechanged=${this.onPageChanged}
                      currentPage=${currentPage}></cari-paginator>`
  }
}

export {AestheticBlock, CariPaginator, CariSpinner}