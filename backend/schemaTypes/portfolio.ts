import {defineArrayMember, defineField, defineType} from 'sanity'

export const portfolioType = defineType({
  name: 'portfolio',
  title: 'Portfolio',
  type: 'document',
  fields: [
    defineField({
      name: 'image',
      title: 'Image',
      type: 'image',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'aboutText',
      title: 'About text',
      type: 'text',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'songs',
      title: 'Songs',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({
              name: 'title',
              title: 'Title',
              type: 'string',
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'artist',
              title: 'Artist',
              type: 'string',
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'audio',
              title: 'Audio',
              type: 'file',
              options: {
                accept: 'audio/*',
              },
              validation: (rule) => rule.required(),
            }),
          ],
          preview: {
            select: {
              title: 'title',
              artist: 'artist',
            },
            prepare: ({title, artist}: {title?: string; artist?: string}) => ({
              title: title || 'Untitled song',
              subtitle: artist,
            }),
          },
        }),
      ],
    }),
    defineField({
      name: 'secretMix',
      title: 'Secret mix',
      type: 'object',
      fields: [
        defineField({
          name: 'name',
          title: 'Name',
          type: 'string',
          validation: (rule) => rule.required(),
        }),
        defineField({
          name: 'audio',
          title: 'Audio',
          type: 'file',
          options: {
            accept: 'audio/*',
          },
          validation: (rule) => rule.required(),
        }),
      ],
    }),
    defineField({
      name: 'logo',
      title: 'Logo',
      type: 'image',
      validation: (rule) => rule.required(),
    }),
  ],
})
