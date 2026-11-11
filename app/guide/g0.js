/* Mirror-HR User Guide: the text of the guide.
   This is the ONE place where the guide is written. The Guide page in the app and the PDF are both built from the files in this folder.
   RULE: when something in the ERP changes, change its entry here too, then rebuild the PDF (node tools/build-guide.js).
   Every text is a pair [English, Hindi].
   An entry: { id: the tab key used in the app (for example 'earned'), n: name, path: where to find it, what, why, who, steps: [...], notes: [...], hr: true if only HR and Admin use it } */
window.GUIDE = window.GUIDE || [];
window.G = function (id, name, desc, entries) { window.GUIDE.push({ id: id, name: name, desc: desc, entries: entries }); };
