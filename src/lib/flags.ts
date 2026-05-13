// Country name → flag image URL (via flagcdn.com) + FIFA code
const countryData: Record<string, { iso: string; code: string }> = {
  "México":                 { iso: "mx", code: "MEX" },
  "Sudáfrica":              { iso: "za", code: "RSA" },
  "República de Corea":     { iso: "kr", code: "KOR" },
  "Chequia":                { iso: "cz", code: "CZE" },
  "Canadá":                 { iso: "ca", code: "CAN" },
  "Bosnia y Herzegovina":   { iso: "ba", code: "BIH" },
  "Australia":              { iso: "au", code: "AUS" },
  "Turquía":                { iso: "tr", code: "TUR" },
  "Estados Unidos":         { iso: "us", code: "USA" },
  "Paraguay":               { iso: "py", code: "PAR" },
  "Haití":                  { iso: "ht", code: "HAI" },
  "Escocia":                { iso: "gb-sct", code: "SCO" },
  "Brasil":                 { iso: "br", code: "BRA" },
  "Marruecos":              { iso: "ma", code: "MAR" },
  "Catar":                  { iso: "qa", code: "QAT" },
  "Suiza":                  { iso: "ch", code: "SUI" },
  "Alemania":               { iso: "de", code: "GER" },
  "Curasao":                { iso: "cw", code: "CUW" },
  "Costa de Marfil":        { iso: "ci", code: "CIV" },
  "Ecuador":                { iso: "ec", code: "ECU" },
  "España":                 { iso: "es", code: "ESP" },
  "Cabo Verde":             { iso: "cv", code: "CPV" },
  "Arabia Saudí":           { iso: "sa", code: "KSA" },
  "Uruguay":                { iso: "uy", code: "URU" },
  "Países Bajos":           { iso: "nl", code: "NED" },
  "Japón":                  { iso: "jp", code: "JPN" },
  "Suecia":                 { iso: "se", code: "SWE" },
  "Túnez":                  { iso: "tn", code: "TUN" },
  "Bélgica":                { iso: "be", code: "BEL" },
  "Egipto":                 { iso: "eg", code: "EGY" },
  "Irán":                   { iso: "ir", code: "IRN" },
  "Nueva Zelanda":          { iso: "nz", code: "NZL" },
  "Francia":                { iso: "fr", code: "FRA" },
  "Senegal":                { iso: "sn", code: "SEN" },
  "Irak":                   { iso: "iq", code: "IRQ" },
  "Noruega":                { iso: "no", code: "NOR" },
  "Argentina":              { iso: "ar", code: "ARG" },
  "Argelia":                { iso: "dz", code: "ALG" },
  "Austria":                { iso: "at", code: "AUT" },
  "Jordania":               { iso: "jo", code: "JOR" },
  "Inglaterra":             { iso: "gb-eng", code: "ENG" },
  "Croacia":                { iso: "hr", code: "CRO" },
  "Ghana":                  { iso: "gh", code: "GHA" },
  "Panamá":                 { iso: "pa", code: "PAN" },
  "Portugal":               { iso: "pt", code: "POR" },
  "RD Congo":               { iso: "cd", code: "COD" },
  "Uzbekistán":             { iso: "uz", code: "UZB" },
  "Colombia":               { iso: "co", code: "COL" },
  "Italia":                 { iso: "it", code: "ITA" },
};

// Sorted list of all WC 2026 country names (for autocomplete in admin)
export const countryNames: string[] = Object.keys(countryData).sort((a, b) =>
  a.localeCompare(b, "es")
);

function findEntry(teamName: string) {
  if (countryData[teamName]) return countryData[teamName];
  const lower = teamName.toLowerCase();
  const found = Object.entries(countryData).find(([k]) => k.toLowerCase() === lower);
  return found ? found[1] : null;
}

export function getFlagUrl(teamName: string): string {
  const data = findEntry(teamName);
  if (!data) return "https://flagcdn.com/w80/un.png";
  return `https://flagcdn.com/w80/${data.iso}.png`;
}

export function getCode(teamName: string): string {
  return findEntry(teamName)?.code || teamName.substring(0, 3).toUpperCase();
}

// Keep emoji version as fallback
export function getFlag(teamName: string): string {
  return ""; // No longer used, replaced by getFlagUrl
}
