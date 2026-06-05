import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { visionTool } from '@sanity/vision';
import { schemaTypes } from './schemaTypes';
const singletonTypes = new Set(['currentlyPlaying', 'portfolio']);
const structure = (S) => S.list()
    .title('Content')
    .items([
    S.listItem()
        .id('currentlyPlaying')
        .title('Currently playing')
        .child(S.document().schemaType('currentlyPlaying').documentId('currentlyPlaying')),
    S.listItem()
        .id('portfolio')
        .title('Portfolio')
        .child(S.document().schemaType('portfolio').documentId('portfolio')),
    S.divider(),
    ...S.documentTypeListItems().filter((listItem) => { var _a; return !singletonTypes.has((_a = listItem.getId()) !== null && _a !== void 0 ? _a : ''); }),
]);
export default defineConfig({
    name: 'default',
    title: 'waaw-2x2',
    projectId: 'e0jpcgds',
    dataset: 'production',
    plugins: [structureTool({ structure }), visionTool()],
    schema: {
        types: schemaTypes,
    },
    document: {
        newDocumentOptions: (prev, { creationContext }) => creationContext.type === 'global'
            ? prev.filter((templateItem) => !singletonTypes.has(templateItem.templateId))
            : prev,
        actions: (prev, { schemaType }) => singletonTypes.has(schemaType)
            ? prev.filter(({ action }) => action && !['delete', 'duplicate'].includes(action))
            : prev,
    },
});
