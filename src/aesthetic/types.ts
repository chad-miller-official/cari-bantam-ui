export enum ArenaBlockType {
  Text = "Text",
  Image = "Image",
  Link = "Link",
  Attachment = "Attachment",
  Embed = "Embed",
  Channel = "Channel",
}

export type ArenaImage = {
  altText?: string,
  medium: {
    src: string,
  },
  large: {
    src: string,
  },
  square: {
    src: string,
  },
}

export type TextBlock = {
  type: ArenaBlockType.Text,
  content: {
    html: string,
    plain: string,
  },
}

export type ImageBlock = {
  type: ArenaBlockType.Image,
  image: ArenaImage,
}

export type LinkBlock = {
  type: ArenaBlockType.Link,
  image?: ArenaImage,
}

export type AttachmentBlock = {
  type: ArenaBlockType.Attachment,
  attachment: {
    contentType: string,
    url: string,
  },
  image?: ArenaImage,
}

export type EmbedBlock = {
  type: ArenaBlockType.Embed,
  embed: {
    html: string,
  },
  image?: ArenaImage,
}

export type ArenaBlock = {
  title: string,
  description: {
    html: string,
    plain: string,
  },
  source?: {
    url: string,
  },
} & (TextBlock | ImageBlock | LinkBlock | AttachmentBlock | EmbedBlock | {
  type: ArenaBlockType.Channel
})

export type ArenaApiMeta = {
  totalPages: number,
}

export type ArenaApiResponse = {
  data: ArenaBlock[],
  meta: ArenaApiMeta,
}

export type Aesthetic = {
  name: string,
  urlSlug: string,
  startYear: string,
  endYear: string,
  decadeYear: number,
  displayImageUrl: string,
  preview?: boolean,
  importStatus?: number,
}