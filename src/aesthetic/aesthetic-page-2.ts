import {AestheticBlock} from "./components/aesthetic-block";
import {ArenaApiResponse, BlockClass, GalleryContent} from "./types";
import InfiniteScroll from "infinite-scroll";

declare const mediaSourceUrl: string

const MAX_PAGE_SIZE = 20

let totalPages = 1
let loadedLast = true

function buildBlock(block: GalleryContent): JQuery<HTMLElement> {
  const blockElement = $('<div>').addClass('aesthetic-gallery-block')
  let content: JQuery<HTMLElement>

  if (
      block.class === BlockClass.Link ||
      block.class === BlockClass.Image ||
      block.class === BlockClass.Media ||
      (block.class === BlockClass.Attachment && block.image)
  ) {
    content = $('<img>')
    .attr('src', block.image.square.url)
    .attr('alt', block.title)
  } else {
    content = block.class === BlockClass.Text
        ? $('<p>').text(block.content.length > 100 ? block.content.substring(0, 97) + '...' : block.content)
        : $('<h3>').text('No Preview')
  }

  return blockElement.append(content)
}

$(() => {
  const aestheticGallery = $('#aestheticGallery')

  if (aestheticGallery.length) {
    const data = {
      page: 1,
      per: MAX_PAGE_SIZE,
    }

    $.get(mediaSourceUrl, data, (res: ArenaApiResponse) => {
      totalPages = Math.ceil(res.length / MAX_PAGE_SIZE)
      aestheticGallery.append(...res.contents.map(buildBlock))
    })

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

    infScroll.on('load', (res: ArenaApiResponse) => aestheticGallery.append(...res.contents.map(buildBlock)))
    infScroll.on('last', () => loadedLast = true)

    aestheticGallery.on('scroll', function (event) {
      const trueWidth = this.scrollWidth - $(this).parent().width()

      if (event.target.scrollLeft === 0) {
        $('#aestheticGalleryContainer').css('mask-image', 'linear-gradient(to right, black 0%, black 90%, transparent 99%)')
      } else if (event.target.scrollLeft > 0 && (!loadedLast || event.target.scrollLeft < trueWidth)) {
        $('#aestheticGalleryContainer').css('mask-image', 'linear-gradient(to right, transparent 1%, black 10%, black 90%, transparent 99%)')
      } else if (event.target.scrollLeft === trueWidth) {
        $('#aestheticGalleryContainer').css('mask-image', 'linear-gradient(to right, transparent 1%, black 10%, black 100%)')
      }

      if (event.target.scrollLeft >= 0.9 * trueWidth) {
        infScroll.loadNextPage()
      }
    })

    aestheticGallery.on('wheel', function (event) {
      event.preventDefault()
      this.scrollLeft += (event.originalEvent as WheelEvent).deltaY
    })
  }
})

export {AestheticBlock}