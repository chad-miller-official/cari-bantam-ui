function deleteArticle(article: number) {
  // TODO
}

$(() => {
  $('.delete-article-button').each(function() {
    $(this).on('click', () => deleteArticle($(this).data('article')))
  })
})