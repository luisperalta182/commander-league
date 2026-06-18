// Pure helpers for building Sunday match days out of a player list.

function shuffle(arr) {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Split players into pods as close to `podSize` as possible.
// Commander pods are usually 4; remainders are spread out so we never leave a
// lonely 1-player pod (sizes land in the 3–5 range for typical groups).
export function makePods(playerIds, podSize = 4) {
  const n = playerIds.length
  if (n === 0) return []
  if (n < podSize + 2) return [playerIds.slice()] // one small pod when very few players

  const numPods = Math.max(1, Math.round(n / podSize))
  const base = Math.floor(n / numPods)
  let remainder = n % numPods

  const sizes = []
  for (let i = 0; i < numPods; i++) {
    sizes.push(base + (remainder > 0 ? 1 : 0))
    if (remainder > 0) remainder--
  }

  const players = shuffle(playerIds)
  const pods = []
  let cursor = 0
  for (const size of sizes) {
    pods.push(players.slice(cursor, cursor + size))
    cursor += size
  }
  return pods
}

const uid = () =>
  (crypto.randomUUID && crypto.randomUUID()) ||
  'p' + Math.random().toString(36).slice(2) + Date.now().toString(36)

// Build a full match day. La liga juega 1 partida por jornada por defecto, pero
// `rounds` permite generar más si se quiere.
export function buildMatchDay({ date, playerIds, rounds = 1, podSize = 4 }) {
  const roundList = []
  for (let r = 1; r <= rounds; r++) {
    roundList.push({
      roundNo: r,
      pods: makePods(playerIds, podSize).map((players) => ({
        id: uid(),
        players,
        winnerId: null, // 1.º lugar
        secondId: null, // 2.º lugar
        perPlayer: {}   // { [playerId]: { eliminations, achievements:[], secretMissionId, secretDone } }
      }))
    })
  }
  return {
    id: uid(),
    date,
    createdAt: new Date().toISOString(),
    finished: false,
    rounds: roundList
  }
}

// Return the next `count` Sundays on/after `from` as YYYY-MM-DD strings.
export function upcomingSundays(from = new Date(), count = 1) {
  const d = new Date(from)
  d.setHours(12, 0, 0, 0)
  const day = d.getDay() // 0 = Sunday
  const add = day === 0 ? 0 : 7 - day
  d.setDate(d.getDate() + add)
  const out = []
  for (let i = 0; i < count; i++) {
    out.push(d.toISOString().slice(0, 10))
    d.setDate(d.getDate() + 7)
  }
  return out
}
