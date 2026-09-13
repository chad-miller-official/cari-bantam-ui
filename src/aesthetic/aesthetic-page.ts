import {ArenaApiResponse, ArenaBlock, ArenaBlockType,} from "./types";
import InfiniteScroll from "infinite-scroll";
import {CariModal} from "../components/modal";

declare const apiEndpoint: string

const MAX_PAGE_SIZE = 20

let totalPages = 1
let loadedLast = false

let blocks: ArenaBlock[] = []
let pagesLoaded = 0

let selectedIndex: number

function openBlock() {
  const block = blocks[selectedIndex]
  let media: JQuery

  switch (block.type) {
    case ArenaBlockType.Link:
      if (block.source.url.startsWith('https://')) {
        media = $('<iframe>')
          .attr('src', block.source.url)
          .addClass('website-media')
      } else {
        media = $('<a>')
          .attr('href', block.source.url)
          .attr('target', 'blank')
          .append(
            $('<img>')
              .attr('src', block.image.medium.src)
              .attr('alt', block.image.altText)
          )
      }

      break
    case ArenaBlockType.Image:
      media = $('<a>')
        .attr('href', block.image.large.src)
        .attr('target', '_blank')
        .append(
          $('<img>')
            .attr('src', block.image.medium.src)
            .attr('alt', block.image.altText)
        )

      break
    case ArenaBlockType.Attachment:
      const contentType = block.attachment.contentType

      if (contentType.split('/')[0] === 'video') {
        media = $('<video autoplay controls muted>')
          .append(
            $('<source>')
              .attr('src', block.attachment.url)
              .text('Your browser does not support video playback.')
          )
      } else if (contentType === 'application/pdf') {
        media = $('<object>')
          .attr('data', block.attachment.url)
          .attr('type', contentType)
          .addClass('attachment-media')
      }

      break
    case ArenaBlockType.Embed:
      media = $(block.embed.html)
      break
    case ArenaBlockType.Text:
      media = $('<div>')
        .addClass('text-media')
        .html(block.content.html)

      break
    default:
      media = $('<p>').text('This media type is not supported.')
      break
  }

  $('#aestheticGallerySelection > .media').empty().append(media)
  $('#aestheticGallerySelection > .sidebar .title').text(block.title || '(no title)')
  $('#aestheticGallerySelection > .sidebar .description').html(block.description.html || '(no description)')

  const sidebarWebsite = $('#aestheticGallerySelection > .sidebar .website')

  if (block.type === ArenaBlockType.Link) {
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

function buildBlock(block: ArenaBlock, idx: number): JQuery<HTMLElement> {
  const blockElement = $('<div>')
    .addClass('aesthetic-gallery-block')
    .data('index', (idx + (MAX_PAGE_SIZE * pagesLoaded)))
    .on('click', function () {
      selectedIndex = $(this).data('index')
      openBlock()
    })

  let content: JQuery<HTMLElement>

  if (
    block.type === ArenaBlockType.Link ||
    block.type === ArenaBlockType.Image ||
    block.type === ArenaBlockType.Embed ||
    (block.type === ArenaBlockType.Attachment && block.image)
  ) {
    content = $('<img>').addClass('image-preview')
      .attr('src', block.image.square.src)
      .attr('alt', block.title)
  } else {
    content = block.type === ArenaBlockType.Text
      ? $('<p>').addClass('text-preview').text(block.content.plain)
      : $('<h3>').text('No Preview')
  }

  return blockElement.append(content)
}

function handleArenaApiResponse(res: ArenaApiResponse) {
  const resToShow = res.data.filter(block => block.type !== 'Channel')
  $('#aestheticGallery').append(...resToShow.map((block, idx) => buildBlock(block, idx)))
  blocks.push(...resToShow)
  pagesLoaded += 1

  if (pagesLoaded === totalPages) {
    InfiniteScroll.data('#aestheticGallery').loadNextPage()
  }
}

$(() => {
  $('.tooltip').tooltipster({
    maxWidth: 400,
    theme: 'tooltipster-borderless',
    trigger: 'click',
  })

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
          return `${apiEndpoint}?page=${infScroll.pageIndex + 1}&per=${MAX_PAGE_SIZE}`
        }
      },
      responseBody: 'json',
      history: false,
      button: '.aesthetic-gallery-show-more-button',
      scrollThreshold: false,
      status: '.spinner',
    })

    $.get(apiEndpoint, data, (res: ArenaApiResponse) => {
      totalPages = res.meta.totalPages
      handleArenaApiResponse(res)

      if (totalPages <= 1) {
        $('.aesthetic-gallery-show-more-button').remove()
      }
    })

    infScroll.on('load', (res: ArenaApiResponse) => handleArenaApiResponse(res))
    infScroll.on('last', () => loadedLast = true)

    const originalWindowOnKeyUp = window.onkeyup
    const modal = $('cari-modal')
    const media = $('#aestheticGallerySelection > .media')

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
            const spinner = $('<div>').addClass('.spinner')
            media.empty().append(spinner)

            infScroll.loadNextPage().then(() => {
              selectedIndex += 1
              openBlock()
            })
          }
        }
      }
    })

    modal.on('close', () => {
      media.empty()
      window.onkeyup = originalWindowOnKeyUp
      aestheticGallery.css('overflow', '')
    })
  }
})