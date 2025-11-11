import {ArticlePreview} from "../../articles/components/article-preview";
import {dateToString, invertColor} from "../../util";

declare const originalAuthor: string
declare const originalAuthorName: string
declare const originalPublished: string
declare const originalPublishedString: string

function clearAuthorOverride(hide: boolean = true, resetValue?: string) {
  const authorOverride = $('#authorOverride')
  authorOverride.val(resetValue)
  authorOverride.removeAttr('required')
  authorOverride.prop('placeholder', '')
  authorOverride.prop('disabled', true)
  authorOverride.css('display', hide ? 'none' : 'initial')
}

function resetPlaceholderText() {
  if (!$(this).text().trim().length) {
    $(this).empty()
  }
}

export function toggleButton(button: JQuery<HTMLButtonElement>, additionalChecks: boolean = true) {
  if (
      additionalChecks
      && ($('#previewImage').val()
          || ($('#articlePreview').get(0) as ArticlePreview).previewImageUrl)
      && $('#published').val()
      && $('#articlePreview > [slot=title]').text()
      && $('#articlePreview > [slot=summary]').text()
      && (parseInt($('#author').val().toString()) > 0
          || $('#authorOverride').val())
  ) {
    button.removeAttr('disabled')
    button.removeProp('disabled')
  } else {
    button.attr('disabled', 'disabled')
  }
}

export function setup(toggleButtonFunc: () => void) {
  const articlePreviewComponent = $('#articlePreview').get(0) as ArticlePreview
  const previewImage = $('#previewImage');

  previewImage.on('change', function () {
    const files = (this as HTMLInputElement).files
    articlePreviewComponent.previewImageUrl = files.length > 0 ? URL.createObjectURL(files[0]) : null
    toggleButtonFunc()

    $(this).prop('required', 'required')
    $('label[for=previewImage]').addClass('required')
  })

  const titleEditor = $('#titleEditor')
  const summaryEditor = $('#summaryEditor')

  const backgroundColorHex = $('#backgroundColorHex')
  const textColorHex = $('#textColorHex')

  backgroundColorHex.on('change', function () {
    const bgColor = $(this).val().toString()
    articlePreviewComponent.backgroundColor = bgColor

    const textColor = invertColor(bgColor)
    articlePreviewComponent.textColor = textColor
    textColorHex.val(textColor)

    titleEditor.css('color', textColor)
    titleEditor.attr('data-color', `${textColor}d0`)
    summaryEditor.css('color', textColor)
    summaryEditor.attr('data-color', `${textColor}d0`)

    toggleButtonFunc()
  })

  const author = $('#author')
  const authorOverride = $('#authorOverride')

  author.on('change', function () {
    if ($(this).val() === '-1') {
      authorOverride.removeAttr('disabled')
      authorOverride.attr('required', 'required')
      authorOverride.prop('placeholder', 'Enter author name...')
      authorOverride.css('display', 'initial')
      articlePreviewComponent.author = null
    } else {
      clearAuthorOverride()

      const selectedOption = $(this).children('option:selected')
      articlePreviewComponent.author = selectedOption.text()
    }

    toggleButtonFunc()
  })

  authorOverride.on('change', function () {
    articlePreviewComponent.author = $(this).val().toString()
    toggleButtonFunc()
  })

  const published = $('#published')

  published.on('change', function () {
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

    articlePreviewComponent.published = dateString
    toggleButtonFunc()
  })

  $('#publishButton').on('click', () => $('#realPublished').val(published.val()))

  $('#publisherOverride').on('change', function () {
    const isChecked = $(this).prop('checked')

    author.prop('disabled', !isChecked)
    published.prop('disabled', !isChecked)

    const authorLabel = $('label[for=author]')
    const publishedLabel = $('label[for=published]')

    if (isChecked) {
      authorLabel.removeClass('disabled-label')
      authorLabel.addClass('required')
      publishedLabel.removeClass('disabled-label')
      publishedLabel.addClass('required')

      if (author.val() === '-1') {
        authorOverride.removeAttr('disabled')
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

      articlePreviewComponent.author = originalAuthorName
      articlePreviewComponent.published = originalPublishedString
    }

    toggleButtonFunc()
  })

  titleEditor.on('input', toggleButtonFunc)

  titleEditor.on('focusout', function () {
    $('#title').val($(this).text())
    resetPlaceholderText()
  })

  summaryEditor.on('input', toggleButtonFunc)

  summaryEditor.on('focusout', function () {
    $('#summary').val($(this).text())
    resetPlaceholderText()
  })
}