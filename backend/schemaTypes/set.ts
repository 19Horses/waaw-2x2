import {defineArrayMember, defineField, defineType} from 'sanity'

const hourTimeslotPattern = /^([01]?\d|2[0-3])-([01]?\d|2[0-3])$/

type DjReference = {
  _ref?: string
}

export const setType = defineType({
  name: 'set',
  title: 'Set',
  type: 'document',
  fields: [
    defineField({
      name: 'time',
      title: 'Time',
      type: 'string',
      description: 'Hour timeslot, for example 10-11.',
      validation: (rule) =>
        rule.required().custom((time) => {
          const match = time?.match(hourTimeslotPattern)

          if (!match) {
            return 'Use an hour timeslot like 10-11'
          }

          const startHour = Number(match[1])
          const endHour = Number(match[2])

          return endHour === startHour + 1 || 'Timeslot must be exactly one hour'
        }),
    }),
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
})
