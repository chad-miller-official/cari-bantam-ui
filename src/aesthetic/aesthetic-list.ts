import {stringify} from 'qs'

import {Aesthetic} from './types'
import {CariPaginator} from '../components/paginator'
import CariSpinner from '../components/spinner'
import {FormValidationError} from '../exception/exception'
import {Page} from '../types'
import {AestheticBlock} from "./components/aesthetic-block"
import InfiniteScroll from "infinite-scroll";
import ChangeEvent = JQuery.ChangeEvent;

declare const apiEndpoint: string
declare const jobExecution: number
declare const totalPages: number

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

const sort = INITIAL_PARAMS.get('sort')
const asc = !INITIAL_PARAMS.has('asc') || INITIAL_PARAMS.get('asc') === 'true'

let sortOrderLabel = SORT_ORDER_LABELS.get(INITIAL_PARAMS.get('sort') || SortField.Name)

function formatQueryParams(query: any): string {
  return stringify(query, {
    allowDots: true,
    arrayFormat: 'indices',
  })
}

function validateAndBuildQueryParams() {
  const sortField = $('#sortField')
  const sortDirection = $('#sortDirection')
  const startEraFilters = $('#startEraFilter')
  const endEraFilters = $('#endEraFilter')
  const keyword = $('#keyword')
  const decade = $('#decade')

  const params = {
    asc: parseInt(sortDirection.val().toString()) === 1,
    sort: sortField.val(),
  }

  const keywordVal = keyword.val().toString()

  if (keywordVal) {
    params['keyword'] = encodeURIComponent(keywordVal)
  }

  const decadeValue = decade.val().toString()

  if (decadeValue !== '0') {
    params['decade'] = parseInt(decadeValue)
  }

  [[startEraFilters, EraField.Start], [endEraFilters, EraField.End]].forEach(tuple => {
    const eraFilters = tuple[0] as JQuery
    const eraField = tuple[1] as EraField

    const errorMessageElem = $(`#${eraField}EraValidationMessage`)
    errorMessageElem.text('')

    const eraBound = parseInt(eraFilters.find(`#${eraField}EraBound`).val().toString()) || 0 as EraBound
    const eraSpecifier0 = parseInt(eraFilters.find(`#${eraField}EraSpecifier0`).val().toString()) || 0
    const eraSpecifier1 = parseInt(eraFilters.find(`#${eraField}EraSpecifier1`).val().toString()) || 0
    const eraYear0 = parseInt(eraFilters.find(`#${eraField}EraYear0`).val().toString()) || 0
    const eraYear1 = parseInt(eraFilters.find(`#${eraField}EraYear1`).val().toString()) || 0

    if (eraBound && eraYear0) {
      const eraParams = [{
        specifier: eraSpecifier0,
        year: eraYear0,
      }]

      if (eraBound === EraBound.Between) {
        if (Boolean(eraYear0) !== Boolean(eraYear1)) {
          throw new FormValidationError(errorMessageElem.get()[0], '"Between" range must have both start and end.')
        } else if (eraYear1) {
          eraParams.push({
            specifier: eraSpecifier1,
            year: eraYear1,
          })
        }
      } else {
        if (eraYear0 === 0) {
          throw new FormValidationError(errorMessageElem.get()[0], 'Year is required.')
        }
      }

      params[`${eraField}Era`] = {
        boundType: eraBound,
        period: eraParams,
      }
    }
  })

  if (jobExecution) {
    params['job'] = jobExecution.toString()
  }

  let serverSideError: FormValidationError = null

  $.ajax(`${apiEndpoint}/validate-query`, {
    async: false,
    data: formatQueryParams(params),
    error: jqXHR => {
      const error = jqXHR.responseJSON
      const errorMessageElem = $(`#${error.data.field.toLowerCase()}EraValidationMessage`)
      serverSideError = new FormValidationError(errorMessageElem.get()[0], error.message)
    }
  })

  if (serverSideError) {
    throw serverSideError
  }

  return params
}

function updateFilters(event: JQuery.Event) {
  event.preventDefault()

  let params: Record<string, any>

  try {
    params = validateAndBuildQueryParams()
  } catch (ex) {
    if (ex instanceof FormValidationError) {
      const errorMessageElem = ex.getTarget()
      errorMessageElem.textContent = ex.message
      errorMessageElem.style['visibility'] = 'visible'
    } else {
      alert(ex.message)
      throw ex
    }

    return
  }

  const query = formatQueryParams(params)
  window.location.assign(`${window.location.pathname}?${query}`)
}

function resetFilters(event: JQuery.Event) {
  let redirectTo = window.location.pathname

  if (jobExecution) {
    redirectTo += `?job=${jobExecution}`
  }

  window.location.assign(redirectTo)
}

function resetSortOrderLabels() {
  $('#sortDirection > option[value=1]').text(sortOrderLabel[0])
  $('#sortDirection > option[value=0]').text(sortOrderLabel[1])
}

function handleSortFieldChange(event: ChangeEvent) {
  sortOrderLabel = SORT_ORDER_LABELS.get(event.target.value || SortField.Name)
  resetSortOrderLabels()
}

function createAestheticBlock(aesthetic: Aesthetic) {
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

  if (aesthetic.isPreview) {
    aestheticBlock.preview = true
    aestheticBlock.jobExecution = jobExecution

    if (aesthetic.importStatusLabel) {
      aestheticBlock.classList.add(`${aesthetic.importStatusLabel.toLowerCase()}-object`, 'aesthetic-job-object')
    }
  }

  return aestheticBlock
}

function handleApiResponse(pageData: Page<Map<string, Aesthetic[]>>): JQuery[] {
  if (pageData.page.totalElements > 0) {
    const groupMap = pageData.content[0]
    const groupKeys = Object.keys(groupMap)

    const firstKey = groupKeys[0]
    const remainingKeys = groupKeys.slice(1)

    const lastKeyHeader = $('#aestheticListContainer > h1:last-of-type')
    let newGroups: JQuery[] = []

    if (firstKey === lastKeyHeader.text()) {
      const aestheticBlocks = groupMap[firstKey].map(createAestheticBlock)
      $('#aestheticListContainer > .aesthetic-list-blocks:last-of-type').append(...aestheticBlocks) // FIXME XXX side effect
    } else {
      const header = $('<h1>').text(firstKey)

      const aestheticBlocksGrid = $('<div>', {"class": "aesthetic-list-blocks"})
      const aestheticBlocks = groupMap[firstKey].map(createAestheticBlock)

      aestheticBlocksGrid.append(...aestheticBlocks)
      newGroups.push(header, $('<hr>'), aestheticBlocksGrid)
    }

    remainingKeys.forEach(key => {
      const header = $('<h1>').text(key)

      const aestheticBlocksGrid = $('<div>', {"class": "aesthetic-list-blocks"})
      const aestheticBlocks = groupMap[key].map(createAestheticBlock)

      aestheticBlocksGrid.append(...aestheticBlocks)
      newGroups.push(header, $('<hr>'), aestheticBlocksGrid)
    })

    return newGroups
  }

  const noResults = $('h3')
  noResults.text('No results match your search criteria.')
  return [noResults]
}

function handleEraSpecifierChange(event: ChangeEvent, yearSelector: JQuery) {
  const value = (event.target as HTMLOptionElement).value

  if (value === '0') {
    yearSelector.val('0')
    yearSelector.prop('disabled', true)
  } else {
    yearSelector.prop('disabled', false)
  }
}

function handleEraBoundChange(event: ChangeEvent, betweenEndRangeContainer: JQuery) {
  const value = parseInt((event.target as HTMLOptionElement).value)
  betweenEndRangeContainer.css('visibility', value === EraBound.Between ? 'visible' : 'hidden')
}

function setupEraFilter(eraField: EraField) {
  const eraFilter = $(`#${eraField}EraFilter`);

  [0, 1].forEach(idx => {
    eraFilter.find(`#${eraField}EraSpecifier${idx}`)
    .on('change', event => {
      const yearSelector = eraFilter.find(`#${eraField}EraYear${idx}`)
      handleEraSpecifierChange(event, yearSelector)
    })
  })

  eraFilter.find(`#${eraField}EraBound`).on('change', event => {
    const betweenEndRangeContainer = eraFilter.find('.between-end-range')
    handleEraBoundChange(event, betweenEndRangeContainer)
  })
}

$(() => {
  const filters = $('#aestheticListFilters')

  filters.on('submit', updateFilters)
  filters.on('reset', resetFilters)

  $('#keyword').val(INITIAL_PARAMS.get('keyword'))

  setupEraFilter(EraField.Start)
  setupEraFilter(EraField.End)

  $('#sortField').on('change', handleSortFieldChange)
  $(`#sortField > option[value=${sort}]`).prop('selected', true)
  $(`#sortDirection > option[value=${asc ? 1 : 0}]`).prop('selected', true)

  resetSortOrderLabels()

  const aestheticListContainer = $('#aestheticListContainer')

  const infScroll = new InfiniteScroll(aestheticListContainer.get()[0], {
    path: () => {
      const infScroll = InfiniteScroll.data('#aestheticListContainer')
      const params = validateAndBuildQueryParams()

      if (infScroll.pageIndex <= totalPages) {
        const options = {
          ...params,
          page: infScroll.pageIndex,
        }

        const query = formatQueryParams(options)
        return `${apiEndpoint}?${query}`
      }
    },
    responseBody: 'json',
    history: false,
  })

  infScroll.on('load', (data: Page<Map<string, Aesthetic[]>>) => {
    const blocks = handleApiResponse(data)
    aestheticListContainer.append(...blocks)
  })
})

export {AestheticBlock, CariPaginator, CariSpinner}