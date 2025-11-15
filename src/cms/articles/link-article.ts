import {ArticlePreview} from "../../articles/components/article-preview";
import {FullscreenSpinner} from "../../components/spinner";
import {setup, ArticleSetupObject} from "./form-common";

class LinkArticleSetupObject extends ArticleSetupObject {
  constructor() {
    super('#publishButton')
  }

  protected shouldEnableSubmitButton(): boolean {
    return $('#url').val() && super.shouldEnableSubmitButton()
  }

  public validate(): boolean {
    let valid = super.validate()

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

    return valid && !Boolean(validationMessage)
  }
}

$(() => {
  const setupObject = new LinkArticleSetupObject()
  setup(setupObject)

  $('#url').on('input', function () {
    setupObject.triggerChangeDetected()

    const validationMessageElem = $(this).siblings('.validation-message')
    validationMessageElem.css('display', '')
    validationMessageElem.text('')

    setupObject.toggleSubmitButton()
  })
})

export {ArticlePreview, FullscreenSpinner}