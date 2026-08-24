const normalize = (value) => String(value ?? "").replace(/\s+/g, " ").trim();

export function classifyCatalogSubject(record, fallbackCategory) {
  const title = normalize(record.title).toLowerCase();
  const concise = [record.title, ...(record.keywords ?? [])]
    .map(normalize)
    .join(" ")
    .toLowerCase();

  if (/\b(earth observations?|earth limb|earth from space|andes|altiplano|arctic|antarctic|greenland|iceland|hurricane|wildfire|forest fire|deforestation|aurora australis|aurora borealis)\b/.test(title))
    return "EARTH";
  if (/^(ksc|jsc|afrc)[-_]/i.test(record.nasaId ?? record.nasa_id ?? "") || /\b(crew photo|crewmembers?|astronaut training|simulator|prototype|test campaign|aircraft|hangar|technician|instrument installed|spacecraft assembly)\b/.test(title))
    return "MISSIONS";
  if (/\b(mars|martian|jupiter|saturn|ganymede|uranus|neptune|mercury|venus|pluto|asteroid|comet|lunar|moon|crater dunes?|roving vehicle)\b/.test(concise))
    return "SOLAR SYSTEM";
  if (/\b(nebula|supernova remnant|stellar nursery|star.forming region)\b/.test(title))
    return "NEBULAE";
  if (/\b(galaxy|galaxies|andromeda)\b/.test(title))
    return "GALAXIES";
  return fallbackCategory;
}
