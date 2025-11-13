import {ArticlePreview} from "../../articles/components/article-preview";
import {FullscreenSpinner} from "../../components/spinner";
import {setup, toggleButton} from "./form-common";

function togglePublishButton() {
  toggleButton($('#publishButton'), Boolean($('#url').val()))
}

function additionalValidation(event): boolean {
  const url = $('#url')
  const urlInput = url.get(0) as HTMLInputElement

  let validationMessage = null

  if (urlInput.validity.typeMismatch) {
    validationMessage = 'Link to article must be a URL.'
  } else if (urlInput.validity.valueMissing) {
    validationMessage = 'Article URL is required.'
  } else if (!urlInput.validity.valid) {
    validationMessage = 'Article URL is invalid.'
  }

  if (validationMessage) {
    url.siblings('.validation-message')
    .css('display', 'initial')
    .text(validationMessage)
  }

  return !Boolean(validationMessage)
}

function onInvalid() {
  $('#publishButton').attr('disabled', 'disabled')
}

$(() => {
  setup(togglePublishButton, additionalValidation, onInvalid)

  $('#url').on('input', function () {
    const validationMessageElem = $(this).siblings('.validation-message')
    validationMessageElem.css('display', '')
    validationMessageElem.text('')
    togglePublishButton()
  })
})

export {ArticlePreview, FullscreenSpinner}