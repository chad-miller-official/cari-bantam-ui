import {ArticlePreview} from "../../articles/components/article-preview"
import {dateToString} from "../../util"

declare const originalAuthor: string
declare const originalAuthorName: string

declare namespace tinymce {
  export const activeEditor: any
}

function clearAuthorOverride() {
  const authorOverride = $('#authorOverride')
  authorOverride.val(null)
  authorOverride.removeAttr('required')
  authorOverride.prop('placeholder', '')
  authorOverride.prop('disabled', true)
  authorOverride.css('display', 'none')
}

function resetPlaceholderText() {
  if (!$(this).text().trim().length) {
    $(this).empty()
  }
}

$(() => {
  const modal = $('#modal')

  modal.on('close', () => {
    $('body').css('overflow', 'initial')
  })

  const articlePreview = $('#articlePreview')
  const articlePreviewComponent = articlePreview.get(0) as ArticlePreview
  const previewImage = $('#previewImage');

  previewImage.on('change', function () {
    const files = (this as HTMLInputElement).files
    articlePreviewComponent.previewImageUrl = files.length > 0 ? URL.createObjectURL(files[0]) : null
  })

  const backgroundColorHex = $('#backgroundColorHex')

  backgroundColorHex.on('change', function () {
    articlePreviewComponent.backgroundColor = $(this).val().toString()
  })

  const author = $('#author')
  const authorOverride = $('#authorOverride')

  author.on('change', function () {
    if ($(this).val() === '-1') {
      authorOverride.removeAttr('disabled')
      authorOverride.prop('placeholder', 'Enter author name...')
      authorOverride.prop('required', true)
      authorOverride.css('display', 'initial')
      articlePreviewComponent.author = null
    } else {
      clearAuthorOverride()

      const selectedOption = $(this).children('option:selected')
      articlePreviewComponent.author = selectedOption.text()
    }
  })

  authorOverride.on('change', function () {
    articlePreviewComponent.author = $(this).val().toString()
  })

  const published = $('#published')

  published.on('change', function () {
    const selectedDate = (this as HTMLInputElement).valueAsDate
    const year = selectedDate.getUTCFullYear()
    const month = selectedDate.getUTCMonth()
    const day = selectedDate.getUTCDate()
    articlePreviewComponent.published = dateToString(new Date(year, month, day))
  })

  $('#publisherOverride').on('change', function () {
    const isChecked = $(this).prop('checked')

    author.prop('disabled', !isChecked)
    published.prop('disabled', !isChecked)

    const authorLabel = $('label[for=author]')
    const publishedLabel = $('label[for=published]')

    if (isChecked) {
      authorLabel.removeClass('disabled-label')
      publishedLabel.removeClass('disabled-label')
    } else {
      authorLabel.addClass('disabled-label')
      publishedLabel.addClass('disabled-label')

      clearAuthorOverride()

      author.val(originalAuthor)
      published.val(new Date().toISOString().split('T')[0])

      articlePreviewComponent.author = originalAuthorName
      articlePreviewComponent.published = dateToString(new Date())
    }
  })

  const titleEditor = $('#titleEditor')
  titleEditor.on('focusout', resetPlaceholderText)

  const summaryEditor = $('#summaryEditor')
  summaryEditor.on('focusout', resetPlaceholderText)

  $('#previewButton').on('click', () => {
    const body = tinymce.activeEditor.getContent('bodyEditor');

    (modal.get(0) as HTMLDialogElement).showModal()
    $('body').css('overflow', 'hidden')

    const headerPreview = $('#headerPreview').css(
        'background-image',
        `linear-gradient(to bottom, transparent, transparent 50%, white), linear-gradient(to right, ${articlePreviewComponent.backgroundColor}e0 40%, transparent 75%), url(${articlePreviewComponent.previewImageUrl})`
    )

    headerPreview.empty()

    headerPreview.append(
        $('<h1>').css('margin', 'revert').text(titleEditor.text()),
        $('<h3>').css('margin', 'revert').text(`by ${articlePreviewComponent.author} // ${articlePreviewComponent.published}`)
    )

    const originalPublicationUrl = $('#originalPublicationUrl').val()

    if (originalPublicationUrl) {
      headerPreview.append($('<p>').text(`Originally published at ${originalPublicationUrl}`))
    }

    const bodyPreview = $('#bodyPreview')
    bodyPreview.html(body)

    $('#title').val(titleEditor.text())
    $('#body').val(body)
    $('#summary').val(summaryEditor.text())
  })
})

export {ArticlePreview}