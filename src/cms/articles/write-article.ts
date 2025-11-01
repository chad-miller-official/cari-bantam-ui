import Quill from 'quill'
import {ArticlePreview} from "../../articles/components/article-preview";
import {dateToString} from "../../util";

declare const originalAuthor: string
declare const originalAuthorName: string

const BODY_TOOLBAR = [
  [{'header': []}, 'bold', 'italic', 'underline', 'strike', 'code', {'script': 'sub'}, {'script': 'super'}],
  [{'align': []}, {'indent': '-1'}, {'indent': '+1'}, {'list': 'ordered'}, {'list': 'bullet'}, {'list': 'check'}],
  ['link', 'image', 'video', 'blockquote', 'code-block'],
  ['clean'],
]

const SUMMARY_TOOLBAR = [
  ['bold', 'italic', 'underline', 'strike', 'code', {'script': 'sub'}, {'script': 'super'}],
  ['clean'],
]

$(() => {
  const bodyEditor = new Quill('#bodyEditor', {
    modules: {
      toolbar: BODY_TOOLBAR,
    },
    placeholder: 'Start writing...',
    theme: 'snow',
  })

  const summaryEditor = new Quill('#summaryEditor', {
    modules: {
      toolbar: SUMMARY_TOOLBAR,
    },
    placeholder: 'Write a few sentences explaining what the article is about.',
    theme: 'snow',
  })

  const articlePreview = $('#articlePreview')
  const articlePreviewComponent = articlePreview.get(0) as ArticlePreview

  const title = $('#title')

  title.on('change', function () {
    articlePreviewComponent.title = $(this).val().toString()
  })

  summaryEditor.on('text-change', () => {
    articlePreviewComponent.innerHTML = summaryEditor.getSemanticHTML().replace(/&nbsp;/g, ' ')
    articlePreview.children('p').addClass('no-margin-block')
  })

  $('#previewImage').on('change', function () {
    const files = (this as HTMLInputElement).files
    articlePreviewComponent.previewImageUrl = files.length > 0 ? URL.createObjectURL(files[0]) : null
  })

  $('#backgroundColorHex').on('change', function () {
    articlePreviewComponent.backgroundColor = $(this).val().toString()
  })

  const author = $('#author')

  author.on('change', function () {
    const selectedOption = $(this).children('option:selected')
    articlePreviewComponent.author = selectedOption.text()
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

      author.val(originalAuthor)
      published.val(new Date().toISOString().split('T')[0])

      articlePreviewComponent.author = originalAuthorName

      const dateTimeFormat = new Intl.DateTimeFormat(navigator.language, {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })

      articlePreviewComponent.published = dateTimeFormat.format(new Date())
    }
  })

  $('#previewButton').on('click', () => {
    const body = bodyEditor.getSemanticHTML()

    $('#bodyPreviewContainer').css('display', 'block')
    $('#titlePreview').text(articlePreviewComponent.title)
    $('#authorPreview').text(`by ${articlePreviewComponent.author} // ${articlePreviewComponent.published}`)

    const originalPublicationUrl = $('#originalPublicationUrl').val()
    const originalPublicationUrlPreview = $('#originalPublicationUrlPreview')

    if (originalPublicationUrl) {
      originalPublicationUrlPreview.text(`Originally published at ${originalPublicationUrl}`)
    } else {
      originalPublicationUrlPreview.text(null)
    }

    $('#bodyPreview').html(body)

    $('#body').val(body)
    $('#summary').val(summaryEditor.getSemanticHTML())
  })
})

export {ArticlePreview}