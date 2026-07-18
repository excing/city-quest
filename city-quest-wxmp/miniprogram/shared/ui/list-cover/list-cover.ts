/**
 * List cover thumbnail with type-tinted monogram fallback.
 * Callers: history / favorites pages via usingComponents.
 * Props: src (resolved image URL), name (monogram source), typeColor (hex).
 */

import {
  colorWithAlpha,
  coverMonogram,
  LIST_COVER_DEFAULT_TYPE_COLOR,
  LIST_COVER_PLACEHOLDER_ALPHA,
} from './helpers'

function resolveView(
  src: string,
  name: string,
  typeColor: string,
): {
  hasCover: boolean
  monogram: string
  placeholderBg: string
  tintColor: string
} {
  const tint = typeColor || LIST_COVER_DEFAULT_TYPE_COLOR
  return {
    hasCover: Boolean(src),
    monogram: coverMonogram(name),
    placeholderBg: colorWithAlpha(tint, LIST_COVER_PLACEHOLDER_ALPHA),
    tintColor: tint,
  }
}

Component({
  properties: {
    /** Resolved cover URL; empty → monogram placeholder. */
    src: {
      type: String,
      value: '',
    },
    /** Place name; first grapheme used as monogram. */
    name: {
      type: String,
      value: '',
    },
    /** Encyclopedia type color (hex). */
    typeColor: {
      type: String,
      value: LIST_COVER_DEFAULT_TYPE_COLOR,
    },
  },

  data: {
    hasCover: false,
    monogram: '探',
    placeholderBg: colorWithAlpha(
      LIST_COVER_DEFAULT_TYPE_COLOR,
      LIST_COVER_PLACEHOLDER_ALPHA,
    ),
    tintColor: LIST_COVER_DEFAULT_TYPE_COLOR,
  },

  observers: {
    'src, name, typeColor'(src: string, name: string, typeColor: string) {
      this.setData(resolveView(src, name, typeColor))
    },
  },
})
