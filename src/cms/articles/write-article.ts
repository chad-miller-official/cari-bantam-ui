import Quill from 'quill'
import {ArticlePreview} from "../../articles/components/article-preview";

$(() => {
  const mainToolbar = [
    [{'font': []}, {'header': []}],
    ['bold', 'italic', 'underline', 'strike', 'code', {'script': 'sub'}, {'script': 'super'}],
    [{'align': []}, {'indent': '-1'}, {'indent': '+1'}, {'list': 'ordered'}, {'list': 'bullet'}, {'list': 'check'}],
    ['link', 'image', 'video', 'blockquote', 'code-block'],
    ['clean'],
  ]

  const mainEditor = new Quill('#mainEditor', {
    modules: {
      toolbar: mainToolbar,
    },
    placeholder: 'Start writing...',
    theme: 'snow',
  })

  const summaryToolbar = [
    ['bold', 'italic', 'underline', 'strike', 'code', {'script': 'sub'}, {'script': 'super'}],
    ['clean'],
  ]

  const summaryEditor = new Quill('#summaryEditor', {
    modules: {
      toolbar: summaryToolbar,
    },
    placeholder: 'Write a few sentences explaining what the article is about.',
    theme: 'snow',
  })

  const articlePreview = $('#articlePreview').get()[0] as ArticlePreview

  $('#title').on('change', function () {
    articlePreview.title = $(this).val() as string
  })

  summaryEditor.on('text-change', () => {
    articlePreview.innerHTML = summaryEditor.getSemanticHTML()
  })

  $('#previewImage').on('change', function () {
    const files = (this as HTMLInputElement).files
    articlePreview.previewImageUrl = files.length > 0 ? URL.createObjectURL(files[0]) : null
  })

  $('#textColor').on('change', function () {
    articlePreview.textColor = $(this).val() as string
  })

  const author = $('#author')

  author.on('change', function () {
    articlePreview.author = $(this).text()
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

    articlePreview.published = dateTimeFormat.format(new Date(year, month, day))
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
})

export {ArticlePreview}