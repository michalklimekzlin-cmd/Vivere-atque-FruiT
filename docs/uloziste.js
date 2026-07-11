export const KLIC_PAMETI = "vaft_pamet_v1";

export function nacistJson(vychoziHodnota) {
  try {
    const ulozene = localStorage.getItem(KLIC_PAMETI);
    return ulozene ? JSON.parse(ulozene) : vychoziHodnota;
  } catch (chyba) {
    console.warn("Paměť se nepodařilo načíst.", chyba);
    return vychoziHodnota;
  }
}

export function ulozitJson(data) {
  localStorage.setItem(KLIC_PAMETI, JSON.stringify(data));
}
