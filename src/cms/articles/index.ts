import axios, {AxiosError} from "axios";
import {Csrf} from "../../types";
import {FullscreenSpinner} from "../../components/spinner";

declare const _csrf: Csrf

function deleteArticle(articleRow: JQuery<HTMLElement>) {
  if (!confirm('Deleting an article cannot be undone. Are you sure you want to continue?')) {
    return
  }

  const axiosConfig = {
    withCredentials: true,
    xsrfHeaderName: _csrf.headerName,
    headers: {[_csrf.headerName]: _csrf.token},
  }

  const article = articleRow.data('article')
  const rowHolder = articleRow.parent()
  const fullscreenSpinner = $('fullscreen-spinner').get(0) as FullscreenSpinner

  axios.delete(`/api/cms/articles/delete/${article}`, axiosConfig)
  .then(() => {
    $(`[data-article=${article}]`).remove()

    if (!rowHolder.children().length) {
      rowHolder.append($('<span>').text('No articles.'))
    }
  })
  .catch((err: AxiosError) => {
    alert(`Failed to delete article. Reason: ${err.message}`)
  })
  .finally(() => fullscreenSpinner.close())

  fullscreenSpinner.showModal()
}

$(() => {
  $('.delete-article-button').each(function () {
    $(this).on('click', () => deleteArticle($(this).parent()))
  })
})

export {FullscreenSpinner}