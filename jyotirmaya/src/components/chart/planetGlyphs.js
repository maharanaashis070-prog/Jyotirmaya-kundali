// Shared short-code + colour lookup for rendering planets compactly inside chart cells.
export const PLANET_CODE = {
  Sun: 'Su', Moon: 'Mo', Mars: 'Ma', Mercury: 'Me', Jupiter: 'Ju',
  Venus: 'Ve', Saturn: 'Sa', Rahu: 'Ra', Ketu: 'Ke', Uranus: 'Ur', Neptune: 'Ne', Pluto: 'Pl',
};

export function planetCode(name) {
  return PLANET_CODE[name] || name.slice(0, 2);
}
