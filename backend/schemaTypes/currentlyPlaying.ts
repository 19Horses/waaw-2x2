import {defineField, defineType} from 'sanity'

export const currentlyPlayingType = defineType({
  name: 'currentlyPlaying',
  title: 'Currently playing',
  type: 'document',
  fields: [
    defineField({
      name: 'set',
      title: 'Set',
      type: 'reference',
      to: [{type: 'set'}],
      validation: (rule) => rule.required(),
    }),
  ],
})
