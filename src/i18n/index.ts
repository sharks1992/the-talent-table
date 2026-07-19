/* ==================================================================
   PDF report dictionaries — ported from the original (lines 1288–1325).
   The it/fr/es/pt/de entries were ASCII-mangled in the original; the
   diacritics are restored here, and the radar "Top scores" reference
   label is properly translated per language.
=================================================================== */

export type PdfLang = 'en' | 'it' | 'fr' | 'es' | 'pt' | 'de'

export interface LangDict {
  report: string
  confidential: string
  generated: string
  ttRating: string
  outOf100: string
  vsLastSeason: string
  ratingLegend: string
  bandOf: string
  fam: { DEF: string; MID: string; WING: string; STR: string }
  top5: string
  percentile: string
  rating: string
  average: string
  elite: string
  performance: string
  strengths: string
  weaknesses: string
  scout: string
  technical: string
  development: string
  position: string
  club: string
  age: string
  nationality: string
  foot: string
  height: string
  minutes: string
  contract: string
  league: string
  right: string
  left: string
  both: string
  roles: Record<string, string>
  groups: Record<string, string>
}

export const I18N: Record<PdfLang, LangDict> = {
  en: {
    report: 'Player Report', confidential: 'Confidential player report', generated: 'Generated',
    ttRating: 'Overall rating', outOf100: 'out of 100', vsLastSeason: 'vs last season',
    ratingLegend: 'Overall rating is a rank out of 100 vs peers in the benchmark leagues (higher is better, 99 is the top). Top 5% = better than 95% of peers.',
    bandOf: 'of',
    fam: { DEF: 'defenders', MID: 'midfielders', WING: 'wingers', STR: 'forwards' },
    top5: 'All leagues', percentile: 'Percentile', rating: 'Rating', average: 'Average', elite: 'Top scores',
    performance: 'Performance Profile', strengths: 'Strengths', weaknesses: 'Weaknesses',
    scout: 'Scout Report', technical: 'Technical Detail', development: 'Development vs last season',
    position: 'Position', club: 'Club', age: 'Age', nationality: 'Nationality', foot: 'Foot',
    height: 'Height', minutes: 'Minutes', contract: 'Contract', league: 'League',
    right: 'Right', left: 'Left', both: 'Both',
    roles: { CB: 'Centre Back', FB: 'Full Back', CM6: 'Defensive Mid', CM8: 'Central Mid', CM10: 'Attacking Mid', W: 'Winger', SS: 'Striker', TS: 'Target Striker' },
    groups: {
      'Goal Threat': 'Goal Threat', 'Striker Threat': 'Striker Play', 'Chance Creation': 'Chance Creation',
      Crossing: 'Crossing', Progression: 'Progression', Distribution: 'Distribution',
      'Atk Duelling': 'Attacking Duels', Dribbling: 'Dribbling', 'Ball Carrying': 'Ball Carrying',
      Defending: 'Defending', 'Def Duelling': 'Defensive Duels', Aerial: 'Aerial', Discipline: 'Discipline',
    },
  },
  it: {
    report: 'Report Giocatore', confidential: 'Report riservato', generated: 'Generato',
    ttRating: 'Valutazione complessiva', outOf100: 'su 100', vsLastSeason: 'rispetto alla stagione scorsa',
    ratingLegend: 'La valutazione è una posizione su 100 rispetto ai pari (più alto è meglio, 99 è il massimo). Top 5% supera il 95% dei pari.',
    bandOf: 'tra i',
    fam: { DEF: 'difensori', MID: 'centrocampisti', WING: 'esterni', STR: 'attaccanti' },
    top5: 'Tutti i campionati', percentile: 'Percentile', rating: 'Valutazione', average: 'Media', elite: 'Migliori valori',
    performance: 'Profilo Prestazionale', strengths: 'Punti di Forza', weaknesses: 'Punti Deboli',
    scout: 'Relazione Osservatore', technical: 'Dettaglio Tecnico', development: 'Crescita vs stagione scorsa',
    position: 'Ruolo', club: 'Club', age: 'Età', nationality: 'Nazionalità', foot: 'Piede',
    height: 'Altezza', minutes: 'Minuti', contract: 'Contratto', league: 'Campionato',
    right: 'Destro', left: 'Sinistro', both: 'Ambidestro',
    roles: { CB: 'Difensore Centrale', FB: 'Terzino', CM6: 'Mediano', CM8: 'Centrocampista', CM10: 'Trequartista', W: 'Esterno', SS: 'Attaccante', TS: 'Punta Centrale' },
    groups: {
      'Goal Threat': 'Pericolosità', 'Striker Threat': 'Gioco da Punta', 'Chance Creation': 'Creazione Occasioni',
      Crossing: 'Cross', Progression: 'Progressione', Distribution: 'Distribuzione',
      'Atk Duelling': 'Duelli Offensivi', Dribbling: 'Dribbling', 'Ball Carrying': 'Conduzione',
      Defending: 'Difesa', 'Def Duelling': 'Duelli Difensivi', Aerial: 'Gioco Aereo', Discipline: 'Disciplina',
    },
  },
  fr: {
    report: 'Rapport Joueur', confidential: 'Rapport confidentiel', generated: 'Généré',
    ttRating: 'Note globale', outOf100: 'sur 100', vsLastSeason: 'vs saison passée',
    ratingLegend: 'La note est un classement sur 100 face aux pairs (plus haut est mieux, 99 est le maximum). Top 5% dépasse 95% des pairs.',
    bandOf: 'des',
    fam: { DEF: 'défenseurs', MID: 'milieux', WING: 'ailiers', STR: 'attaquants' },
    top5: 'Tous les championnats', percentile: 'Centile', rating: 'Note', average: 'Moyenne', elite: 'Meilleures notes',
    performance: 'Profil de Performance', strengths: 'Points Forts', weaknesses: 'Points Faibles',
    scout: 'Rapport de Recrutement', technical: 'Détail Technique', development: 'Progression vs saison passée',
    position: 'Poste', club: 'Club', age: 'Âge', nationality: 'Nationalité', foot: 'Pied',
    height: 'Taille', minutes: 'Minutes', contract: 'Contrat', league: 'Championnat',
    right: 'Droit', left: 'Gauche', both: 'Deux pieds',
    roles: { CB: 'Défenseur Central', FB: 'Latéral', CM6: 'Milieu Défensif', CM8: 'Milieu Central', CM10: 'Milieu Offensif', W: 'Ailier', SS: 'Attaquant', TS: 'Avant-centre' },
    groups: {
      'Goal Threat': 'Menace de But', 'Striker Threat': 'Jeu d’Attaquant', 'Chance Creation': 'Création d’Occasions',
      Crossing: 'Centres', Progression: 'Progression', Distribution: 'Distribution',
      'Atk Duelling': 'Duels Offensifs', Dribbling: 'Dribble', 'Ball Carrying': 'Conduite',
      Defending: 'Défense', 'Def Duelling': 'Duels Défensifs', Aerial: 'Jeu Aérien', Discipline: 'Discipline',
    },
  },
  es: {
    report: 'Informe de Jugador', confidential: 'Informe confidencial', generated: 'Generado',
    ttRating: 'Valoración general', outOf100: 'sobre 100', vsLastSeason: 'vs temporada pasada',
    ratingLegend: 'La valoración es una posición sobre 100 frente a sus pares (más alto es mejor, 99 es el máximo). Top 5% supera al 95% de sus pares.',
    bandOf: 'de los',
    fam: { DEF: 'defensas', MID: 'centrocampistas', WING: 'extremos', STR: 'delanteros' },
    top5: 'Todas las ligas', percentile: 'Percentil', rating: 'Valoración', average: 'Media', elite: 'Mejores valores',
    performance: 'Perfil de Rendimiento', strengths: 'Fortalezas', weaknesses: 'Debilidades',
    scout: 'Informe de Ojeador', technical: 'Detalle Técnico', development: 'Evolución vs temporada pasada',
    position: 'Posición', club: 'Club', age: 'Edad', nationality: 'Nacionalidad', foot: 'Pie',
    height: 'Altura', minutes: 'Minutos', contract: 'Contrato', league: 'Liga',
    right: 'Derecho', left: 'Izquierdo', both: 'Ambidiestro',
    roles: { CB: 'Defensa Central', FB: 'Lateral', CM6: 'Mediocentro Defensivo', CM8: 'Mediocentro', CM10: 'Mediapunta', W: 'Extremo', SS: 'Delantero', TS: 'Delantero Centro' },
    groups: {
      'Goal Threat': 'Amenaza de Gol', 'Striker Threat': 'Juego de Delantero', 'Chance Creation': 'Creación de Ocasiones',
      Crossing: 'Centros', Progression: 'Progresión', Distribution: 'Distribución',
      'Atk Duelling': 'Duelos Ofensivos', Dribbling: 'Regate', 'Ball Carrying': 'Conducción',
      Defending: 'Defensa', 'Def Duelling': 'Duelos Defensivos', Aerial: 'Juego Aéreo', Discipline: 'Disciplina',
    },
  },
  pt: {
    report: 'Relatório de Jogador', confidential: 'Relatório confidencial', generated: 'Gerado',
    ttRating: 'Avaliação geral', outOf100: 'em 100', vsLastSeason: 'vs época passada',
    ratingLegend: 'A avaliação é uma posição em 100 face aos pares (mais alto é melhor, 99 é o máximo). Top 5% supera 95% dos pares.',
    bandOf: 'dos',
    fam: { DEF: 'defesas', MID: 'médios', WING: 'extremos', STR: 'avançados' },
    top5: 'Todas as ligas', percentile: 'Percentil', rating: 'Avaliação', average: 'Média', elite: 'Melhores valores',
    performance: 'Perfil de Desempenho', strengths: 'Pontos Fortes', weaknesses: 'Pontos Fracos',
    scout: 'Relatório de Observação', technical: 'Detalhe Técnico', development: 'Evolução vs época passada',
    position: 'Posição', club: 'Clube', age: 'Idade', nationality: 'Nacionalidade', foot: 'Pé',
    height: 'Altura', minutes: 'Minutos', contract: 'Contrato', league: 'Liga',
    right: 'Direito', left: 'Esquerdo', both: 'Ambidestro',
    roles: { CB: 'Defesa Central', FB: 'Lateral', CM6: 'Médio Defensivo', CM8: 'Médio Centro', CM10: 'Médio Ofensivo', W: 'Extremo', SS: 'Avançado', TS: 'Ponta de Lança' },
    groups: {
      'Goal Threat': 'Perigo de Golo', 'Striker Threat': 'Jogo de Avançado', 'Chance Creation': 'Criação de Oportunidades',
      Crossing: 'Cruzamentos', Progression: 'Progressão', Distribution: 'Distribuição',
      'Atk Duelling': 'Duelos Ofensivos', Dribbling: 'Drible', 'Ball Carrying': 'Condução',
      Defending: 'Defesa', 'Def Duelling': 'Duelos Defensivos', Aerial: 'Jogo Aéreo', Discipline: 'Disciplina',
    },
  },
  de: {
    report: 'Spielerbericht', confidential: 'Vertraulicher Bericht', generated: 'Erstellt',
    ttRating: 'Gesamtbewertung', outOf100: 'von 100', vsLastSeason: 'vs Vorsaison',
    ratingLegend: 'Die Bewertung ist ein Rang von 100 gegen Vergleichsspieler (höher ist besser, 99 ist das Maximum). Top 5% ist besser als 95%.',
    bandOf: 'der',
    fam: { DEF: 'Verteidiger', MID: 'Mittelfeldspieler', WING: 'Flügelspieler', STR: 'Stürmer' },
    top5: 'Alle Ligen', percentile: 'Perzentil', rating: 'Bewertung', average: 'Durchschnitt', elite: 'Bestwerte',
    performance: 'Leistungsprofil', strengths: 'Stärken', weaknesses: 'Schwächen',
    scout: 'Scouting-Bericht', technical: 'Technische Details', development: 'Entwicklung vs Vorsaison',
    position: 'Position', club: 'Verein', age: 'Alter', nationality: 'Nationalität', foot: 'Fuß',
    height: 'Größe', minutes: 'Minuten', contract: 'Vertrag', league: 'Liga',
    right: 'Rechts', left: 'Links', both: 'Beidfüßig',
    roles: { CB: 'Innenverteidiger', FB: 'Außenverteidiger', CM6: 'Defensives Mittelfeld', CM8: 'Zentrales Mittelfeld', CM10: 'Offensives Mittelfeld', W: 'Flügelspieler', SS: 'Stürmer', TS: 'Mittelstürmer' },
    groups: {
      'Goal Threat': 'Torgefahr', 'Striker Threat': 'Stürmerspiel', 'Chance Creation': 'Chancen',
      Crossing: 'Flanken', Progression: 'Progression', Distribution: 'Passspiel',
      'Atk Duelling': 'Offensiv-Duelle', Dribbling: 'Dribbling', 'Ball Carrying': 'Ballführung',
      Defending: 'Defensive', 'Def Duelling': 'Defensiv-Duelle', Aerial: 'Kopfball', Discipline: 'Disziplin',
    },
  },
}

export const LANG_LABELS: [PdfLang, string][] = [
  ['en', 'English'],
  ['it', 'Italiano'],
  ['fr', 'Français'],
  ['es', 'Español'],
  ['pt', 'Português'],
  ['de', 'Deutsch'],
]