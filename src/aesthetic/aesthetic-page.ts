import {AestheticBlock} from "./components/aesthetic-block";
import {ArenaApiResponse, BlockClass, GalleryContent} from "./types";
import InfiniteScroll from "infinite-scroll";
import CariSpinner from "../components/spinner";
import {CariModal} from "../components/modal";

declare const mediaSourceUrl: string

const MAX_PAGE_SIZE = 20

let totalPages = 1
let loadedLast = false

let blocks: GalleryContent[] = []
let pagesLoaded = 0

let selectedIndex: number

function openBlock() {
  const block = blocks[selectedIndex]
  let media = $('<p>').text('This media type is not supported.')

  switch (block.class) {
    case BlockClass.Link:
      media = $('<iframe>')
      .attr('src', block.source.url)
      .addClass('website-media')

      break
    case BlockClass.Image:
      media = $('<a>')
      .attr('href', block.image.original.url)
      .attr('target', '_blank')
      .append(
          $('<img>')
          .attr('src', block.image.display.url)
          .attr('alt', block.description)
      )

      break
    case BlockClass.Attachment:
      const contentType = block.attachment.content_type

      if (contentType.split('/')[0] === 'video') {
        const source = $('<source>')
        .attr('src', block.attachment.url)
        .text('Your browser does not support video playback.')
        media = $('<video autoplay controls muted>')
        .append(source)
      } else if (contentType === 'application/pdf') {
        media = $('<object>')
        .attr('data', block.attachment.url)
        .attr('type', contentType)
        .addClass('attachment-media')
      }

      break
    case BlockClass.Media:
      media = $(block.embed.html)
      break
    case BlockClass.Text:
      media = $('<div>')
      .addClass('text-media')
      .html(block.content_html)

      break
  }

  $('#aestheticGallerySelection > .media').empty().append(media)
  $('#aestheticGallerySelection > .sidebar .title').text(block.title || '(no title)')
  $('#aestheticGallerySelection > .sidebar .description').html(block.description_html || '(no description)')

  const sidebarWebsite = $('#aestheticGallerySelection > .sidebar .website')

  if (block.class === BlockClass.Link) {
    sidebarWebsite
    .css('display', 'block')
    .children('a')
    .attr('href', block.source.url)

  } else {
    sidebarWebsite.css('display', 'none')
  }

  const navLeft = $('#aestheticGallerySelection > .nav.left')
  const navRight = $('#aestheticGallerySelection > .nav.right')

  if (selectedIndex === 0) {
    navLeft.css('visibility', 'hidden')
    navRight.css('visibility', 'visible')
  } else if (loadedLast && selectedIndex === blocks.length - 1) {
    navLeft.css('visibility', 'visible')
    navRight.css('visibility', 'hidden')
  } else {
    navLeft.css('visibility', 'visible')
    navRight.css('visibility', 'visible')
  }

  $('#aestheticGallery').css('overflow', 'hidden');
  ($('cari-modal').get(0) as CariModal).showModal()
}

function buildBlock(block: GalleryContent, idx: number, infScroll: InfiniteScroll): JQuery<HTMLElement> {
  const blockElement = $('<div>')
  .addClass('aesthetic-gallery-block')
  .data('index', (idx + (20 * pagesLoaded)))
  .on('click', function () {
    selectedIndex = $(this).data('index')
    openBlock()
  })

  let content: JQuery<HTMLElement>

  if (
      block.class === BlockClass.Link ||
      block.class === BlockClass.Image ||
      block.class === BlockClass.Media ||
      (block.class === BlockClass.Attachment && block.image)
  ) {
    content = $('<img>').addClass('image-preview')
    .attr('src', block.image.square.url)
    .attr('alt', block.title)
  } else {
    content = block.class === BlockClass.Text
        ? $('<p>').addClass('text-preview').text(block.content)
        : $('<h3>').text('No Preview')
  }

  return blockElement.append(content)
}

function loadNextPage(container: JQuery<HTMLElement>, infScroll: InfiniteScroll, loadedCallback?: () => void) {
  let cariSpinner = container.children('cari-spinner')

  if (!cariSpinner.length) {
    cariSpinner = $(new CariSpinner())
  }

  container.append(cariSpinner)
  const loadNextPage = infScroll.loadNextPage()

  if (loadNextPage) {
    loadNextPage.then(() => {
      cariSpinner.remove()

      if (loadedCallback) {
        loadedCallback()
      }
    })
  }
}

$(() => {
  const aestheticGallery = $('#aestheticGallery')

  if (aestheticGallery.length) {
    const data = {
      page: 1,
      per: MAX_PAGE_SIZE,
    }

    const infScroll = new InfiniteScroll(aestheticGallery.get(0), {
      path: () => {
        const infScroll = InfiniteScroll.data('#aestheticGallery')

        if (infScroll.pageIndex - 1 < totalPages) {
          return `${mediaSourceUrl}?page=${infScroll.pageIndex + 1}&per=${MAX_PAGE_SIZE}`
        }
      },
      responseBody: 'json',
      history: false,
      scrollThreshold: false,
    })

    $.get(mediaSourceUrl, data, (res: ArenaApiResponse) => {
      totalPages = Math.ceil(res.length / MAX_PAGE_SIZE)
      aestheticGallery.append(...res.contents.map((block, idx) => buildBlock(block, idx, infScroll)))

      blocks.push(...res.contents)
      pagesLoaded += 1
    })

    infScroll.on('load', (res: ArenaApiResponse) => {
      aestheticGallery.append(...res.contents.map((block, idx) => buildBlock(block, idx, infScroll)))
      blocks.push(...res.contents)
      pagesLoaded += 1
    })

    infScroll.on('last', () => loadedLast = true)

    aestheticGallery.on('scroll', function (event) {
      const trueWidth = this.scrollWidth - $(this).parent().width()
      let maskImage = 'initial'

      if (event.target.scrollLeft === 0) {
        maskImage = 'linear-gradient(to right, black 0%, black 90%, transparent 99%)'
      } else if (event.target.scrollLeft > 0 && (!loadedLast || event.target.scrollLeft < trueWidth)) {
        maskImage = 'linear-gradient(to right, transparent 1%, black 10%, black 90%, transparent 99%)'
      } else if (event.target.scrollLeft === trueWidth) {
        maskImage = 'linear-gradient(to right, transparent 1%, black 10%, black 100%)'
      }

      $('#aestheticGalleryContainer').css('mask-image', maskImage)

      if (!loadedLast && event.target.scrollLeft >= 0.9 * trueWidth) {
        loadNextPage($(this), infScroll)
      }
    })

    aestheticGallery.on('wheel', function (event) {
      event.preventDefault()
      this.scrollBy({left: (event.originalEvent as WheelEvent).deltaY})
    })

    const originalWindowOnKeyUp = window.onkeyup
    const modal = $('cari-modal')

    modal.on('open', () => {
      window.onkeyup = (event) => {
        if (event.key === 'ArrowLeft') {
          if (selectedIndex > 0) {
            selectedIndex -= 1
            openBlock()
          }
        } else if (event.key === 'ArrowRight') {
          if (selectedIndex < blocks.length - 1) {
            selectedIndex += 1
            openBlock()
          } else if (!loadedLast) {
            $('#aestheticGallerySelection > .media').empty().append($(new CariSpinner()))

            loadNextPage($('#aestheticGallery'), infScroll, () => {
              if (!loadedLast) {
                selectedIndex += 1
              }

              openBlock()
            })
          }
        }
      }
    })

    modal.on('close', () => {
      window.onkeyup = originalWindowOnKeyUp
      aestheticGallery.css('overflow', '')
    })
  }
})

export {AestheticBlock, CariModal}