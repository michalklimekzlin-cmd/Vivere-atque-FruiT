# GLYPH · třetí archiv · částečná záchrana

Zde je zkopírovaný **celý obsah třetího zachráněného ZIPu** jako jednotlivé soubory. Obsahuje 492 původních zachráněných souborů s platným CRC a dvě přiložené zprávy (**494 položek**). Soubor původního velkého ZIPu byl nedokončený, takže tento archiv **není úplný projekt**.

**Proč zde není jeden nový 64MB ZIP?** Naprostou většinu jeho obsahu už GitHub měl uloženou v totožných Git blobech. Ty jsme znovu využili, aby nedocházelo ke zbytečnému nahrávání velkých duplicit. Sedm skutečně chybějících položek bylo přeneseno a ověřeno kontrolním SHA-1.

Obsah leží v `data/`. Seznam všech souborů a původních Git hashů je v `manifest.json`. Pro vytvoření nového ZIPu ze stejného obsahu spusť v této složce `python3 obnovit_zip.py`. Výstupní ZIP bude obsahově shodný, ale nemusí být binárně totožný (ZIP metadata a komprese).

Pozor: pracovní větev je veřejná, avšak archivní soubory jsou v oddělené složce. Cesty `.github/workflows` **nejsou aktivní workflow repozitáře**. Nesynchronizovat tuto archivní složku do kořene projektu a neobnovovat staré skenery.

**Nedotčeno:** větev `main`, živé PWA GLYPH, CHT a Batole. Data z iPhonu nejsou zahrnuta.
