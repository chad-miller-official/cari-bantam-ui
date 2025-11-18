import {ArticlePreview} from "../../articles/components/article-preview";
import {dateToString, invertColor} from "../../util";
import {FullscreenSpinner} from "../../components/spinner";
import {RedirectResponse, ValidationException} from "../types";
import axios, {AxiosResponse} from "axios";
import {Csrf} from "../../types";

declare const _csrf: Csrf

declare const originalAuthor: string
declare const originalAuthorName: string
declare const originalPublished: string
declare const originalPublishedString: string

export const FILE_MAX_SIZE = '10MB'

export enum SubmitMode {
  SAVE = 'SAVE',
  PUBLISH = 'PUBLISH',
}

export enum ArticleType {
  SELF_HOSTED = 'SELF_HOSTED',
  OFF_SITE = 'OFF_SITE'
}

let changeDetected = false

export class ArticleSetupObject {
  submitButton: JQuery<HTMLButtonElement>
  type: ArticleType

  constructor(submitButtonSelector: string) {
    this.submitButton = $(submitButtonSelector)
  }

  protected shouldEnableSubmitButton(): boolean {
    return Boolean(
        getArticlePreviewComponent().previewImageUrl
        && $('#published').val()
        && $('#titleEditor').text()
        && $('#summaryEditor').text()
        && (parseInt($('#author').val().toString()) > 0
            || $('#authorOverride').val()))
  }

  public disableSubmitButton() {
    this.submitButton.attr('disabled', 'disabled')
  }

  public toggleSubmitButton() {
    if (this.shouldEnableSubmitButton()) {
      this.submitButton.removeAttr('disabled')
      this.submitButton.removeProp('disabled')
    } else {
      this.disableSubmitButton()
    }
  }

  public async allocatePk() {
    const pkArticle = $('#article')

    if (!pkArticle.val()) {
      const axiosData = {[_csrf.parameterName]: _csrf.token}

      const axiosConfig = {
        withCredentials: true,
        xsrfHeaderName: _csrf.headerName,
        headers: {[_csrf.headerName]: _csrf.token},
      }

      const allocateIdResponse: AxiosResponse<number> = await axios.post<number>(`/api/cms/articles/allocate-id?type=${this.type}`, axiosData, axiosConfig)
      pkArticle.val(allocateIdResponse.data)
    }
  }

  public saveArticle() {
    $('#articleForm').trigger('submit', {
      mode: SubmitMode.SAVE,
      onSuccess: () => {
        changeDetected = false

        $('#saveButton').attr('disabled', 'disabled')
        $('#saveMessage').css('display', 'initial');

        ($('fullscreen-spinner').get(0) as FullscreenSpinner).close()
      },
    })
  }

  public publishArticle() {
    $('#articleForm').trigger('submit', {
      mode: SubmitMode.PUBLISH,
      onSuccess: (res: RedirectResponse) => window.location.href = res.redirectTo
    })
  }

  public validate(): boolean {
    let valid = true

    const previewImage = $('#previewImage')
    const previewImageInput = previewImage.get(0) as HTMLInputElement

    if (!previewImageInput.validity.valid) {
      previewImage.siblings('.validation-message')
      .css('display', 'initial')
      .text('Preview image is required.')

      valid = false
    }

    const titleEditor = $('#titleEditor')

    if (!titleEditor.text()) {
      titleEditor.siblings('.validation-message').css('display', 'initial')
      valid = false
    }

    const summaryEditor = $('#summaryEditor')

    if (!summaryEditor.text()) {
      summaryEditor.siblings('.validation-message').css('visibility', 'visible')
      valid = false
    }

    const authorOverride = $('#authorOverride')

    if (parseInt($('#author').val().toString()) < 0 && !authorOverride.val()) {
      authorOverride.siblings('.validation-message').css('display', 'initial')
      valid = false
    }

    return valid
  }

  public onFormInvalid() {
    this.disableSubmitButton()
  }

  public cancel() {
    if (!changeDetected || confirm('You have unsaved changes that will be lost. Cancel editing?')) {
      window.location.href = '/cms/articles'
    }
  }

  public triggerChangeDetected() {
    changeDetected = true

    $('#saveButton').removeAttr('disabled')
    $('#saveMessage').css('display', '')
  }
}

function clearAuthorOverride(hide: boolean = true, resetValue?: string) {
  $('#authorOverride')
  .val(resetValue)
  .removeAttr('required')
  .prop('placeholder', '')
  .prop('disabled', true)
  .css('display', hide ? 'none' : 'initial')
}

function getArticlePreviewComponent() {
  return $('#articlePreview').get(0) as ArticlePreview
}

function resetPlaceholderText(elem: JQuery<HTMLElement>) {
  if (!elem.text().trim().length) {
    elem.empty()
  }
}

function recalculatePreviewImageMinDimensions() {
  const articlePreviewComponent = getArticlePreviewComponent()

  let minWidth = articlePreviewComponent.clientWidth
  let minHeight = articlePreviewComponent.clientHeight - $('#titleEditor + .validation-message').get(0).clientHeight

  minWidth = Math.ceil(minWidth / 100) * 100
  minHeight = Math.ceil(minHeight / 100) * 100

  $('#previewImageMinWidth')
  .val(minWidth)
  .css('width', `${minWidth.toString().length}ch`)

  $('#previewImageMinHeight').val(minHeight)
  .css('width', `${minHeight.toString().length}ch`)
}

function handlePreviewImageChange(event) {
  const validationMessage = $(this).siblings('.validation-message')
  validationMessage.css('display', '')

  const files = (this as HTMLInputElement).files
  const articlePreviewComponent = getArticlePreviewComponent()

  if (files.length > 0) {
    const file = files[0]

    if (file.type.startsWith('image/')) {
      const reader = new FileReader()

      reader.onload = (progressEvent) => {
        const image = new Image()

        image.onload = () => {
          const minWidth = parseInt($('#previewImageMinWidth').val().toString())
          const minHeight = parseInt($('#previewImageMinHeight').val().toString())

          if (image.naturalWidth < minWidth || image.naturalHeight < minHeight) {
            validationMessage.css('display', 'initial')
            .text(`Preview image must be at least ${minWidth}px in width and ${minHeight}px in height.`)
          } else {
            articlePreviewComponent.previewImageUrl = URL.createObjectURL(file)
          }

          const setupObject = event.data.setupObject
          setupObject.triggerChangeDetected()
          setupObject.toggleSubmitButton()
        }

        image.src = progressEvent.target.result.toString()
      }

      reader.readAsDataURL(file)
    } else {
      articlePreviewComponent.previewImageUrl = null

      validationMessage.css('display', 'initial')
      .text('Preview image must be an image file.')
    }
  } else {
    articlePreviewComponent.previewImageUrl = null
  }

  $(this).prop('required', 'required')
  $('label[for=previewImage]').addClass('required')
}

function handleBackgroundColorHexChange(event) {
  const articlePreviewComponent = getArticlePreviewComponent()
  const bgColor = $(this).val().toString()
  articlePreviewComponent.backgroundColor = bgColor

  const textColor = invertColor(bgColor)
  articlePreviewComponent.textColor = textColor

  $('#textColorHex').val(textColor)
  $('#titleEditor').css('color', textColor).attr('data-color', `${textColor}d0`)
  $('#summaryEditor').css('color', textColor).attr('data-color', `${textColor}d0`)

  const setupObject = event.data.setupObject
  setupObject.triggerChangeDetected()
  setupObject.toggleSubmitButton()
}

function handleAuthorChange(event) {
  const articlePreviewComponent = getArticlePreviewComponent()

  if ($(this).val() === '-1') {
    $('#authorOverride')
    .removeAttr('disabled')
    .attr('required', 'required')
    .prop('placeholder', 'Enter author name...')
    .css('display', 'initial')

    articlePreviewComponent.author = null
  } else {
    clearAuthorOverride()

    const selectedOption = $(this).children('option:selected')
    articlePreviewComponent.author = selectedOption.text()
  }

  const setupObject = event.data.setupObject
  setupObject.triggerChangeDetected()
  setupObject.toggleSubmitButton()
}

function handlePublishedChange(event) {
  const selectedDate = (this as HTMLInputElement).valueAsDate
  let dateString: string

  if (selectedDate) {
    const year = selectedDate.getUTCFullYear()
    const month = selectedDate.getUTCMonth()
    const day = selectedDate.getUTCDate()
    dateString = dateToString(new Date(year, month, day))
  } else {
    dateString = null
  }

  getArticlePreviewComponent().published = dateString

  const setupObject = event.data.setupObject
  setupObject.triggerChangeDetected()
  setupObject.toggleSubmitButton()
}

function handlePublisherOverrideChange(event) {
  const isChecked = $(this).prop('checked')

  const author = $('#author')
  author.prop('disabled', !isChecked)

  const published = $('#published')
  published.prop('disabled', !isChecked)

  const authorLabel = $('label[for=author]')
  const publishedLabel = $('label[for=published]')

  if (isChecked) {
    authorLabel.removeClass('disabled-label')
    authorLabel.addClass('required')
    publishedLabel.removeClass('disabled-label')
    publishedLabel.addClass('required')

    if (author.val() === '-1') {
      $('#authorOverride').removeAttr('disabled')
    } else {
      clearAuthorOverride()
    }
  } else {
    authorLabel.addClass('disabled-label')
    authorLabel.removeClass('required')
    publishedLabel.addClass('disabled-label')
    publishedLabel.removeClass('required')

    clearAuthorOverride(originalAuthor !== null, originalAuthor === null ? originalAuthorName : null)

    author.val(originalAuthor === null ? '-1' : originalAuthor)
    published.val(originalPublished)

    const articlePreviewComponent = getArticlePreviewComponent()
    articlePreviewComponent.author = originalAuthorName
    articlePreviewComponent.published = originalPublishedString
  }

  const setupObject = event.data.setupObject
  setupObject.triggerChangeDetected()
  setupObject.toggleSubmitButton()
}

function handleSubmit(event, data, form: JQuery<HTMLFormElement>, setupObject: ArticleSetupObject) {
  event.preventDefault()

  $('#realAuthor').val($('#author').val())
  $('#realAuthorOverride').val($('#authorOverride').val())
  $('#realPublished').val($('#published').val())

  const submitMode = data.mode

  if (submitMode === SubmitMode.SAVE || setupObject.validate()) {
    showSpinner()

    const formData = new FormData(form.get(0))
    formData.set('submitMode', submitMode.toString())

    $.ajax({
      url: form.attr('action'),
      data: formData,
      processData: false,
      contentType: false,
      method: 'put',
      success: data.onSuccess,
      error: (jqXHR) => {
        let elemId: string
        let validationMessageCssProp = 'display'
        let validationMessageCssValue = 'initial'
        let errorMessage: string

        if (jqXHR.status == 413) {
          elemId = 'previewImage'
          errorMessage = `Preview image too large. Maximum size: ${FILE_MAX_SIZE}`
        } else {
          const error = jqXHR.responseJSON as ValidationException
          elemId = error.fieldName
          errorMessage = error.message

          switch (elemId) {
            case 'title':
              elemId = 'titleEditor'
              break
            case 'summary':
              elemId = 'summaryEditor'
              validationMessageCssProp = 'visibility'
              validationMessageCssValue = 'visible'
              break
            case 'previewImageFile':
              elemId = 'previewImage'
              break
          }
        }

        $(`#${elemId}`).parent().children('.validation-message')
        .css(validationMessageCssProp, validationMessageCssValue).text(errorMessage)

        closeSpinner()
        setupObject.onFormInvalid()
      },
    })
  } else {
    setupObject.onFormInvalid()
  }
}

export function showSpinner() {
  ($('fullscreen-spinner').get(0) as FullscreenSpinner).showModal()
}

export function closeSpinner() {
  ($('fullscreen-spinner').get(0) as FullscreenSpinner).close()
}

export function setup(setupObject: ArticleSetupObject) {
  recalculatePreviewImageMinDimensions()

  $('#previewImage').on('change', {setupObject: setupObject}, handlePreviewImageChange)
  $('#backgroundColorHex').on('change', {setupObject: setupObject}, handleBackgroundColorHexChange)
  $('#publisherOverride').on('change', {setupObject: setupObject}, handlePublisherOverrideChange)
  $('#published').on('change', {setupObject: setupObject}, handlePublishedChange)
  $('#author').on('change', {setupObject: setupObject}, handleAuthorChange)

  $('#authorOverride').on('change', function () {
    setupObject.triggerChangeDetected()
    getArticlePreviewComponent().author = $(this).val().toString()
    setupObject.toggleSubmitButton()
  })

  const titleEditor = $('#titleEditor')

  titleEditor.on('input', function () {
    $(this).siblings('.validation-message').css('display', '')
    setupObject.triggerChangeDetected()
    setupObject.toggleSubmitButton()
  })

  titleEditor.on('focusout', function () {
    $('#title').val($(this).text())
    resetPlaceholderText($(this))
    recalculatePreviewImageMinDimensions()
  })

  const summaryEditor = $('#summaryEditor')

  summaryEditor.on('input', function () {
    $(this).siblings('.validation-message').css('visibility', '')
    setupObject.triggerChangeDetected()
    setupObject.toggleSubmitButton()
  })

  summaryEditor.on('focusout', function () {
    $('#summary').val($(this).text())
    resetPlaceholderText($(this))
    recalculatePreviewImageMinDimensions()
  })

  $('#articleForm').on('submit', function (event, data) {
    handleSubmit(event, data, $(this) as JQuery<HTMLFormElement>, setupObject)
  })

  $('#saveButton').on('click', async () => {
    await setupObject.allocatePk()
    setupObject.saveArticle()
  })

  $('#publishButton').on('click', async () => {
    await setupObject.allocatePk()
    setupObject.publishArticle()
  })

  $('#cancelButton').on('click', () => setupObject.cancel())
}