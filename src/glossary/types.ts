import {Aesthetic} from '../aesthetic/types'

export type GlossaryTermCitation = {
  url: string,
  title: string,
}

export type GlossaryTerm = {
  term: string,
  description: string,
  citations: GlossaryTermCitation[],
  aesthetics: Aesthetic[],
  disciplines: string[],
  importStatusLabel?: string,
}