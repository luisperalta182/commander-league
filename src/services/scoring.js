// Motor de puntaje de la liga.
// TOTAL por partida = Resultado (posición) + Eliminaciones + Logros + Misión secreta.
import { POINTS, SECRET_MISSION_POINTS, achievementPoints, isLegendary } from './achievements'

// Compatibilidad: estos valores los usan algunas vistas para mostrar el reglamento.
export const POINTS_WIN = POINTS.win
export const POINTS_SECOND = POINTS.second
export const POINTS_PLAYED = POINTS.participate

// Calcula el desglose de puntos de un jugador dentro de una sola mesa (pod).
export function podPointsForPlayer(pod, playerId) {
  const pp = (pod.perPlayer && pod.perPlayer[playerId]) || {}
  const out = { result: 0, eliminations: 0, achievements: 0, mission: 0, total: 0, isWin: false, isSecond: false, legendary: 0 }

  // Resultado por posición (excluyente).
  if (pod.winnerId === playerId) { out.result = POINTS.win; out.isWin = true }
  else if (pod.secondId === playerId) { out.result = POINTS.second; out.isSecond = true }
  else { out.result = POINTS.participate }

  out.eliminations = (pp.eliminations || 0) * POINTS.elimination

  for (const achId of pp.achievements || []) {
    out.achievements += achievementPoints(achId)
    if (isLegendary(achId)) out.legendary += 1
  }

  if (pp.secretDone) out.mission = SECRET_MISSION_POINTS

  out.total = out.result + out.eliminations + out.achievements + out.mission
  return out
}

// Construye la clasificación a partir de los jugadores y todas las jornadas.
export function buildLeaderboard(players, matchDays) {
  const stats = new Map()
  for (const p of players) {
    stats.set(p.id, {
      player: p,
      points: 0,
      wins: 0,
      seconds: 0,
      games: 0,
      eliminations: 0,
      achievements: 0, // cantidad de logros
      legendary: 0,    // logros legendarios (desempate)
      missions: 0      // misiones secretas cumplidas
    })
  }

  for (const day of matchDays) {
    for (const round of day.rounds) {
      for (const pod of round.pods) {
        for (const playerId of pod.players) {
          const s = stats.get(playerId)
          if (!s) continue
          const bd = podPointsForPlayer(pod, playerId)
          const pp = (pod.perPlayer && pod.perPlayer[playerId]) || {}
          s.games += 1
          s.points += bd.total
          if (bd.isWin) s.wins += 1
          if (bd.isSecond) s.seconds += 1
          s.eliminations += pp.eliminations || 0
          s.achievements += (pp.achievements || []).length
          s.legendary += bd.legendary
          if (pp.secretDone) s.missions += 1
        }
      }
    }
  }

  const rows = [...stats.values()]
  // Desempates: puntos → logros legendarios → victorias → nombre.
  rows.sort(
    (a, b) =>
      b.points - a.points ||
      b.legendary - a.legendary ||
      b.wins - a.wins ||
      a.player.displayName.localeCompare(b.player.displayName)
  )
  return rows
}
