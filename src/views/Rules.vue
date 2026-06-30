<script setup>
import { ACHIEVEMENTS_BY_RARITY, SECRET_MISSIONS, SECRET_MISSION_POINTS, MAX_ACHIEVEMENTS_PER_GAME, POINTS } from '../services/achievements'
</script>

<template>
  <h1>Reglamento</h1>
  <p class="lead muted">"El campeón no es el más fuerte… es el que más historias genera." 🌋</p>

  <div class="card">
    <h3>🧑‍🤝‍🧑 Estructura</h3>
    <ul class="clean">
      <li>Formato: <strong>Commander (EDH)</strong></li>
      <li><strong>3–4 jugadores</strong> por mesa</li>
      <li><strong>1 partida</strong> por jornada</li>
      <li><strong>3–4 jornadas</strong> por temporada</li>
    </ul>
  </div>

  <div class="card">
    <h3>🏆 Puntos base (resultado)</h3>
    <div class="pts">
      <div class="pt"><span class="b">👤 {{ POINTS.participate }}</span> Participar (siempre, solo por estar en la mesa)</div>
      <div class="pt"><span class="b">🥇 +{{ POINTS.win }}</span> Ganar la partida (1.º) → {{ POINTS.participate + POINTS.win }} en total</div>
      <div class="pt"><span class="b">🥈 +{{ POINTS.second }}</span> Segundo lugar → {{ POINTS.participate + POINTS.second }} en total</div>
      <div class="pt"><span class="b">💀 +{{ POINTS.elimination }}</span> Por cada jugador eliminado</div>
    </div>
    <p class="muted" style="margin-bottom:0; font-size:.85rem">
      Todos reciben {{ POINTS.participate }} punto por participar solo por estar en la mesa. El 1.º suma +{{ POINTS.win }} y el 2.º +{{ POINTS.second }} encima de eso. Las eliminaciones, logros y misión se suman aparte.
    </p>
  </div>

  <div class="card">
    <h3>🎴 Sistema de logros</h3>
    <ul class="clean">
      <li>Máximo <strong>{{ MAX_ACHIEVEMENTS_PER_GAME }} logros</strong> por jugador por partida</li>
      <li>Cada logro solo puede ganarse <strong>1 vez</strong> por jugador por partida</li>
      <li>Si hay disputa: decide la mesa u organizador</li>
      <li>Algunos logros requieren votación</li>
    </ul>

    <div v-for="g in ACHIEVEMENTS_BY_RARITY" :key="g.rarity" class="rargroup">
      <h4 :style="{ color: g.color }">{{ g.emoji }} {{ g.label }} · {{ g.points }} {{ g.points === 1 ? 'punto' : 'puntos' }}</h4>
      <div class="achs">
        <div v-for="a in g.items" :key="a.id" class="ach" :style="{ borderColor: g.color + '66' }">
          <strong>{{ a.name }}</strong>
          <span class="muted">{{ a.desc }}</span>
        </div>
      </div>
    </div>
  </div>

  <div class="card">
    <h3>🎴 Misión secreta</h3>
    <ul class="clean">
      <li><strong>1 misión</strong> por jugador por partida, se mantiene <strong>oculta</strong></li>
      <li>Si se cumple → <strong>+{{ SECRET_MISSION_POINTS }} puntos</strong>. No se puede cambiar.</li>
    </ul>
    <div class="achs">
      <div v-for="m in SECRET_MISSIONS" :key="m.id" class="ach">
        <strong>{{ m.emoji }} {{ m.name }}</strong>
        <span class="muted">{{ m.desc }}</span>
      </div>
    </div>
  </div>

  <div class="card">
    <h3>🧮 Cálculo final</h3>
    <p class="formula">TOTAL = Resultado + Eliminaciones + Logros + Misión secreta</p>
  </div>

  <div class="card">
    <h3>🤝 Filosofía</h3>
    <p class="muted">Esta liga premia: 🧠 estrategia · 🤝 política · 🎭 creatividad · 😂 diversión · 🌋 caos controlado · 🎴 momentos memorables.</p>
  </div>

  <div class="card">
    <h3>🏁 Campeón de liga</h3>
    <p class="muted">El campeón es quien más puntos tenga al final de la temporada.</p>
    <p style="margin-bottom:0"><strong>Desempates:</strong></p>
    <ol class="clean">
      <li>Más logros legendarios 🟠</li>
      <li>Más victorias</li>
      <li>Votación de mesa (honor pinolero)</li>
    </ol>
  </div>
</template>

<style scoped>
.lead { font-size: 1.05rem; font-style: italic; margin-bottom: 18px; }
.card { margin-bottom: 16px; }
.clean { margin: 6px 0; padding-left: 20px; }
.clean li { margin: 5px 0; }
.pts { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 10px; margin: 12px 0; }
.pt { background: var(--bg-soft); border: 1px solid var(--border); border-radius: 10px; padding: 10px 12px; }
.pt .b { font-weight: 800; color: var(--primary-2); margin-right: 6px; }
.rargroup { margin-top: 16px; }
.rargroup h4 { margin: 0 0 8px; font-size: .95rem; }
.achs { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 8px; }
.ach { display: flex; flex-direction: column; gap: 2px; background: var(--bg-soft); border: 1px solid var(--border); border-radius: 10px; padding: 9px 11px; font-size: .88rem; }
.ach .muted { font-size: .82rem; }
.formula { font-weight: 700; font-size: 1.05rem; color: var(--primary-2); margin: 0; }
</style>
