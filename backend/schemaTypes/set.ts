import {defineArrayMember, defineField, defineType} from 'sanity'

type DjReference = {
  _ref?: string
}

export const setType = defineType({
  name: 'set',
  title: 'Set',
  type: 'document',
  fields: [
    defineField({
      name: 'djs',
      title: 'DJs',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'reference',
          to: [{type: 'dj'}],
        }),
      ],
      validation: (rule) =>
        rule
          .required()
          .min(2)
          .max(2)
          .custom(async (djs, context) => {
            if (!Array.isArray(djs) || !djs.length) {
              return true
            }

            const djIds = (djs as DjReference[]).map((dj) => dj._ref).filter(Boolean)

            if (new Set(djIds).size !== djIds.length) {
              return 'Choose two different DJs'
            }

            if (djIds.length !== 2) {
              return true
            }

            const client = context.getClient({apiVersion: '2025-06-01'})
            const documentId = context.document?._id?.replace(/^drafts\./, '')
            const excludedIds = documentId ? [documentId, `drafts.${documentId}`] : []
            const existingSet = await client.fetch(
              `*[
                _type == "set" &&
                !(_id in $excludedIds) &&
                references($djIds)
              ][0]._id`,
              {
                djIds,
                excludedIds,
              },
            )

            return !existingSet || 'One or more selected DJs are already in another set'
          }),
    }),
  ],
  preview: {
    select: {
      firstDJ: 'djs.0.name',
      secondDJ: 'djs.1.name',
    },
    prepare: ({firstDJ, secondDJ}: {firstDJ?: string; secondDJ?: string}) => ({
      title: [firstDJ, secondDJ].filter(Boolean).join(' - ') || 'Untitled set',
    }),
  },
})
