import {ArticlePreview} from "../../articles/components/article-preview"
import {dateToString, invertColor} from "../../util"
import tinymce from "tinymce";

declare const originalAuthor: string
declare const originalAuthorName: string

function clearAuthorOverride() {
  const authorOverride = $('#authorOverride')
  authorOverride.val(null)
  authorOverride.removeAttr('required')
  authorOverride.prop('placeholder', '')
  authorOverride.prop('disabled', true)
  authorOverride.css('display', 'none')
}

function togglePreviewButton() {
  const previewButton = $('#previewButton')

  if (
      tinymce.activeEditor.getContent()
      && $('#previewImage').val()
      && $('#published').val()
      && $('#articlePreview > [slot=title]').text()
      && $('#articlePreview > [slot=summary]').text()
      && (parseInt($('#author').val().toString()) > 0
          || $('#authorOverride').val())
  ) {
    previewButton.removeAttr('disabled')
  } else {
    previewButton.attr('disabled', 'disabled')
  }
}

function resetPlaceholderText() {
  if (!$(this).text().trim().length) {
    $(this).empty()
  }
}

$(() => {
  const body = $('#body')

  // @ts-ignore
  body.tinymce({
    license_key: 'gpl',
    promotion: false,
    plugins: 'anchor autolink charmap codesample emoticons image link lists media searchreplace table visualblocks wordcount',
    toolbar: 'undo redo | blocks fontfamily fontsize | bold italic underline strikethrough | link image media table | align lineheight | numlist bullist indent outdent | emoticons charmap | removeformat',
    setup: (editor) => {
      editor.on('focusout', togglePreviewButton)
    },
  })

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
    togglePreviewButton()
  })

  const backgroundColorHex = $('#backgroundColorHex')

  backgroundColorHex.on('change', function () {
    const bgColor = $(this).val().toString()
    articlePreviewComponent.backgroundColor = bgColor

    const textColor = invertColor(bgColor)
    titleEditor.css('color', textColor)
    titleEditor.attr('data-color', `${textColor}d0`)
    summaryEditor.css('color', textColor)
    summaryEditor.attr('data-color', `${textColor}d0`)

    togglePreviewButton()
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

    togglePreviewButton()
  })

  authorOverride.on('change', function () {
    articlePreviewComponent.author = $(this).val().toString()
    togglePreviewButton()
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
    togglePreviewButton()
  })

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
    } else {
      authorLabel.addClass('disabled-label')
      authorLabel.removeClass('required')
      publishedLabel.addClass('disabled-label')
      publishedLabel.removeClass('required')

      clearAuthorOverride()

      author.val(originalAuthor)
      published.val(new Date().toISOString().split('T')[0])

      articlePreviewComponent.author = originalAuthorName
      articlePreviewComponent.published = dateToString(new Date())
    }

    togglePreviewButton()
  })

  const titleEditor = $('#titleEditor')
  titleEditor.on('input', togglePreviewButton)
  titleEditor.on('focusout', resetPlaceholderText)

  const summaryEditor = $('#summaryEditor')
  summaryEditor.on('input', togglePreviewButton)
  summaryEditor.on('focusout', resetPlaceholderText)

  $('#previewButton').on('click', () => {
    $('#publishTools .tooltip').removeClass("tooltip")
    $('#publishTools button[type=submit]').removeAttr("disabled")

    tinymce.activeEditor.save();

    (modal.get(0) as HTMLDialogElement).showModal()
    $('body').css('overflow', 'hidden')

    const headerPreview = $('#headerPreview').css(
        'background-image',
        `linear-gradient(to bottom, transparent, transparent 50%, white), linear-gradient(to right, ${articlePreviewComponent.backgroundColor}e0 40%, transparent 75%), url(${articlePreviewComponent.previewImageUrl})`
    )

    const textColor = invertColor(articlePreviewComponent.backgroundColor)

    headerPreview.empty().append(
        $('<h1>').css('margin', 'revert').css('color', textColor).text(titleEditor.text()),
        $('<h3>').css('margin', 'revert').css('color', textColor).text(`by ${articlePreviewComponent.author} // ${articlePreviewComponent.published}`)
    )

    const originalPublicationUrl = $('#originalPublicationUrl').val()

    if (originalPublicationUrl) {
      headerPreview.append($('<p>').text(`Originally published at ${originalPublicationUrl}`))
    }

    $('#bodyPreview').html(tinymce.activeEditor.getContent())
    $('#title').val(titleEditor.text())
    $('#summary').val(summaryEditor.text())
  })
})

export {ArticlePreview}