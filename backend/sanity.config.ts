import {defineConfig} from 'sanity'
import {structureTool, type StructureResolver} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemaTypes'

const singletonTypes = new Set(['currentlyPlaying'])

const structure: StructureResolver = (S) =>
  S.list()
    .title('Content')
    .items([
      S.listItem()
        .id('currentlyPlaying')
        .title('Currently playing')
        .child(S.document().schemaType('currentlyPlaying').documentId('currentlyPlaying')),
      S.divider(),
      ...S.documentTypeListItems().filter(
        (listItem) => !singletonTypes.has(listItem.getId() ?? ''),
      ),
    ])

export default defineConfig({
  name: 'default',
  title: 'waaw-2x2',

  projectId: 'e0jpcgds',
  dataset: 'production',

  plugins: [structureTool({structure}), visionTool()],

  schema: {
    types: schemaTypes,
  },

  document: {
    newDocumentOptions: (prev, {creationContext}) =>
      creationContext.type === 'global'
        ? prev.filter((templateItem) => !singletonTypes.has(templateItem.templateId))
        : prev,
    actions: (prev, {schemaType}) =>
      singletonTypes.has(schemaType)
        ? prev.filter(({action}) => action && !['delete', 'duplicate'].includes(action))
        : prev,
  },
})
