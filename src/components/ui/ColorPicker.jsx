import { useId, useState } from 'react'
import { Pipette } from 'lucide-react'
import { CATEGORY_COLORS } from '../../config/categories.js'
import { contrastTextOn, normalizeHex } from '../../utils/color.js'
import { TOUCH_TARGET, TOUCH_TARGET_LG } from '../../config/layout.js'

const CUSTOM = 'custom'

/**
 * Accent-colour chooser: on-brand presets plus any colour the user wants.
 *
 * Why a native `<input type="color">` is present but never visible
 * ---------------------------------------------------------------
 * An earlier attempt used the native control as the whole UI and was reverted:
 * on mobile it renders as an unlabelled filled bar that reads as a broken
 * progress element. The wheel itself is still the best way to *browse* colours,
 * though, so it stays — hidden behind a labelled 44px swatch, with a hex field
 * beside it for anyone who already knows the value they want. Two ways in, one
 * value out.
 *
 * State is seeded once per mount on purpose. Every consumer either lives inside
 * a Modal (which unmounts its body on close, so re-opening re-seeds) or owns the
 * value itself, so there is nothing to synchronise — and no effect racing the
 * user's keystrokes and rewriting the field while they type.
 *
 * @param {string}   value       Current colour, any hex shape.
 * @param {Function} onChange    Called with a normalised `#RRGGBB`, never partial input.
 * @param {string[]} [presets]   Swatches to offer. Defaults to the category palette.
 * @param {string}   [name]       Radio group name; needed when two pickers share a page.
 * @param {string}   [legend]
 * @param {boolean}  [hideLegend] Keep the legend for assistive tech only, for
 *                                callers whose surrounding disclosure already
 *                                names the control.
 * @param {string}   [className]
 */
export default function ColorPicker({
  value,
  onChange,
  presets = CATEGORY_COLORS,
  name = 'accent-color',
  legend = 'Accent colour',
  hideLegend = false,
  className = '',
}) {
  const uid = useId()
  const swatches = presets.map((preset) => normalizeHex(preset) ?? preset)
  const current = normalizeHex(value) ?? swatches[0]

  const [mode, setMode] = useState(swatches.includes(current) ? 'preset' : CUSTOM)
  const [text, setText] = useState(current)
  const [error, setError] = useState('')

  const emit = (next) => {
    setError('')
    onChange?.(next)
  }

  const choosePreset = (preset) => {
    setMode('preset')
    emit(preset)
  }

  const chooseCustom = () => {
    setMode(CUSTOM)
    // Carry the colour that is already selected into the field rather than
    // resetting to an arbitrary default — the user is refining, not restarting.
    setText(current)
    emit(current)
  }

  const changeWheel = (event) => {
    const normalized = normalizeHex(event.target.value)
    if (!normalized) return
    setText(normalized)
    emit(normalized)
  }

  const changeText = (event) => {
    const raw = event.target.value
    setText(raw)
    // Stay quiet while the value is still being typed: `#7C3A` is incomplete,
    // not wrong. Only commit once it resolves to a real colour.
    const normalized = normalizeHex(raw)
    if (normalized) emit(normalized)
  }

  const blurText = () => {
    const normalized = normalizeHex(text)
    if (normalized) {
      setText(normalized)
      return
    }
    setError('Enter a colour like #7C3AED.')
  }

  const isCustom = mode === CUSTOM
  const errorId = `${uid}-error`

  return (
    <fieldset className={className}>
      <legend className={hideLegend ? 'sr-only' : 'block font-sans text-xs font-bold uppercase tracking-wide text-ink/60'}>
        {legend}
      </legend>

      <div className={`${hideLegend ? '' : 'mt-2'} flex flex-wrap gap-2`} role="none">
        {swatches.map((preset) => (
          <label key={preset} className="cursor-pointer">
            <input
              type="radio"
              name={name}
              value={preset}
              checked={!isCustom && current === preset}
              onChange={() => choosePreset(preset)}
              className="peer sr-only"
            />
            <span
              className="block h-11 w-11 rounded-xl ring-2 ring-transparent ring-offset-2 ring-offset-paper transition-shadow peer-checked:ring-ink peer-focus-visible:ring-ink"
              style={{ backgroundColor: preset }}
            >
              <span className="sr-only">Use colour {preset}</span>
            </span>
          </label>
        ))}

        <label className="cursor-pointer">
          <input
            type="radio"
            name={name}
            value={CUSTOM}
            checked={isCustom}
            onChange={chooseCustom}
            className="peer sr-only"
          />
          <span
            className="flex h-11 w-11 items-center justify-center rounded-xl ring-2 ring-transparent ring-offset-2 ring-offset-paper transition-shadow peer-checked:ring-ink peer-focus-visible:ring-ink"
            style={{
              // Preview the chosen colour once custom is active; before that a
              // neutral tile keeps the row from implying a selection.
              backgroundColor: isCustom ? current : 'rgba(26,26,26,0.06)',
              color: isCustom ? contrastTextOn(current) : '#1A1A1A',
            }}
          >
            <Pipette className="h-5 w-5" aria-hidden="true" />
            <span className="sr-only">Choose a custom colour</span>
          </span>
        </label>
      </div>

      {isCustom && (
        <div className="mt-3 rounded-xl bg-cream/55 p-3 ring-1 ring-black/[0.07]">
          <div className="flex items-end gap-2">
            <label className="cursor-pointer">
              <span className="mb-1.5 block font-sans text-xs font-semibold text-ink/55">Wheel</span>
              {/* The label already carries a visible caption, so the accessible
                  name goes on the input itself rather than being assembled from
                  the caption plus a hidden string. */}
              <input
                type="color"
                value={current}
                onChange={changeWheel}
                aria-label="Open the colour wheel"
                className="peer sr-only"
              />
              <span
                className={`${TOUCH_TARGET_LG} flex w-12 items-center justify-center rounded-xl ring-1 ring-black/15 transition-shadow peer-focus-visible:ring-2 peer-focus-visible:ring-ink`}
                style={{ backgroundColor: current, color: contrastTextOn(current) }}
              >
                <Pipette className="h-4 w-4" aria-hidden="true" />
              </span>
            </label>

            <div className="min-w-0 flex-1">
              <label htmlFor={`${uid}-hex`} className="mb-1.5 block font-sans text-xs font-semibold text-ink/55">
                Hex code
              </label>
              <input
                id={`${uid}-hex`}
                type="text"
                value={text}
                onChange={changeText}
                onBlur={blurText}
                spellCheck="false"
                autoComplete="off"
                maxLength={7}
                placeholder="#7C3AED"
                aria-invalid={Boolean(error)}
                aria-describedby={error ? errorId : undefined}
                className={`${TOUCH_TARGET_LG} w-full rounded-xl bg-paper px-3 font-sans text-body uppercase tabular-nums text-ink ring-1 ring-black/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-career`}
              />
            </div>
          </div>

          {error
            ? <p id={errorId} role="alert" className="mt-2 font-sans text-body-sm font-semibold text-language">{error}</p>
            : (
              <p className="mt-2 flex items-center gap-2 font-sans text-body-sm text-ink/55">
                Preview
                <span
                  className={`${TOUCH_TARGET} inline-flex items-center rounded-full px-3 font-sans text-sm font-bold`}
                  style={{ backgroundColor: current, color: contrastTextOn(current) }}
                >
                  {current}
                </span>
              </p>
            )}
        </div>
      )}
    </fieldset>
  )
}
