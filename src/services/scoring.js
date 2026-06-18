// Leaderboard scoring. Tweak the constants to change how the league is scored.
export const POINTS_WIN = 3
export const POINTS_PLAYED = 1 // participation point per game played

// Build a leaderboard from the players list and every recorded match day.
export function buildLeaderboard(players, matchDays) {
  const stats = new Map()
  for (const p of players) {
    stats.set(p.id, {
      player: p,
      points: 0,
      wins: 0,
      games: 0,
      winRate: 0
    })
  }

  for (const day of matchDays) {
    for (const round of day.rounds) {
      for (const pod of round.pods) {
        for (const playerId of pod.players) {
          const s = stats.get(playerId)
          if (!s) continue
          s.games += 1
          s.points += POINTS_PLAYED
          if (pod.winnerId === playerId) {
            s.wins += 1
            s.points += POINTS_WIN
          }
        }
      }
    }
  }

  const rows = [...stats.values()]
  for (const s of rows) s.winRate = s.games ? s.wins / s.games : 0

  rows.sort(
    (a, b) =>
      b.points - a.points ||
      b.wins - a.wins ||
      b.winRate - a.winRate ||
      a.player.displayName.localeCompare(b.player.displayName)
  )
  return rows
}
