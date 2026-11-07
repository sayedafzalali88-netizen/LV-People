# User Guide: how it is kept up to date

The guide is written in **one place**: the files `g0.js` to `g6.js` in this folder. Every text is a pair `[English, Hindi]`.

- The **Guide page in the app** (book icon next to the bell) reads these files.
- The **PDFs** (`LV-People-User-Guide-EN.pdf` and `-HI.pdf`) are built from the same files.

So the app, the guide and the PDF cannot disagree.

## The rule

When anything in the ERP changes (a new tab, a changed step, a new setting, a new workflow, a removed button), in the same piece of work:

1. Change or add its entry in the right `g*.js` file (what it is, why, who, step by step, notes).
2. Rebuild the PDFs: `node tools/build-guide.js` (needs Microsoft Edge or Chrome).
3. Open the Guide page as Admin and look at **Guide coverage**. It lists every tab of the left menu that has no entry. The list should shrink, never grow.
4. Commit the `g*.js` files and the two PDFs together with the change.

## An entry

```js
{ id: 'daily',                       // the tab key used in the app
  n: ['Daily work template', '...'],  // name
  path: ['Core Setting > Templates > Daily work template', '...'],
  what: [...], why: [...], who: [...],
  steps: [[en, hi], ...], notes: [[en, hi], ...],
  hr: true }                          // only HR and Admin see this entry in the app
```

A new module gets a new `G('page-id', [name], [description], [entries])`. The `page-id` is the page id of the app (for example `payroll`), because the app shows a module of the guide only to people who may open that page.

If a new file `g7.js` is added, add its `<script>` line next to the others at the end of `app/index.html`. `tools/build-guide.js` picks the files up by name.
