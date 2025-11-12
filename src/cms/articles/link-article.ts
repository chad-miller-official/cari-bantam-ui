import {ArticlePreview} from "../../articles/components/article-preview";
import {FullscreenSpinner} from "../../components/spinner";
import {setup, toggleButton} from "./form-common";

function toggleSubmitButton() {
  toggleButton($('#publishTools > button[type=submit]'))
}

function onSubmit(event): boolean {
  const url = $('input[name=url]')
  const urlInput = url.get(0) as HTMLInputElement

  let valid = true

  if (!urlInput.validity.valid) {
    url.siblings('.validation-message').css('display', '')
    valid = false
  }

  const previewImage = $('#previewImage')
  const previewImageInput = previewImage.get(0) as HTMLInputElement

  if (!previewImageInput.validity.valid) {
    previewImage.siblings('.validation-message').css('display', '')
    valid = false
  }

  return valid
}

$(() => {
  setup(toggleSubmitButton, onSubmit)

  $('input[name=url]').on('input', function () {
    $(this).siblings('.validation-message').css('display', 'none')
  })

  $('#previewImage').on('change', function() {
    $(this).siblings('.validation-message').css('display', 'none')
  })
})

export {ArticlePreview, FullscreenSpinner}