import {defineField, defineType} from 'sanity'

export const userType = defineType({
  name: 'gameUser',
  title: 'User',
  type: 'document',
  initialValue: {
    score: 0,
  },
  fields: [
    defineField({
      name: 'id',
      title: 'ID',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'length',
      title: 'Length',
      type: 'number',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'colour',
      title: 'Colour',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'score',
      title: 'Score',
      type: 'number',
      initialValue: 0,
    }),
    defineField({
      name: 'points',
      title: 'Points',
      type: 'number',
      validation: (rule) => rule.required(),
    }),
  ],
})
