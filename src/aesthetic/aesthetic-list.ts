import axios, {AxiosResponse} from 'axios'
import {stringify} from 'qs'

import {Aesthetic} from './types'
import {CariPaginator} from '../components/paginator'
import CariSpinner from '../components/spinner'
import {FormValidationError} from '../exception/exception'
import {Page} from '../types'
import {AestheticBlock} from "./components/aesthetic-block"
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
let currentPage = parseInt(INITIAL_PARAMS.get('page')) || 0

function formatQueryParams(query: any): string {
  return stringify(query, {
    allowDots: true,
    arrayFormat: 'indices',
  })
}

function validateAndBuildQueryParams(newPage: number): Record<string, any> {
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

  if (newPage !== 0) {
    params['page'] = newPage
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

  return params
}

function callApi(newPage: number, reset: boolean): Record<string, any> {
  let params: Record<string, any>

  if (newPage >= totalPages) {
    return
  }

  try {
    params = validateAndBuildQueryParams(newPage)
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

  if (jobExecution) {
    params['job'] = jobExecution.toString()
  }

  const options = {
    params,
    paramsSerializer: formatQueryParams
  }

  const aestheticListBlocks = $('#aestheticListBlocks')

  const spinner = new CariSpinner()
  spinner.id = 'spinner'
  spinner.classList.add('span-all-columns')

  if (reset) {
    aestheticListBlocks.find('*').remove()
  }

  aestheticListBlocks.append(spinner)

  axios.get<Page<Aesthetic>>(apiEndpoint, options)
  .then((res: AxiosResponse<Page<Aesthetic>>) => {
    const pageData = res.data

    aestheticListBlocks.find('#spinner').remove()

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

        if (aesthetic.isPreview) {
          aestheticBlock.preview = true
          aestheticBlock.jobExecution = jobExecution

          if (aesthetic.importStatusLabel) {
            aestheticBlock.classList.add(`${aesthetic.importStatusLabel.toLowerCase()}-object`, 'aesthetic-job-object')
          }
        }

        return aestheticBlock
      })

      aestheticListBlocks.append(...newBlocks)
    } else {
      const noResults = document.createElement('h3')
      noResults.textContent = 'No results match your search criteria.'
      aestheticListBlocks.append(noResults)
    }
  })
  .catch(err => {
    const error = err.response.data
    const errorMessageElem = $(`#${(error.data.field).toLowerCase()}EraValidationMessage`)
    errorMessageElem.text(error.message)
    errorMessageElem.css('visibility', 'visible')
  })

  return params
}

function updateQuery(params: Record<string, any>) {
  if (Object.keys(params)) {
    const search = formatQueryParams(params)
    let urlWithParams = window.location.pathname.concat(`?${search}`)
    window.history.pushState(params, '', urlWithParams)
  }
}

function updateFilters(event: JQuery.Event) {
  event.preventDefault()
  const params = callApi(0, true)
  updateQuery(params)
}

function resetFilters(event: JQuery.Event) {
  event.preventDefault()

  const sortField = $('#sortField')
  const sortDirection = $('#sortDirection')
  const startEraFilters = $('#startEraFilter')
  const endEraFilters = $('#endEraFilter')
  const keyword = $('#keyword')
  const decade = $('#decade')

  keyword.val('');

  [[startEraFilters, EraField.Start], [endEraFilters, EraField.End]].forEach(eraTuple => {
    const eraFilters = eraTuple[0] as JQuery
    const eraField = eraTuple[1] as EraField;

    [0, 1].forEach(idx => {
      (eraFilters.find(`#${eraField}EraSpecifier${idx}`)).val('0');

      const yearSelector = eraFilters.find(`#${eraField}EraYear${idx}`)
      yearSelector.val('0')
      yearSelector.prop('disabled', true)
    });

    eraFilters.find(`#${eraField}EraBound`).val(EraBound.Between.toString())
    eraFilters.find('.between-end-range').css('visibility', 'visible')

    const validationMessage = $(`${eraField}EraValidationMessage`)
    validationMessage.text('')
    validationMessage.css('visibility', 'hidden')
  });

  decade.val('0')
  sortField.val(SortField.Name)
  sortDirection.val('1')

  currentPage = 0
  const params = callApi(0, true)

  updateQuery(params)
}

function handleEraBoundChange(event: ChangeEvent, betweenEndRangeContainer: JQuery) {
  const value = parseInt((event.target as HTMLOptionElement).value)
  betweenEndRangeContainer.css('visibility', value === EraBound.Between ? 'visible' : 'hidden')
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

function setupEraFilter(eraFilter: JQuery, eraField: EraField) {
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

function handleSortFieldChange(event: ChangeEvent) {
  sortOrderLabel = SORT_ORDER_LABELS.get(event.target.value || SortField.Name)
}

function onPageChanged() {
  if ($(window).scrollTop() + $(window).height() == $(document).height()) {
    currentPage++
    callApi(currentPage, false)
  }
}

$(() => {
  const filters = $('#aestheticListFilters')

  filters.on('submit', updateFilters)
  filters.on('reset', resetFilters)

  $('#keyword').val(INITIAL_PARAMS.get('keyword'))

  const startEraFilters = $('#startEraFilter')
  const endEraFilters = $('#endEraFilter')

  setupEraFilter(startEraFilters, EraField.Start)
  setupEraFilter(endEraFilters, EraField.End)

  $('#sortField').on('change', handleSortFieldChange)
  $(`#sortField > option[value=${sort}]`).prop('selected', true)

  $(`#sortDirection > option[value=${asc ? 1 : 0}]`).prop('selected', true)

  $('#sortDirection > option[value=1]').text(sortOrderLabel[0])
  $('#sortDirection > option[value=0]').text(sortOrderLabel[1])

  $(window).on('scroll', onPageChanged)
})

export {AestheticBlock, CariPaginator, CariSpinner}