# Plea Simulation Animation Assets

This repository contains the original Adobe Animate `.fla`, exported HTML Canvas `.js`, and any image files (background, foreground, cached) for each animated scene of the [plea bargain simulation](https://github.com/Plea-Justice/pleabargain-simulation). A project overview and detailed documentation are available at [pleajustice.org](https://pleajustice.org).

## Developer Notes

* Adobe exports animated assets to CreateJS Canvas. The generated `.js` files include an internal "composition ID" which necesitates a lookup table to match asset name to ID. The publishing script adds a lookup table for this at `window.FILE_TO_ID`. These internal IDs must be unique, though it is not always the case that Animate gives assets unique IDs. For example, if `.fla` is copied to make a similar asset, the resulting `.js` files will have the same internal IDs and will not be able to be loaded by the simulation. To solve this, manually change any identical IDs.

```bash
$ cat assets/clips/Larceny_FlashbackInnocent.js | grep -o "id: '.*$" | cut -d "'" -f 2
DB4EA2F77FBC49619D87EB89080157A4

$ cat assets/clips/Larceny_FlashbackGuilty.js | grep -o "id: '.*$" |  cut -d "'" -f 2
DB4EA2F77FBC49619D87EB89080157A4

$ sed -i 's/DB4EA2F77FBC49619D87EB89080157A4/DB4EA2F77FBC49619D87EB89080157A5/g' Larceny_FlashbackInnocent.js
```

* Bitmap caching is supported by the simulation code, but separate image files are *not* by the console. Assets that require a separate `images/` directory are problematic to upload to the console and also to load when the simulation is run or when thumbnails are generated. Because of this you may still use bitmap cache on symbols, but you should *disable* 'Export Images' in the [publishing settings](https://helpx.adobe.com/be_en/animate/using/creating-publishing-html5-canvas-document.html#OptimizingHTML5Canvasoutput).

* The publishing script is run automatically by the console when a file is uploaded. If you need to do fine tuned customizations to the `.js` file, you may manually publish using the script in this repository.

* The simulation is no longer backwards compatible with Adobe Animate 20.0.3 or below. All assets must be exported with Animate >=20.0.4.

---

Copyright (C) 2021, The Plea Justice Project. Licensed under GPLv3.
