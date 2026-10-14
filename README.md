# Carousel Desktop

A desktop theme. The backglass picture of the selected table fills the screen. Along the
bottom a dark band holds up to nine wheels with the selected one in the middle, larger and
lifted above the rest. Above the band the table's name and its manufacturer and year are on the
left, and its authors are on the right. A table with no backglass or full single screen picture
leaves the screen dark, and a table with no wheel is named in the row.

![Carousel Desktop](preview.png)

Requires VPinFE 3.0 or later (`min_vpinfe` in `manifest.json`). This is the 3.0 rebuild of
Carousel Desktop, so its version is 2.0.0.

## What is here

```
manifest.json         name, version, author, min_vpinfe and the windows the theme draws
index_playfield.html  the playfield page
style.css             the look
theme.js              the behavior
fonts/                Rocket Command Expanded and Gradient
preview.png           shown in the theme list
```

There is no `options.json`: the theme has nothing a person can change.

## The manifest

JSON cannot carry comments, so what each field does is here.

| Field | What it does |
| --- | --- |
| `name`, `version`, `author`, `description` | Shown in the theme list. `version` is the theme's own release number |
| `preview_image` | The screenshot shown in the theme list |
| `type` | `desktop`: the theme is made for a single desktop screen |
| `min_vpinfe` | The oldest VPinFE that can run the theme |
| `windows` | The pages the theme draws. Carousel Desktop draws `playfield` only, so core's backglass and score view pages are used |
| `change_log` | A string, shown as "What's new" to someone installing or updating the theme |

## The four parts of theme.js

`theme.js` has four parts, in this order, each commented:

1. **Options** - there are none; the part says so.
2. **The list** - the row of wheels. Up to nine are drawn, seven larger ones in the collection
   picker, always with the selection in the middle. A wheel that is still on screen after the
   row moves keeps its element, so it glides to its new place, and the one the row has just
   brought to the middle shakes. A table with no wheel picture is named instead.
3. **The selection** - everything about the selected table is on its entry: the name, the
   manufacturer and year, the authors and the art. The art is the backglass picture, else the
   full single screen picture. A new picture loads behind the old one and fades in over it.
   In the collection picker the text holds the collection's name and the number of tables,
   and there is no art.
4. **Messages** - hand every message to core, then redraw.

## The page

| Element | What it holds |
| --- | --- |
| `#art` | The backglass picture |
| `#info` | The band above the wheels that holds the text |
| `#title`, `#meta` | The table's name, and its manufacturer and year; in the picker, the collection's name and "N Tables" |
| `#credit`, `#authors` | The authors label and the table's authors |
| `#wheels` | The row of wheels |
| `#empty` | "No tables found", shown when the list is empty |

A long name or authors line is set smaller so it keeps to its corner. The middle of the line
is left free for the selected wheel, which rises into it.

The page's outermost element carries `vpinfe-upright`, so core can turn the whole page for a
cabinet screen mounted on its side. The stage is styled by class, not by id, so the rules in
`vpinfe-style.css` that size it for a turned screen still win. Lengths are fractions of the
stage (`cqw`, `cqh`), and a wheel is a square no wider than a tenth of it, so nine always fit
on a screen of any shape.

Three pieces of text are fixed English and not translated: the word "Authors" in the page, the
"Table" and "Tables" after a collection's count, and the `aria-label` on the row of wheels. The
"Unknown Table" and "Unknown Author" fallbacks and "No tables found" go through `vpin.t`.

## What core does, so this theme does not

| Core handles | The theme's part |
| --- | --- |
| Keys, buttons and the remote: stepping, paging, the menu and the collection picker | Launch on `select` |
| Moving the selection and wrapping around the list | Draw the selected table (`activeList().current`) and the wheels around it (`indexAfter`) |
| Serving the table's media | Ask for the backglass, full single screen or wheel picture by name, and name the table when it has no wheel |
| Audio for the selected table | Nothing |
| Preloading the neighbors | Nothing |
| Turning the page for a sideways cabinet screen | `vpinfe-upright` on the stage |
| The loading indicator while a table starts | Restyle `.vpinfe-launch-spinner` |
| Attract mode | Nothing |
| The backglass and score view pages | Nothing: Carousel Desktop ships none, so core's are used |

## Opt-outs

Carousel Desktop uses none. There is no `config.json`.
