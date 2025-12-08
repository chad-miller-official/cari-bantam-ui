import {AestheticBlock} from "./components/aesthetic-block";
import {ArenaApiResponse, BlockClass, GalleryContent} from "./types";
import InfiniteScroll from "infinite-scroll";
import CariSpinner from "../components/spinner";
import {FullscreenModal} from "../components/modal";

declare const mediaSourceUrl: string

const MAX_PAGE_SIZE = 20

let totalPages = 1
let loadedLast = false

let blocks: GalleryContent[] = []

function openBlock(block: GalleryContent, idx: number, infScroll: InfiniteScroll) {
  let media = $('<p>').text('This media type is not supported.')

  switch (block.class) {
    case BlockClass.Link:
    case BlockClass.Image:
      media = $('<a>')
      .attr('href', block.source?.url || block.image.original.url)
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
  $('#aestheticGallerySelection > .sidebar > .title').text(block.title || '(no title)')
  $('#aestheticGallerySelection > .sidebar > .description').html(block.description_html || '(no description)')

  window.onkeyup = (event) => {
    if (event.key === 'ArrowLeft' && idx > 0) {
      openBlock(blocks[idx - 1], idx - 1, infScroll)
    } else if (event.key === 'ArrowRight') {
      if (idx < blocks.length - 1) {
        openBlock(blocks[idx + 1], idx + 1, infScroll)
      } else {
        $('#aestheticGallerySelection > .media').empty().append($(new CariSpinner()))

        loadNextPage($('#aestheticGallery'), infScroll, () => {
          openBlock(blocks[idx + 1], idx + 1, infScroll)
        })
      }
    }
  }

  $('#aestheticGallery').css('overflow', 'hidden')

  const modal = $('fullscreen-modal');
  (modal.get(0) as FullscreenModal).showModal()
}

function buildBlock(block: GalleryContent, idx: number, infScroll: InfiniteScroll): JQuery<HTMLElement> {
  const blockElement = $('<div>')
  .addClass('aesthetic-gallery-block')
  .on('click', () => openBlock(block, idx, infScroll))

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
    })

    infScroll.on('load', (res: ArenaApiResponse) => {
      aestheticGallery.append(...res.contents.map((block, idx) => buildBlock(block, idx, infScroll)))
      blocks.push(...res.contents)
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

    $('fullscreen-modal').on('close', () => {
      window.onkeyup = originalWindowOnKeyUp
      aestheticGallery.css('overflow', '')
    })
  }
})

export {AestheticBlock, FullscreenModal}