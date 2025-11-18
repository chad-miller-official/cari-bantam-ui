import {ArticlePreview} from "../../articles/components/article-preview"
import {ArticleReader} from "../../articles/components/article-reader";
import {ArticleSetupObject, ArticleType, FILE_MAX_SIZE, setup,} from "./form-common";
import {FullscreenSpinner} from "../../components/spinner";

// Avoid having to import tinymce within this file
declare const tinymce: {
  activeEditor: {
    getContent: () => string;
    save: () => void;
    on: (arg0: string, arg1: () => void) => void;
    uploadImages: () => Promise<any>;
  };
}

class WriteArticleSetupObject extends ArticleSetupObject {
  constructor() {
    super('#previewButton')
    this.type = ArticleType.SELF_HOSTED
  }

  protected shouldEnableSubmitButton(): boolean {
    return tinymce.activeEditor.getContent() && super.shouldEnableSubmitButton()
  }

  private resetPublishButton() {
    $('#publishButton').attr('disabled', 'disabled')
    $('#submitButtonTooltip > :first-child').css("display", "initial")
  }

  public toggleSubmitButton() {
    super.toggleSubmitButton()
    this.resetPublishButton()
  }

  public triggerArticleFormSubmit() {
    const spinner = ($('fullscreen-spinner').get(0) as FullscreenSpinner)
    spinner.showModal()

    tinymce.activeEditor.uploadImages().then((value) => {
      if (value.every(img => img.status)) {
        tinymce.activeEditor.save()
        super.triggerArticleFormSubmit()
      }
    })
  }

  public validate(): boolean {
    let valid = super.validate()

    if (!tinymce.activeEditor.getContent()) {
      $('#body').parent().children('.validation-message').css('display', 'initial')
      valid = false
    }

    const originalPublicationUrl = $('#originalPublicationUrl')
    const originalPublicationUrlInput = originalPublicationUrl.get(0) as HTMLInputElement

    if (!originalPublicationUrlInput.validity.valid) {
      const validationMessage = originalPublicationUrlInput.validity.typeMismatch
          ? 'Article link must be a URL.'
          : 'Article URL is invalid.'

      originalPublicationUrl.siblings('.validation-message')
      .css('display', 'initial')
      .text(validationMessage)

      valid = false
    }

    return valid
  }

  public onFormInvalid() {
    super.onFormInvalid()
    this.resetPublishButton()
  }
}

function handlePreviewButtonClick(event) {
  event.preventDefault()

  $('#submitButtonTooltip > :first-child').css("display", "none")
  $('#publishButton').removeAttr("disabled")

  tinymce.activeEditor.save();

  ($('#modal').get(0) as HTMLDialogElement).showModal()
  $('body').css('overflow', 'hidden')

  const titleEditor = $('#titleEditor')
  const articlePreviewComponent = $('#articlePreview').get(0) as ArticlePreview

  const articleReader = $('#bodyPreview > article-reader').get(0) as ArticleReader
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
}

const imageUploadHandler = (blobInfo, progress) => new Promise((resolve, reject) => {
  const pkArticle = $('#article').val().toString()

  const xhr = new XMLHttpRequest()
  xhr.withCredentials = true
  xhr.open('POST', `/api/cms/articles/${pkArticle}/upload-image`)

  xhr.upload.onprogress = (e) => {
    progress(e.loaded / e.total * 100)
  }

  xhr.onload = () => {
    if (xhr.status < 200 || xhr.status >= 300) {
      let message = `HTTP Error: ${xhr.status}`

      if (xhr.status === 413) {
        message = `File "${blobInfo.filename()} is too large. Max size: ${FILE_MAX_SIZE}`
      }

      ($('fullscreen-spinner').get(0) as HTMLDialogElement).close()

      reject({message})
      return
    }

    const json = JSON.parse(xhr.responseText)

    if (!json || typeof json.location != 'string') {
      reject({message: `Invalid JSON: ${xhr.responseText}`})
      return
    }

    resolve(json.location);
  }

  xhr.onerror = () => {
    reject(`Image upload failed due to an XHR Transport error. Code: ${xhr.status}`)
  }

  const formData = new FormData()
  formData.append('file', blobInfo.blob(), blobInfo.filename())
  formData.append('_csrf', $('input[name=_csrf]').val().toString())

  xhr.send(formData)
})

$(() => {
  const setupObject = new WriteArticleSetupObject()
  const body = $('#body')

  // @ts-ignore
  body.tinymce({
    license_key: 'gpl',
    promotion: false,
    plugins: 'anchor autolink charmap codesample emoticons image link lists media searchreplace table visualblocks wordcount',
    toolbar: 'undo redo | blocks fontfamily fontsize | bold italic underline strikethrough | link image media table | align lineheight | numlist bullist indent outdent | emoticons charmap | removeformat',
    image_uploadtab: true,
    images_upload_handler: imageUploadHandler,
    images_reuse_filename: true,
    automatic_uploads: false,
    setup: (editor) => {
      editor.on('input', () => body.parent().children('.validation-message').css('display', ''))

      editor.on('change', () => {
        setupObject.toggleSubmitButton()
        setupObject.triggerChangeDetected()
      })
    },
  })

  $('#originalPublicationUrl').on('input', () => setupObject.triggerChangeDetected())

  setup(setupObject)

  $('#modal').on('close', () => $('body').css('overflow', 'initial'))
  $('#previewButton').on('click', handlePreviewButtonClick)
})

export {ArticlePreview, ArticleReader, FullscreenSpinner}