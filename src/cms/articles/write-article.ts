import {ArticlePreview} from "../../articles/components/article-preview"
import {ArticleReader} from "../../articles/components/article-reader";
import {
  setup,
  ArticleSetupObject, SubmitMode,
} from "./form-common";
import {FullscreenSpinner} from "../../components/spinner";

// Avoid having to import tinymce within this file
declare const tinymce: {
  activeEditor: {
    getContent: () => string;
    save: () => void;
    on: (arg0: string, arg1: () => void) => void;
  };
}

class WriteArticleSetupObject extends ArticleSetupObject {
  constructor() {
    super('#previewButton')
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

  public triggerChangeDetected() {
    super.triggerChangeDetected()
    $('#saveButton').removeAttr('disabled')
    $('#saveMessage').css('display', '')
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

$(() => {
  const setupObject = new WriteArticleSetupObject()
  const body = $('#body')

  // @ts-ignore
  body.tinymce({
    license_key: 'gpl',
    promotion: false,
    plugins: 'anchor autolink charmap codesample emoticons image link lists media searchreplace table visualblocks wordcount',
    toolbar: 'undo redo | blocks fontfamily fontsize | bold italic underline strikethrough | link image media table | align lineheight | numlist bullist indent outdent | emoticons charmap | removeformat',
    setup: (editor) => {
      editor.on('input', () => body.parent().children('.validation-message').css('display', ''))
      editor.on('focusout', () => setupObject.toggleSubmitButton())
    },
  })

  tinymce.activeEditor.on('input', () => setupObject.triggerChangeDetected())
  $('#originalPublicationUrl').on('input', () => setupObject.triggerChangeDetected())

  setup(setupObject)

  $('#modal').on('close', () => $('body').css('overflow', 'initial'))
  $('#previewButton').on('click', handlePreviewButtonClick)

  const saveButton = $('#saveButton')

  saveButton.on('click', function () {
    tinymce.activeEditor.save()

    $('#articleForm').trigger('submit', {
      mode: SubmitMode.SAVE,
      onSuccess: () => {
        saveButton.attr('disabled', 'disabled')
        setupObject.resetChangeDetected();
        ($('fullscreen-spinner').get(0) as FullscreenSpinner).close()
        $('#saveMessage').css('display', 'initial')
      },
    })
  })
})

export {ArticlePreview, ArticleReader, FullscreenSpinner}