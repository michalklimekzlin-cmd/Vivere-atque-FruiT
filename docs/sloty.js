export const POCET_SLOTU = 70;

export function vytvoritPrazdnySlot(index) {
  return {
    id: index + 1,
    name: `Slot ${index + 1}`,
    content: "",
    updatedAt: null
  };
}

export function vytvoritPrazdneJadro() {
  return Array.from(
    { length: POCET_SLOTU },
    (_, index) => vytvoritPrazdnySlot(index)
  );
}
