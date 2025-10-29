import Quill from 'quill'
import {ArticlePreview} from "../../articles/components/article-preview";

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

  $('#title').on('change', function () {
    articlePreviewComponent.title = $(this).val() as string
  })

  summaryEditor.on('text-change', () => {
    articlePreviewComponent.innerHTML = summaryEditor.getSemanticHTML().replace(/&nbsp;/g, ' ')
    articlePreview.children('p').addClass('no-margin-block')
  })

  $('#previewImage').on('change', function () {
    const files = (this as HTMLInputElement).files
    articlePreviewComponent.previewImageUrl = files.length > 0 ? URL.createObjectURL(files[0]) : null
  })

  $('#textColorHex').on('change', function () {
    articlePreviewComponent.textColor = $(this).val() as string
  })

  const author = $('#author')

  author.on('change', function () {
    articlePreviewComponent.author = $(this).val() as string
  })

  const published = $('#published')

  published.on('change', function () {
    const selectedDate = (this as HTMLInputElement).valueAsDate
    const year = selectedDate.getUTCFullYear()
    const month = selectedDate.getUTCMonth()
    const day = selectedDate.getUTCDate()

    const dateTimeFormat = new Intl.DateTimeFormat(navigator.language, {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })

    articlePreviewComponent.published = dateTimeFormat.format(new Date(year, month, day))
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
    }
  })

  $('#previewButton').on('click', () => {
    const body = bodyEditor.getSemanticHTML()

    $('#bodyPreviewContainer').css('display', 'block')
    $('#bodyPreview').html(body)

    $('#body').val(body)
    $('#summary').val(summaryEditor.getSemanticHTML())
  })
})

export {ArticlePreview}