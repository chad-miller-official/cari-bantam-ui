export enum BlockClass {
  Attachment = 'Attachment',
  Image = 'Image',
  Link = 'Link',
  Media = 'Media',
  Text = 'Text',
}

export type GalleryAttachment = {
  content_type: string,
  url: string,
}

export type GalleryEmbed = {
  html: string,
}

export type GalleryImage = {
  url: string,
}

export type GalleryImages = {
  display: GalleryImage,
  original: GalleryImage,
  square: GalleryImage,
}

export type GallerySource = {
  url: string,
}

export type GalleryContent = {
  attachment: GalleryAttachment
  class: BlockClass,
  content: string,
  content_html: string,
  description: string,
  description_html: string,
  embed: GalleryEmbed,
  id: number,
  image: GalleryImages,
  source: GallerySource,
  title: string,
}

export type ArenaApiResponse = {
  contents?: GalleryContent[],
  length: number,
}

export type Aesthetic = {
  name: string,
  urlSlug: string,
  startYear: string,
  endYear: string,
  decadeYear: number,
  displayImageUrl: string,
  isPreview?: boolean,
  importStatusLabel?: string,
}