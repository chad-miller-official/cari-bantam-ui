import {ArticlePreview} from "../../articles/components/article-preview"
import tinymce from "tinymce";
import {ArticleReader} from "../../articles/components/article-reader";
import {setup, toggleButton} from "./form-common";
import { FullscreenSpinner } from "../../components/spinner";

function togglePreviewButton() {
  return toggleButton($('#previewButton'), Boolean(tinymce.activeEditor.getContent()))
}

$(() => {
  // @ts-ignore
  $('#body').tinymce({
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

  setup(togglePreviewButton)

  $('#previewButton').on('click', () => {
    $('#publishTools .tooltip').removeClass("tooltip")
    $('#publishButton').removeAttr("disabled")

    tinymce.activeEditor.save();

    (modal.get(0) as HTMLDialogElement).showModal()
    $('body').css('overflow', 'hidden')

    const titleEditor = $('#titleEditor')
    const articlePreviewComponent = $('#articlePreview').get(0) as ArticlePreview

    const articleReader = new ArticleReader()
    articleReader.title = titleEditor.text()
    articleReader.author = articlePreviewComponent.author
    articleReader.published = articlePreviewComponent.published
    articleReader.previewImageUrl = articlePreviewComponent.previewImageUrl
    articleReader.backgroundColor = articlePreviewComponent.backgroundColor
    articleReader.textColor = articlePreviewComponent.textColor

    const originalPublicationUrl = $('#originalPublicationUrl').val()

    if (originalPublicationUrl) {
      articleReader.originalPublicationUrl = originalPublicationUrl.toString()
    }

    articleReader.innerHTML = tinymce.activeEditor.getContent()
    $('#bodyPreview').empty().append(articleReader)
  })

  $('#saveButton').on('click', () => $('#articleForm').trigger('submit'))
})

export {ArticlePreview, FullscreenSpinner}