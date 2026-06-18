// Catálogo de logros y misiones secretas de la liga.
// Los puntos de cada logro dependen de su rareza.

export const RARITIES = {
  comun:      { label: 'Común',      points: 1, color: '#4ade80', emoji: '🟢' },
  raro:       { label: 'Raro',       points: 2, color: '#3b82f6', emoji: '🔵' },
  epico:      { label: 'Épico',      points: 3, color: '#a78bfa', emoji: '🟣' },
  legendario: { label: 'Legendario', points: 5, color: '#f59e0b', emoji: '🟠' }
}

export const MAX_ACHIEVEMENTS_PER_GAME = 4
export const SECRET_MISSION_POINTS = 2

// Reglas de puntos de resultado (por posición).
export const POINTS = {
  win: 5,        // 1.º lugar
  second: 2,     // 2.º lugar
  participate: 1,// el resto por participar
  elimination: 1 // por cada jugador eliminado
}

export const ACHIEVEMENTS = [
  // 🟢 Comunes
  { id: 'no-seas-codo',        name: 'No seas codo',           rarity: 'comun', desc: 'Ayudas a otro jugador sin beneficio inmediato.' },
  { id: 'el-cantadito',        name: 'El Cantadito',           rarity: 'comun', desc: 'Robas exactamente la carta que te salva o cambia la partida.' },
  { id: 'ruta-110',            name: 'Ruta 110',               rarity: 'comun', desc: 'Terminas un turno complicado en menos de 60 segundos.' },
  // 🔵 Raros
  { id: 'toro-huaco',          name: 'Toro Huaco',             rarity: 'raro', desc: 'Atacas con todas tus criaturas.' },
  { id: 'coyoton',             name: 'Coyotón',                rarity: 'raro', desc: 'Convences a otro jugador de atacar a un tercero.' },
  { id: 'tona-amistad',        name: 'Toña de la Amistad',     rarity: 'raro', desc: 'Mantienes un pacto 2 rondas completas.' },
  { id: 'la-purisima',         name: 'La Purísima',            rarity: 'raro', desc: 'Regalas recursos a 2 jugadores en la misma partida.' },
  // 🟣 Épicos
  { id: 'la-gigantona',        name: 'La Gigantona',           rarity: 'epico', desc: 'La mesa vota tu jugada como la más épica.' },
  { id: 'sobreviviente-masaya',name: 'Sobreviviente de Masaya',rarity: 'epico', desc: 'Sobrevives una ronda a 1–5 vidas.' },
  { id: 'el-gran-politico',    name: 'El gran político',       rarity: 'epico', desc: 'Creas una alianza activa entre 3 jugadores.' },
  { id: 'mercado-oriental',    name: 'Mercado Oriental',       rarity: 'epico', desc: 'Controlas una gran mesa de permanentes (alto dominio de tablero).' },
  // 🟠 Legendarios
  { id: 'gran-cacique',        name: 'Gran Cacique',           rarity: 'legendario', desc: 'Ganas después de estar a 1 vida.' },
  { id: 'momotombo-maximo',    name: 'Momotombo Máximo',       rarity: 'legendario', desc: 'Eliminas 2 jugadores en un mismo turno.' },
  { id: 'conquistador-istmo',  name: 'Conquistador del Istmo', rarity: 'legendario', desc: 'Ganas desde una posición claramente desfavorable.' }
]

export const SECRET_MISSIONS = [
  { id: 'el-diplomatico',  name: 'El Diplomático',  emoji: '🕊️', desc: 'Logras que 2 jugadores se ataquen entre sí.' },
  { id: 'el-sobreviviente',name: 'El Sobreviviente',emoji: '🧠', desc: 'Sobrevives una ronda a 1–5 vidas.' },
  { id: 'el-coleccionista',name: 'El Coleccionista',emoji: '🎴', desc: 'Controlas 20 permanentes no tierras.' },
  { id: 'el-mago',         name: 'El Mago',         emoji: '🔮', desc: 'Lanzas 4 hechizos en un turno.' },
  { id: 'el-traficante',   name: 'El Traficante',   emoji: '💰', desc: 'Controlas 10 tesoros.' },
  { id: 'el-constructor',  name: 'El Constructor',  emoji: '👑', desc: 'Lanzas tu comandante 4 veces.' },
  { id: 'el-resucitador',  name: 'El Resucitador',  emoji: '♻️', desc: 'Recuperas 4 cartas del cementerio.' },
  { id: 'el-copion',       name: 'El Copión',       emoji: '🧩', desc: 'Copias 3 hechizos o habilidades.' }
]

// Índices para búsqueda rápida por id.
export const ACHIEVEMENT_BY_ID = Object.fromEntries(ACHIEVEMENTS.map((a) => [a.id, a]))
export const MISSION_BY_ID = Object.fromEntries(SECRET_MISSIONS.map((m) => [m.id, m]))

export function achievementPoints(id) {
  const a = ACHIEVEMENT_BY_ID[id]
  return a ? RARITIES[a.rarity].points : 0
}

export function isLegendary(id) {
  const a = ACHIEVEMENT_BY_ID[id]
  return a ? a.rarity === 'legendario' : false
}

// Agrupa el catálogo por rareza, en orden de menor a mayor valor.
export const ACHIEVEMENTS_BY_RARITY = ['comun', 'raro', 'epico', 'legendario'].map((r) => ({
  rarity: r,
  ...RARITIES[r],
  items: ACHIEVEMENTS.filter((a) => a.rarity === r)
}))
