import {customElement, property, queryAssignedElements, state} from 'lit/decorators.js'
import axios, {AxiosResponse} from 'axios'
import CariSpinner from '../components/spinner'
import {GlossaryTerm} from './types'
import {css, html, LitElement} from 'lit'

import {AestheticBlock} from "../aesthetic/components/aesthetic-block"

const selectedColor = css`#e7e7e7`
const letterGroups = ['A-C', 'D-F', 'G-I', 'J-L', 'M-O', 'P-S', 'T-V', 'W-Z']

@customElement('glossary-terms-list')
export class GlossaryTermsList extends LitElement {
  static styles = css`
    @media screen and (max-width: 800px) {
      #glossaryHeader {
        flex-direction: column;
      }

      #letterSelector {
        max-width: 100%;
        overflow-x: scroll;
      }

      #letterSelector li {
        min-width: fit-content;
      }

      h1 {
        margin-block-end: 0;
      }
    }

    @media screen and (min-width: 801px) {
      #glossaryHeader {
        gap: 16px;
      }

      #letterSelector li {
        font-size: 1.2em;
      }
    }

    @media screen and (min-width: 1232px) {
      #letterSelector li {
        font-size: 1.4em;
      }
    }

    #glossaryHeader {
      align-items: center;
      display: flex;
    }

    #letterSelector {
      --selected-color: #e7e7e7;
      border: #cdcdcd 1px solid;
      display: flex;
      padding-inline-start: 0;
    }

    #letterSelector li {
      border-radius: 4px;
      display: inline;
      padding: 8px;
      margin: 8px;
    }

    #letterSelector li:hover {
      background-color: ${selectedColor};
      cursor: pointer;
    }

    #letterSelector li[selected] {
      background-color: ${selectedColor};
    }

    #letterSelector li[selected]:hover {
      cursor: initial;
    }

    h1 {
      font-size: 1.75em;
    }
  `

  @property()
  apiEndpoint: string

  @state()
  currentLetter = letterGroups[0]

  @queryAssignedElements({slot: 'glossaryTerms'})
  glossaryTerms: HTMLElement[]

  handleLetterChange(letter: string) {
    this.currentLetter = letter
    const params = {letterRange: letter}

    axios.get<Map<string, GlossaryTerm[]>>(this.apiEndpoint, {params})
    .then((res: AxiosResponse<Map<string, GlossaryTerm[]>>) => {
      const newTermsList = Object.keys(res.data).sort().map(firstLetter => {
        /* termForLetters */

        const termsForLetter = res.data[firstLetter].map((glossaryTerm: GlossaryTerm) => {
              const termForLetterTemplate = document.getElementById(
                  'termForLetter') as HTMLTemplateElement

              const termForLetter = termForLetterTemplate.content.cloneNode(true) as Element

              if (glossaryTerm.importStatusLabel) {
                termForLetter.querySelector('div').classList.add(`${glossaryTerm.importStatusLabel.toLowerCase()}-object`, 'glossary-job-object')
              }

              termForLetter.querySelector('h3').textContent = glossaryTerm.term

              const termData = termForLetter.querySelector('dd')
              termData.innerHTML = glossaryTerm.description

              /* assets - References */

              const citations = glossaryTerm.citations

              if (citations?.length > 0) {
                const referencesTemplate = document.getElementById(
                    'citations') as HTMLTemplateElement

                const references = referencesTemplate.content.cloneNode(true) as Element
                references.querySelector('.glossary-asset-header').textContent = 'References'

                const referenceLis = citations.map(citation => {
                  const assetAnchorTemplate = document.getElementById(
                      'assetAnchor') as HTMLTemplateElement

                  const assetAnchor = assetAnchorTemplate.content.cloneNode(true) as Element
                  const anchor = assetAnchor.querySelector('a')
                  anchor.href = citation.url
                  anchor.innerText = citation.title

                  return assetAnchor
                })

                references.querySelector('ol').replaceChildren(...referenceLis)
                termData.append(references)
              }

              /* assets - Relevant Aesthetics */

              const aesthetics = glossaryTerm.aesthetics

              if (aesthetics?.length > 0) {
                const aestheticsTemplate = document.getElementById(
                    'relevantAesthetics') as HTMLTemplateElement

                const relevantAesthetics = aestheticsTemplate.content.cloneNode(true) as Element

                relevantAesthetics.querySelector('.glossary-asset-header').textContent =
                    'Relevant Aesthetics'

                const aestheticBlocks = aesthetics.map(aesthetic => {
                  const aestheticBlock = new AestheticBlock()
                  aestheticBlock.name = aesthetic.name
                  aestheticBlock.urlSlug = aesthetic.urlSlug
                  aestheticBlock.startYear = aesthetic.startYear
                  aestheticBlock.endYear = aesthetic.endYear
                  aestheticBlock.displayImageUrl = aesthetic.displayImageUrl
                  return aestheticBlock
                })

                const section = relevantAesthetics.querySelector('section')
                section.classList.add('glossary-aesthetic-blocks')
                section.replaceChildren(...aestheticBlocks)

                termData.append(relevantAesthetics)
              }

              return termForLetter
            }
        )

        /* letterBlock */

        const letterBlockTemplate = document.getElementById(
            'letterBlock') as HTMLTemplateElement

        const letterBlock = letterBlockTemplate.content.cloneNode(true) as Element

        const letterHeader = letterBlock.querySelector('h2')
        letterHeader.textContent = firstLetter

        const opposite = document.createElement('span')
        opposite.textContent = firstLetter

        letterHeader.append(opposite)

        const dataList = letterBlock.querySelector('dl')

        if (termsForLetter.length > 0) {
          dataList.replaceChildren(...termsForLetter)
        } else {
          const emptyPlaceholder = document.createElement('p')
          emptyPlaceholder.textContent = '(no terms)'
          emptyPlaceholder.classList.add('glossary-term-description')
          dataList.replaceChildren(emptyPlaceholder)
        }

        return letterBlock
      })

      this.glossaryTerms[0].replaceChildren(...newTermsList)
    })

    this.glossaryTerms[0].replaceChildren(new CariSpinner())
  }

  render() {
    return html`
      <article>
        <section id="glossaryHeader">
          <h1>Glossary of Terms</h1>
          <ol id="letterSelector">
            ${letterGroups.map(letter => html`
              <li @click=${this.currentLetter === letter ? () => null :
                  () => this.handleLetterChange(letter)}
                  ?selected=${this.currentLetter === letter}>${letter}
              </li>`)}
          </ol>
        </section>
        <slot name="glossaryTerms"></slot>
      </article>`
  }
}

export {
  AestheticBlock,
  CariSpinner,
}