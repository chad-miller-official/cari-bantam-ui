import Quill from 'quill'
import {ArticlePreview} from "../../articles/components/article-preview";

const DATE_TIME_FORMAT = new Intl.DateTimeFormat(navigator.language, {
  month: 'long',
  day: 'numeric',
  year: 'numeric',
})

$(() => {
  const toolbar = [
    [{'font': []}, {'header': []}],
    ['bold', 'italic', 'underline', 'strike', 'code', {'script': 'sub'}, {'script': 'super'}],
    [{'align': []}, {'indent': '-1'}, {'indent': '+1'}, {'list': 'ordered'}, {'list': 'bullet'}, {'list': 'check'}],
    ['link', 'image', 'video', 'blockquote', 'code-block'],
    ['clean'],
  ]

  new Quill('#editor', {
    modules: {
      toolbar,
    },
    placeholder: 'Start writing...',
    theme: 'snow',
  })

  $('#previewImage').on('change', function () {
    const hasFile = (this as HTMLInputElement).files.length > 0
    $('#previewContainer').css('display', hasFile ? 'block' : 'none')

    const preview = $('#preview')
    preview.empty()

    if (hasFile) {
      const articlePreview = new ArticlePreview()

      articlePreview.title = $('#title').val() as string
      articlePreview.author = $('#author').val() as string
      articlePreview.url = '#'
      articlePreview.published = DATE_TIME_FORMAT.format(new Date())
      articlePreview.previewImageUrl = URL.createObjectURL((this as HTMLInputElement).files[0])
      articlePreview.textContent = $('#summary').val() as string

      const textColor = $('#textColor').val()

      if (textColor) {
        articlePreview.textColor = textColor as string
      }

      preview.append(articlePreview)
    }
  })
})