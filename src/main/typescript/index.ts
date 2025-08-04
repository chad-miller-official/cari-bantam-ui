window.addEventListener('load', () => {
  const navbar = document.getElementById('navbar')
  const navbarStyle = navbar.style

  document.getElementById('navbarOpener').addEventListener('click', () => {
    navbarStyle.display = 'block'
  })

  document.getElementById('navbarCloser').addEventListener('click', () => {
    navbarStyle.display = 'none'
  })

  window.addEventListener('click', event => {
    if (navbarStyle.display === 'block' && event.target == navbar) {
      navbarStyle.display = 'none'
    }
  })
})