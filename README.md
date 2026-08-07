# FlowCards

**English** · [Português](README.pt-BR.md)

A custom **Power BI** visual that draws **one card per value of a category**, side by
side, and **filters the page when a card is clicked**.

![FlowCards](docs/screenshot.png)
<!-- docs/screenshot.png is a placeholder, drop a real screenshot here. -->

## What it is / when to use

It exists because no native visual does three things at once: look like a strip of
cards, respect an order defined by the model, and filter the page on click. The
native alternative tested for this, a matrix, was discarded by visual inspection.

Use it for a customer lifecycle (healthy, at risk, inactive, lost), a sales funnel,
an order-status breakdown, a stock-range split, or any category with few values
that benefits from being read in sequence, left to right.

The visual is generic: it does not know what "Healthy" means. It only draws a card
per category value, in the order it receives them, and reports the click.

## Fields

| Field | Required | Role |
|---|---|---|
| **Category** | yes | one card per distinct value |
| **Value** | yes | the card's big number |
| **Second value** | no | a smaller, secondary metric |
| **Second value label** | no | text above the second value |
| **Footnote** | no | small caption at the bottom of the card |
| **Color** | no | overrides the category's configured color |

**Second value label and Footnote are measures, not fixed text.** That is deliberate:
it lets the text change per card without the visual knowing why. For example
"Potential" on a healthy-customer card and "Recoverable this month" on an
at-risk one, "up to 75 days" on one card and "over 1 year" on another, each
written by a DAX measure that evaluates per category.

## Order of the cards

**The visual does not sort.** It respects the order Power BI delivers the
categories in, which comes from **Sort by column** on the model. This is
deliberate: keeping the ordering on the model means it applies the same way to
every visual on the report, not only to this one. If the cards come out in the
wrong order, the fix is the field's Sort by column, not a setting on this visual.

## Card with no second value

When **Second value** is blank for a card, **the number disappears and the label
stays**. There is no dash and no zero, because either would look like a null
value instead of a value that does not exist for that category. This is
configurable per field in **Show blank as** (Value and Second value cards), for
anyone who prefers to show something instead of nothing.

## Interaction

- Click a card: replaces the current selection
- Ctrl (or Cmd) + click: adds to the selection
- Click a selected card again: clears it
- Tab moves focus between cards, Enter or Space activates the focused one
- The selected card gets a highlight border; the rest dim

A toggle in the formatting pane turns multi-select off, for reports that should
lock to one card at a time.

## Formatting options

| Card | Property | Default |
|---|---|---|
| **Cards** | Max width (0 = no limit) | 0 |
| | Min height | 0 |
| | Corner radius | 10 px |
| | Gap | 9 px |
| | Inner padding | 13 px |
| **Category colors** | One color picker per category value | a fixed 8-color palette, cycled by position |
| **Title** | Font (family / size / bold / italic) | Segoe UI / 9.5 / bold |
| | Color | `rgba(255,255,255,0.64)` |
| | Transparency | 0% |
| | UPPERCASE | On |
| | Letter spacing | 0.8 px |
| **Value** | Font (family / size / bold / italic) | Segoe UI / 26 / bold |
| | Color | `#FFFFFF` |
| | Transparency | 0% |
| | Display units | Automatic |
| | Decimal places (-1 = auto) | 1 |
| | Show blank as | (empty) |
| **Second value label** | Font (family / size / bold / italic) | Segoe UI / 8.5 / bold |
| | Color | `rgba(255,255,255,0.52)` |
| | Transparency | 0% |
| **Second value** | Font (family / size / bold / italic) | Segoe UI / 13.5 / bold |
| | Color | `rgba(255,255,255,0.88)` |
| | Transparency | 0% |
| | Display units | None |
| | Decimal places (-1 = auto) | 0 |
| | Show blank as | (empty) |
| **Footnote** | Show | On |
| | Font (family / size / bold / italic) | Segoe UI / 10 / regular |
| | Color | `rgba(255,255,255,0.42)` |
| | Transparency | 0% |
| **Selection** | Allow multiple | On |
| | Dimmed opacity (the non-selected cards) | 38% |
| | Highlight border color | `#FFD98A` |
| | Border thickness | 2 px |

> **Display units** works like the native Power BI visuals: Automatic scales the
> number by its own magnitude (can turn 386,843 into 0.4M), None shows the raw
> number, and Thousands/Millions/Billions/Trillions fix the unit. The Value
> card defaults to Automatic (read at a glance); the Second value card defaults
> to None, because a secondary number is usually the one you read exactly, not
> compare at a glance.

## Build

Requires **Node.js** and [powerbi-visuals-tools](https://www.npmjs.com/package/powerbi-visuals-tools)
(`npm i -g powerbi-visuals-tools`).

```bash
npm install        # dependencies
npm test           # unit tests for the data logic (vitest)
npm run package     # produces dist/*.pbiviz
```

The resulting `.pbiviz` (in `dist/`) is what you import into Power BI.

## Import into Power BI Desktop

1. **Insert → More visuals → Import a visual from a file**.
2. Pick the `dist/*.pbiviz` file (or download it from the
   [Releases page](https://github.com/viniciusduartelage/flowcards/releases)).
3. "FlowCards" appears in the visualizations pane.

## Development (live)

```bash
npm start
```
With the **Developer visual** enabled in Power BI (Service or Desktop), the
visual reloads on every change.

## Project structure

```
src/visual.ts      # IVisual: render + interactions
src/settings.ts    # formatting pane cards (FormattingModel)
src/dataModel.ts   # pure logic (reads the dataView into a typed model), unit-tested
style/visual.less  # base styling (CSS variables fed by the formatting options)
capabilities.json  # fields + mapping + formatting objects
test/              # unit tests (vitest)
```

## Language

The UI is in **English** by default and switches to **Portuguese** automatically
when Power BI / Windows is set to Portuguese (pt-BR or pt-PT). Localization
follows the report's language (`host.locale`); other locales fall back to
English.

## License

[GPL-3.0-or-later](LICENSE) © 2026 Vinicius Duarte. Free and open source, all
features included. Anyone can use it (including companies), but any fork or
redistribution must stay open source under the GPL, so it cannot be closed and
resold as a proprietary product. Download the latest `.pbiviz` from the
[Releases page](https://github.com/viniciusduartelage/flowcards/releases) and
import it into Power BI.
