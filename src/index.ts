$(() => {
  const navbar = $('#navbar')

  $('#navbarOpener').on('click', () => navbar.css('display', 'block'))
  $('#navbarCloser').on('click', () => navbar.css('display', 'none'))

  $(window).on('click', (event) => {
    // @ts-ignore
    if (navbar.css('display') === 'block' && event.target == navbar.get(0)) {
      navbar.css('display', 'none')
    }
  })
})