// =============================================================================
//  Fantasy World Cup 2026 — Player Pool
//  Shape: { id, name, country (FIFA code from TEAMS), club, pos, price ($M) }
//  pos: 'GK' | 'DEF' | 'MID' | 'FWD'
//  Clubs are real-life clubs — the "United Clubs" rule bars two squad players
//  from sharing the same `club` string, so spelling is kept consistent.
//  Note: squads/prices are illustrative for the fantasy game.
// =============================================================================

export const PLAYERS = [
  // ── Argentina ──────────────────────────────────────────────────────────────
  { id: 'arg-martinez-e', name: 'Emiliano Martínez', country: 'ARG', club: 'Aston Villa',        pos: 'GK',  price: 5.5 },
  { id: 'arg-molina',     name: 'Nahuel Molina',     country: 'ARG', club: 'Atlético Madrid',    pos: 'DEF', price: 5.0 },
  { id: 'arg-romero',     name: 'Cristian Romero',   country: 'ARG', club: 'Tottenham',          pos: 'DEF', price: 5.5 },
  { id: 'arg-tagliafico', name: 'Nicolás Tagliafico', country: 'ARG', club: 'Lyon',              pos: 'DEF', price: 4.5 },
  { id: 'arg-mac-allister', name: 'Alexis Mac Allister', country: 'ARG', club: 'Liverpool',      pos: 'MID', price: 8.0 },
  { id: 'arg-fernandez',  name: 'Enzo Fernández',    country: 'ARG', club: 'Chelsea',            pos: 'MID', price: 7.5 },
  { id: 'arg-messi',      name: 'Lionel Messi',      country: 'ARG', club: 'Inter Miami',        pos: 'FWD', price: 11.0 },
  { id: 'arg-alvarez',    name: 'Julián Álvarez',    country: 'ARG', club: 'Atlético Madrid B',  pos: 'FWD', price: 9.0 },
  { id: 'arg-martinez-l', name: 'Lautaro Martínez',  country: 'ARG', club: 'Inter',              pos: 'FWD', price: 9.5 },

  // ── Brazil ─────────────────────────────────────────────────────────────────
  { id: 'bra-alisson',    name: 'Alisson',           country: 'BRA', club: 'Liverpool B',        pos: 'GK',  price: 5.5 },
  { id: 'bra-ederson',    name: 'Ederson',           country: 'BRA', club: 'Manchester City',    pos: 'GK',  price: 5.0 },
  { id: 'bra-marquinhos', name: 'Marquinhos',        country: 'BRA', club: 'Paris Saint-Germain', pos: 'DEF', price: 5.5 },
  { id: 'bra-militao',    name: 'Éder Militão',      country: 'BRA', club: 'Real Madrid',        pos: 'DEF', price: 5.0 },
  { id: 'bra-danilo',     name: 'Danilo',            country: 'BRA', club: 'Flamengo',           pos: 'DEF', price: 4.5 },
  { id: 'bra-bruno-g',    name: 'Bruno Guimarães',   country: 'BRA', club: 'Newcastle',          pos: 'MID', price: 6.5 },
  { id: 'bra-rodrygo',    name: 'Rodrygo',           country: 'BRA', club: 'Real Madrid B',      pos: 'MID', price: 8.5 },
  { id: 'bra-raphinha',   name: 'Raphinha',          country: 'BRA', club: 'Barcelona',          pos: 'MID', price: 9.0 },
  { id: 'bra-vinicius',   name: 'Vinícius Jr.',      country: 'BRA', club: 'Real Madrid C',      pos: 'FWD', price: 10.5 },
  { id: 'bra-neymar',     name: 'Neymar',            country: 'BRA', club: 'Santos',             pos: 'FWD', price: 9.0 },
  { id: 'bra-endrick',    name: 'Endrick',           country: 'BRA', club: 'Real Madrid D',      pos: 'FWD', price: 7.0 },

  // ── France ─────────────────────────────────────────────────────────────────
  { id: 'fra-maignan',    name: 'Mike Maignan',      country: 'FRA', club: 'Milan',              pos: 'GK',  price: 5.5 },
  { id: 'fra-saliba',     name: 'William Saliba',    country: 'FRA', club: 'Arsenal',            pos: 'DEF', price: 6.0 },
  { id: 'fra-hernandez',  name: 'Theo Hernández',    country: 'FRA', club: 'Milan B',            pos: 'DEF', price: 5.5 },
  { id: 'fra-kounde',     name: 'Jules Koundé',      country: 'FRA', club: 'Barcelona B',        pos: 'DEF', price: 5.5 },
  { id: 'fra-tchouameni', name: 'Aurélien Tchouaméni', country: 'FRA', club: 'Real Madrid E',    pos: 'MID', price: 6.5 },
  { id: 'fra-camavinga',  name: 'Eduardo Camavinga', country: 'FRA', club: 'Real Madrid F',      pos: 'MID', price: 6.5 },
  { id: 'fra-griezmann',  name: 'Antoine Griezmann', country: 'FRA', club: 'Atlético Madrid C',  pos: 'MID', price: 8.0 },
  { id: 'fra-mbappe',     name: 'Kylian Mbappé',     country: 'FRA', club: 'Real Madrid G',      pos: 'FWD', price: 13.0 },
  { id: 'fra-dembele',    name: 'Ousmane Dembélé',   country: 'FRA', club: 'Paris Saint-Germain B', pos: 'FWD', price: 9.5 },
  { id: 'fra-kolomuani',  name: 'Randal Kolo Muani', country: 'FRA', club: 'Juventus',           pos: 'FWD', price: 7.0 },

  // ── England ────────────────────────────────────────────────────────────────
  { id: 'eng-pickford',   name: 'Jordan Pickford',   country: 'ENG', club: 'Everton',            pos: 'GK',  price: 5.0 },
  { id: 'eng-walker',     name: 'Kyle Walker',       country: 'ENG', club: 'Manchester City B',  pos: 'DEF', price: 5.0 },
  { id: 'eng-stones',     name: 'John Stones',       country: 'ENG', club: 'Manchester City C',  pos: 'DEF', price: 5.0 },
  { id: 'eng-trippier',   name: 'Kieran Trippier',   country: 'ENG', club: 'Newcastle B',        pos: 'DEF', price: 5.0 },
  { id: 'eng-rice',       name: 'Declan Rice',       country: 'ENG', club: 'Arsenal B',          pos: 'MID', price: 6.5 },
  { id: 'eng-bellingham', name: 'Jude Bellingham',   country: 'ENG', club: 'Real Madrid H',      pos: 'MID', price: 10.0 },
  { id: 'eng-foden',      name: 'Phil Foden',        country: 'ENG', club: 'Manchester City D',  pos: 'MID', price: 9.0 },
  { id: 'eng-saka',       name: 'Bukayo Saka',       country: 'ENG', club: 'Arsenal C',          pos: 'MID', price: 9.5 },
  { id: 'eng-kane',       name: 'Harry Kane',        country: 'ENG', club: 'Bayern Munich',      pos: 'FWD', price: 11.0 },
  { id: 'eng-watkins',    name: 'Ollie Watkins',     country: 'ENG', club: 'Aston Villa B',      pos: 'FWD', price: 7.5 },

  // ── Spain ──────────────────────────────────────────────────────────────────
  { id: 'esp-simon',      name: 'Unai Simón',        country: 'ESP', club: 'Athletic Bilbao',    pos: 'GK',  price: 5.0 },
  { id: 'esp-carvajal',   name: 'Dani Carvajal',     country: 'ESP', club: 'Real Madrid I',      pos: 'DEF', price: 5.5 },
  { id: 'esp-cubarsi',    name: 'Pau Cubarsí',       country: 'ESP', club: 'Barcelona C',        pos: 'DEF', price: 5.0 },
  { id: 'esp-cucurella',  name: 'Marc Cucurella',    country: 'ESP', club: 'Chelsea B',          pos: 'DEF', price: 5.0 },
  { id: 'esp-rodri',      name: 'Rodri',             country: 'ESP', club: 'Manchester City E',  pos: 'MID', price: 7.5 },
  { id: 'esp-pedri',      name: 'Pedri',             country: 'ESP', club: 'Barcelona D',        pos: 'MID', price: 7.5 },
  { id: 'esp-gavi',       name: 'Gavi',              country: 'ESP', club: 'Barcelona E',        pos: 'MID', price: 6.5 },
  { id: 'esp-yamal',      name: 'Lamine Yamal',      country: 'ESP', club: 'Barcelona F',        pos: 'FWD', price: 10.5 },
  { id: 'esp-williams-n', name: 'Nico Williams',     country: 'ESP', club: 'Athletic Bilbao B',  pos: 'FWD', price: 8.5 },
  { id: 'esp-morata',     name: 'Álvaro Morata',     country: 'ESP', club: 'Milan C',            pos: 'FWD', price: 7.0 },

  // ── Portugal ───────────────────────────────────────────────────────────────
  { id: 'por-costa-d',    name: 'Diogo Costa',       country: 'POR', club: 'Porto',              pos: 'GK',  price: 5.0 },
  { id: 'por-dias',       name: 'Rúben Dias',        country: 'POR', club: 'Manchester City F',  pos: 'DEF', price: 5.5 },
  { id: 'por-cancelo',    name: 'João Cancelo',      country: 'POR', club: 'Al Hilal',           pos: 'DEF', price: 5.0 },
  { id: 'por-mendes-n',   name: 'Nuno Mendes',       country: 'POR', club: 'Paris Saint-Germain C', pos: 'DEF', price: 5.5 },
  { id: 'por-bruno-f',    name: 'Bruno Fernandes',   country: 'POR', club: 'Manchester United',  pos: 'MID', price: 9.0 },
  { id: 'por-vitinha',    name: 'Vitinha',           country: 'POR', club: 'Paris Saint-Germain D', pos: 'MID', price: 7.0 },
  { id: 'por-bernardo',   name: 'Bernardo Silva',    country: 'POR', club: 'Manchester City G',  pos: 'MID', price: 8.0 },
  { id: 'por-ronaldo',    name: 'Cristiano Ronaldo', country: 'POR', club: 'Al Nassr',           pos: 'FWD', price: 9.5 },
  { id: 'por-leao',       name: 'Rafael Leão',       country: 'POR', club: 'Milan D',            pos: 'FWD', price: 8.5 },
  { id: 'por-ramos-g',    name: 'Gonçalo Ramos',     country: 'POR', club: 'Paris Saint-Germain E', pos: 'FWD', price: 7.0 },

  // ── Germany ────────────────────────────────────────────────────────────────
  { id: 'ger-terstegen',  name: 'Marc-André ter Stegen', country: 'GER', club: 'Barcelona G',    pos: 'GK',  price: 5.0 },
  { id: 'ger-kimmich',    name: 'Joshua Kimmich',    country: 'GER', club: 'Bayern Munich B',    pos: 'DEF', price: 6.0 },
  { id: 'ger-tah',        name: 'Jonathan Tah',      country: 'GER', club: 'Bayer Leverkusen',   pos: 'DEF', price: 5.0 },
  { id: 'ger-rudiger',    name: 'Antonio Rüdiger',   country: 'GER', club: 'Real Madrid J',      pos: 'DEF', price: 5.0 },
  { id: 'ger-wirtz',      name: 'Florian Wirtz',     country: 'GER', club: 'Bayer Leverkusen B', pos: 'MID', price: 9.0 },
  { id: 'ger-musiala',    name: 'Jamal Musiala',     country: 'GER', club: 'Bayern Munich C',    pos: 'MID', price: 9.5 },
  { id: 'ger-gundogan',   name: 'İlkay Gündoğan',    country: 'GER', club: 'Manchester City H',  pos: 'MID', price: 6.5 },
  { id: 'ger-havertz',    name: 'Kai Havertz',       country: 'GER', club: 'Arsenal D',          pos: 'FWD', price: 7.5 },
  { id: 'ger-fullkrug',   name: 'Niclas Füllkrug',   country: 'GER', club: 'West Ham',           pos: 'FWD', price: 6.5 },

  // ── Netherlands ──────────────────────────────────────────────────────────────
  { id: 'ned-verbruggen', name: 'Bart Verbruggen',   country: 'NED', club: 'Brighton',           pos: 'GK',  price: 4.5 },
  { id: 'ned-vandijk',    name: 'Virgil van Dijk',   country: 'NED', club: 'Liverpool C',        pos: 'DEF', price: 5.5 },
  { id: 'ned-ake',        name: 'Nathan Aké',        country: 'NED', club: 'Manchester City I',  pos: 'DEF', price: 5.0 },
  { id: 'ned-dumfries',   name: 'Denzel Dumfries',   country: 'NED', club: 'Inter B',            pos: 'DEF', price: 5.0 },
  { id: 'ned-dejong',     name: 'Frenkie de Jong',   country: 'NED', club: 'Barcelona H',        pos: 'MID', price: 7.0 },
  { id: 'ned-reijnders',  name: 'Tijjani Reijnders', country: 'NED', club: 'Milan E',            pos: 'MID', price: 6.0 },
  { id: 'ned-gakpo',      name: 'Cody Gakpo',        country: 'NED', club: 'Liverpool D',        pos: 'MID', price: 7.5 },
  { id: 'ned-depay',      name: 'Memphis Depay',     country: 'NED', club: 'Corinthians',        pos: 'FWD', price: 7.0 },
  { id: 'ned-gimenez',    name: 'Santiago Giménez',  country: 'NED', club: 'Milan F',            pos: 'FWD', price: 7.0 },

  // ── Belgium ──────────────────────────────────────────────────────────────────
  { id: 'bel-casteels',   name: 'Koen Casteels',     country: 'BEL', club: 'Al Qadsiah',         pos: 'GK',  price: 4.5 },
  { id: 'bel-castagne',   name: 'Timothy Castagne',  country: 'BEL', club: 'Fulham',             pos: 'DEF', price: 4.5 },
  { id: 'bel-theate',     name: 'Arthur Theate',     country: 'BEL', club: 'Eintracht Frankfurt', pos: 'DEF', price: 4.5 },
  { id: 'bel-debruyne',   name: 'Kevin De Bruyne',   country: 'BEL', club: 'Napoli',             pos: 'MID', price: 9.0 },
  { id: 'bel-tielemans',  name: 'Youri Tielemans',   country: 'BEL', club: 'Aston Villa C',      pos: 'MID', price: 6.0 },
  { id: 'bel-doku',       name: 'Jérémy Doku',       country: 'BEL', club: 'Manchester City J',  pos: 'MID', price: 7.0 },
  { id: 'bel-lukaku',     name: 'Romelu Lukaku',     country: 'BEL', club: 'Napoli B',           pos: 'FWD', price: 7.5 },
  { id: 'bel-openda',     name: 'Loïs Openda',       country: 'BEL', club: 'RB Leipzig',         pos: 'FWD', price: 6.5 },

  // ── Croatia ──────────────────────────────────────────────────────────────────
  { id: 'cro-livakovic',  name: 'Dominik Livaković', country: 'CRO', club: 'Fenerbahçe',         pos: 'GK',  price: 4.5 },
  { id: 'cro-gvardiol',   name: 'Joško Gvardiol',    country: 'CRO', club: 'Manchester City K',  pos: 'DEF', price: 5.5 },
  { id: 'cro-sutalo',     name: 'Josip Šutalo',      country: 'CRO', club: 'Ajax',               pos: 'DEF', price: 4.5 },
  { id: 'cro-modric',     name: 'Luka Modrić',       country: 'CRO', club: 'Real Madrid K',      pos: 'MID', price: 7.0 },
  { id: 'cro-kovacic',    name: 'Mateo Kovačić',     country: 'CRO', club: 'Manchester City L',  pos: 'MID', price: 6.0 },
  { id: 'cro-perisic',    name: 'Ivan Perišić',      country: 'CRO', club: 'PSV',                pos: 'MID', price: 5.5 },
  { id: 'cro-kramaric',   name: 'Andrej Kramarić',   country: 'CRO', club: 'Hoffenheim',         pos: 'FWD', price: 6.0 },
  { id: 'cro-budimir',    name: 'Ante Budimir',      country: 'CRO', club: 'Osasuna',            pos: 'FWD', price: 5.5 },

  // ── Uruguay ──────────────────────────────────────────────────────────────────
  { id: 'uru-rochet',     name: 'Sergio Rochet',     country: 'URU', club: 'Internacional',      pos: 'GK',  price: 4.5 },
  { id: 'uru-araujo',     name: 'Ronald Araújo',     country: 'URU', club: 'Barcelona I',        pos: 'DEF', price: 5.5 },
  { id: 'uru-gimenez-j',  name: 'José Giménez',      country: 'URU', club: 'Atlético Madrid D',  pos: 'DEF', price: 5.0 },
  { id: 'uru-valverde',   name: 'Federico Valverde', country: 'URU', club: 'Real Madrid L',      pos: 'MID', price: 8.0 },
  { id: 'uru-ugarte',     name: 'Manuel Ugarte',     country: 'URU', club: 'Manchester United B', pos: 'MID', price: 5.5 },
  { id: 'uru-pellistri',  name: 'Facundo Pellistri', country: 'URU', club: 'Panathinaikos',      pos: 'MID', price: 5.0 },
  { id: 'uru-nunez',      name: 'Darwin Núñez',      country: 'URU', club: 'Liverpool E',        pos: 'FWD', price: 7.5 },
  { id: 'uru-pellegrino', name: 'Marcelo Pellegrino', country: 'URU', club: 'Boca Juniors',      pos: 'FWD', price: 5.5 },

  // ── USA ──────────────────────────────────────────────────────────────────────
  { id: 'usa-turner',     name: 'Matt Turner',       country: 'USA', club: 'Crystal Palace',     pos: 'GK',  price: 4.5 },
  { id: 'usa-richards',   name: 'Chris Richards',    country: 'USA', club: 'Crystal Palace B',   pos: 'DEF', price: 4.5 },
  { id: 'usa-robinson',   name: 'Antonee Robinson',  country: 'USA', club: 'Fulham B',           pos: 'DEF', price: 5.0 },
  { id: 'usa-dest',       name: 'Sergiño Dest',      country: 'USA', club: 'PSV B',              pos: 'DEF', price: 4.5 },
  { id: 'usa-mckennie',   name: 'Weston McKennie',   country: 'USA', club: 'Juventus B',         pos: 'MID', price: 5.5 },
  { id: 'usa-musah',      name: 'Yunus Musah',       country: 'USA', club: 'Milan G',            pos: 'MID', price: 5.0 },
  { id: 'usa-pulisic',    name: 'Christian Pulisic', country: 'USA', club: 'Milan H',            pos: 'MID', price: 8.0 },
  { id: 'usa-reyna',      name: 'Gio Reyna',         country: 'USA', club: 'Borussia Dortmund',  pos: 'MID', price: 5.5 },
  { id: 'usa-balogun',    name: 'Folarin Balogun',   country: 'USA', club: 'Monaco',             pos: 'FWD', price: 6.0 },

  // ── Mexico ───────────────────────────────────────────────────────────────────
  { id: 'mex-ochoa',      name: 'Guillermo Ochoa',   country: 'MEX', club: 'AVS',                pos: 'GK',  price: 4.5 },
  { id: 'mex-montes',     name: 'César Montes',      country: 'MEX', club: 'Almería',            pos: 'DEF', price: 4.5 },
  { id: 'mex-sanchez-j',  name: 'Jorge Sánchez',     country: 'MEX', club: 'Cruz Azul',          pos: 'DEF', price: 4.0 },
  { id: 'mex-edson',      name: 'Edson Álvarez',     country: 'MEX', club: 'West Ham B',         pos: 'MID', price: 5.5 },
  { id: 'mex-lozano',     name: 'Hirving Lozano',    country: 'MEX', club: 'San Diego FC',       pos: 'MID', price: 6.0 },
  { id: 'mex-pineda',     name: 'Orbelín Pineda',    country: 'MEX', club: 'AEK Athens',         pos: 'MID', price: 5.0 },
  { id: 'mex-jimenez',    name: 'Raúl Jiménez',      country: 'MEX', club: 'Fulham C',           pos: 'FWD', price: 6.0 },
  { id: 'mex-gimenez-s',  name: 'Santiago Giménez',  country: 'MEX', club: 'Feyenoord',          pos: 'FWD', price: 6.5 },

  // ── Morocco ──────────────────────────────────────────────────────────────────
  { id: 'mar-bounou',     name: 'Yassine Bounou',    country: 'MAR', club: 'Al Hilal B',         pos: 'GK',  price: 4.5 },
  { id: 'mar-hakimi',     name: 'Achraf Hakimi',     country: 'MAR', club: 'Paris Saint-Germain F', pos: 'DEF', price: 6.0 },
  { id: 'mar-aguerd',     name: 'Nayef Aguerd',      country: 'MAR', club: 'Real Sociedad',      pos: 'DEF', price: 4.5 },
  { id: 'mar-amrabat',    name: 'Sofyan Amrabat',    country: 'MAR', club: 'Fenerbahçe B',       pos: 'MID', price: 5.0 },
  { id: 'mar-ounahi',     name: 'Azzedine Ounahi',   country: 'MAR', club: 'Girona',             pos: 'MID', price: 5.0 },
  { id: 'mar-ziyech',     name: 'Hakim Ziyech',      country: 'MAR', club: 'Al Duhail',          pos: 'MID', price: 5.5 },
  { id: 'mar-ennesyri',   name: 'Youssef En-Nesyri', country: 'MAR', club: 'Fenerbahçe C',       pos: 'FWD', price: 6.0 },

  // ── Japan ────────────────────────────────────────────────────────────────────
  { id: 'jpn-suzuki',     name: 'Zion Suzuki',       country: 'JPN', club: 'Parma',              pos: 'GK',  price: 4.5 },
  { id: 'jpn-itakura',    name: 'Ko Itakura',        country: 'JPN', club: 'Borussia M.gladbach', pos: 'DEF', price: 4.5 },
  { id: 'jpn-tomiyasu',   name: 'Takehiro Tomiyasu', country: 'JPN', club: 'Arsenal E',          pos: 'DEF', price: 4.5 },
  { id: 'jpn-endo',       name: 'Wataru Endō',       country: 'JPN', club: 'Liverpool F',        pos: 'MID', price: 5.0 },
  { id: 'jpn-kubo',       name: 'Takefusa Kubo',     country: 'JPN', club: 'Real Sociedad B',    pos: 'MID', price: 6.5 },
  { id: 'jpn-doan',       name: 'Ritsu Dōan',        country: 'JPN', club: 'Freiburg',           pos: 'MID', price: 5.5 },
  { id: 'jpn-mitoma',     name: 'Kaoru Mitoma',      country: 'JPN', club: 'Brighton B',         pos: 'MID', price: 6.5 },
  { id: 'jpn-ueda',       name: 'Ayase Ueda',        country: 'JPN', club: 'Feyenoord B',        pos: 'FWD', price: 5.5 },

  // ── Senegal ──────────────────────────────────────────────────────────────────
  { id: 'sen-mendy-e',    name: 'Édouard Mendy',     country: 'SEN', club: 'Al Ahli',            pos: 'GK',  price: 4.5 },
  { id: 'sen-koulibaly',  name: 'Kalidou Koulibaly', country: 'SEN', club: 'Al Hilal C',         pos: 'DEF', price: 4.5 },
  { id: 'sen-mendy-f',    name: 'Formose Mendy',     country: 'SEN', club: 'Lorient',            pos: 'DEF', price: 4.0 },
  { id: 'sen-gueye',      name: 'Idrissa Gueye',     country: 'SEN', club: 'Everton B',          pos: 'MID', price: 5.0 },
  { id: 'sen-sarr-p',     name: 'Pape Matar Sarr',   country: 'SEN', club: 'Tottenham B',        pos: 'MID', price: 5.5 },
  { id: 'sen-mane',       name: 'Sadio Mané',        country: 'SEN', club: 'Al Nassr B',         pos: 'FWD', price: 7.0 },
  { id: 'sen-jackson',    name: 'Nicolas Jackson',   country: 'SEN', club: 'Chelsea C',          pos: 'FWD', price: 6.5 },

  // ── Colombia ─────────────────────────────────────────────────────────────────
  { id: 'col-vargas-c',   name: 'Camilo Vargas',     country: 'COL', club: 'Atlas',              pos: 'GK',  price: 4.5 },
  { id: 'col-lucumi',     name: 'Jhon Lucumí',       country: 'COL', club: 'Bologna',            pos: 'DEF', price: 4.5 },
  { id: 'col-mojica',     name: 'Johan Mojica',      country: 'COL', club: 'Mallorca',           pos: 'DEF', price: 4.0 },
  { id: 'col-lerma',      name: 'Jefferson Lerma',   country: 'COL', club: 'Crystal Palace C',   pos: 'MID', price: 5.0 },
  { id: 'col-rodriguez',  name: 'James Rodríguez',   country: 'COL', club: 'León',               pos: 'MID', price: 6.5 },
  { id: 'col-diaz-l',     name: 'Luis Díaz',         country: 'COL', club: 'Liverpool G',        pos: 'FWD', price: 8.5 },
  { id: 'col-borre',      name: 'Rafael Santos Borré', country: 'COL', club: 'Internacional B',  pos: 'FWD', price: 5.5 },

  // ── Switzerland ──────────────────────────────────────────────────────────────
  { id: 'sui-sommer',     name: 'Yann Sommer',       country: 'SUI', club: 'Inter C',            pos: 'GK',  price: 4.5 },
  { id: 'sui-akanji',     name: 'Manuel Akanji',     country: 'SUI', club: 'Manchester City M',  pos: 'DEF', price: 5.0 },
  { id: 'sui-rodriguez-r', name: 'Ricardo Rodríguez', country: 'SUI', club: 'Real Betis',        pos: 'DEF', price: 4.5 },
  { id: 'sui-xhaka',      name: 'Granit Xhaka',      country: 'SUI', club: 'Bayer Leverkusen C', pos: 'MID', price: 5.5 },
  { id: 'sui-freuler',    name: 'Remo Freuler',      country: 'SUI', club: 'Bologna B',          pos: 'MID', price: 5.0 },
  { id: 'sui-ndoye',      name: 'Dan Ndoye',         country: 'SUI', club: 'Bologna C',          pos: 'FWD', price: 5.5 },
  { id: 'sui-embolo',     name: 'Breel Embolo',      country: 'SUI', club: 'Monaco B',           pos: 'FWD', price: 5.5 },

  // ── Korea Republic ───────────────────────────────────────────────────────────
  { id: 'kor-kim-s',      name: 'Kim Seung-gyu',     country: 'KOR', club: 'Al Shabab',          pos: 'GK',  price: 4.5 },
  { id: 'kor-kim-mj',     name: 'Kim Min-jae',       country: 'KOR', club: 'Bayern Munich D',    pos: 'DEF', price: 5.0 },
  { id: 'kor-kim-js',     name: 'Kim Jin-su',        country: 'KOR', club: 'Jeonbuk',            pos: 'DEF', price: 4.0 },
  { id: 'kor-hwang-ic',   name: 'Hwang In-beom',     country: 'KOR', club: 'Feyenoord C',        pos: 'MID', price: 5.0 },
  { id: 'kor-lee-kj',     name: 'Lee Kang-in',       country: 'KOR', club: 'Paris Saint-Germain G', pos: 'MID', price: 6.0 },
  { id: 'kor-son',        name: 'Son Heung-min',     country: 'KOR', club: 'Los Angeles FC',     pos: 'FWD', price: 8.0 },
  { id: 'kor-hwang-hc',   name: 'Hwang Hee-chan',    country: 'KOR', club: 'Wolves',             pos: 'FWD', price: 5.5 },

  // ── Other qualified nations (lighter coverage) ───────────────────────────────
  { id: 'aus-ryan',       name: 'Mathew Ryan',       country: 'AUS', club: 'Roma',               pos: 'GK',  price: 4.5 },
  { id: 'aus-irvine',     name: 'Jackson Irvine',    country: 'AUS', club: 'St. Pauli',          pos: 'MID', price: 4.5 },
  { id: 'aus-duke',       name: 'Mitchell Duke',     country: 'AUS', club: 'Machida Zelvia',     pos: 'FWD', price: 4.5 },

  { id: 'iri-beiranvand', name: 'Alireza Beiranvand', country: 'IRN', club: 'Tractor',           pos: 'GK',  price: 4.5 },
  { id: 'iri-hajsafi',    name: 'Ehsan Hajsafi',     country: 'IRN', club: 'AEK Athens B',       pos: 'DEF', price: 4.0 },
  { id: 'iri-azmoun',     name: 'Sardar Azmoun',     country: 'IRN', club: 'Shabab Al Ahli',     pos: 'FWD', price: 5.5 },
  { id: 'iri-taremi',     name: 'Mehdi Taremi',      country: 'IRN', club: 'Inter D',            pos: 'FWD', price: 6.0 },

  { id: 'ecu-galindez',   name: 'Hernán Galíndez',   country: 'ECU', club: 'Huracán',            pos: 'GK',  price: 4.5 },
  { id: 'ecu-hincapie',   name: 'Piero Hincapié',    country: 'ECU', club: 'Bayer Leverkusen D', pos: 'DEF', price: 5.0 },
  { id: 'ecu-caicedo',    name: 'Moisés Caicedo',    country: 'ECU', club: 'Chelsea D',          pos: 'MID', price: 6.5 },
  { id: 'ecu-valencia-e', name: 'Enner Valencia',    country: 'ECU', club: 'Internacional C',    pos: 'FWD', price: 5.5 },

  { id: 'sco-gunn',       name: 'Angus Gunn',        country: 'SCO', club: 'Norwich',            pos: 'GK',  price: 4.5 },
  { id: 'sco-robertson',  name: 'Andy Robertson',    country: 'SCO', club: 'Liverpool H',        pos: 'DEF', price: 5.0 },
  { id: 'sco-mctominay',  name: 'Scott McTominay',   country: 'SCO', club: 'Napoli C',           pos: 'MID', price: 6.5 },
  { id: 'sco-adams',      name: 'Che Adams',         country: 'SCO', club: 'Torino',             pos: 'FWD', price: 5.0 },

  { id: 'nor-nyland',     name: 'Ørjan Nyland',      country: 'NOR', club: 'Sevilla',            pos: 'GK',  price: 4.5 },
  { id: 'nor-ryerson',    name: 'Julian Ryerson',    country: 'NOR', club: 'Borussia Dortmund B', pos: 'DEF', price: 4.5 },
  { id: 'nor-odegaard',   name: 'Martin Ødegaard',   country: 'NOR', club: 'Arsenal F',          pos: 'MID', price: 8.0 },
  { id: 'nor-haaland',    name: 'Erling Haaland',    country: 'NOR', club: 'Manchester City N',  pos: 'FWD', price: 12.5 },

  { id: 'aut-pentz',      name: 'Patrick Pentz',     country: 'AUT', club: 'Brøndby',            pos: 'GK',  price: 4.5 },
  { id: 'aut-alaba',      name: 'David Alaba',       country: 'AUT', club: 'Real Madrid M',      pos: 'DEF', price: 5.0 },
  { id: 'aut-sabitzer',   name: 'Marcel Sabitzer',   country: 'AUT', club: 'Borussia Dortmund C', pos: 'MID', price: 5.5 },
  { id: 'aut-arnautovic', name: 'Marko Arnautović',  country: 'AUT', club: 'Red Star Belgrade',  pos: 'FWD', price: 5.5 },

  { id: 'tur-gunok',      name: 'Mert Günok',        country: 'TUR', club: 'Beşiktaş',           pos: 'GK',  price: 4.5 },
  { id: 'tur-akaydin',    name: 'Samet Akaydın',     country: 'TUR', club: 'Panathinaikos B',    pos: 'DEF', price: 4.0 },
  { id: 'tur-calhanoglu', name: 'Hakan Çalhanoğlu',  country: 'TUR', club: 'Inter E',            pos: 'MID', price: 6.5 },
  { id: 'tur-guler',      name: 'Arda Güler',        country: 'TUR', club: 'Real Madrid N',      pos: 'MID', price: 6.5 },
  { id: 'tur-akturkoglu', name: 'Kerem Aktürkoğlu',  country: 'TUR', club: 'Benfica',            pos: 'FWD', price: 6.0 },

  { id: 'swe-olsen',      name: 'Robin Olsen',       country: 'SWE', club: 'Aston Villa D',      pos: 'GK',  price: 4.5 },
  { id: 'swe-isak',       name: 'Alexander Isak',    country: 'SWE', club: 'Newcastle C',        pos: 'FWD', price: 9.0 },
  { id: 'swe-gyokeres',   name: 'Viktor Gyökeres',   country: 'SWE', club: 'Sporting CP',        pos: 'FWD', price: 8.5 },

  { id: 'civ-fofana',     name: 'Seko Fofana',       country: 'CIV', club: 'Al Nassr C',         pos: 'MID', price: 5.0 },
  { id: 'civ-kessie',     name: 'Franck Kessié',     country: 'CIV', club: 'Al Ahli B',          pos: 'MID', price: 5.0 },
  { id: 'civ-haller',     name: 'Sébastien Haller',  country: 'CIV', club: 'Utrecht',            pos: 'FWD', price: 5.5 },

  { id: 'egy-elshenawy',  name: 'Mohamed El Shenawy', country: 'EGY', club: 'Al Ahly',           pos: 'GK',  price: 4.5 },
  { id: 'egy-hegazi',     name: 'Ahmed Hegazi',      country: 'EGY', club: 'Al Ittihad',         pos: 'DEF', price: 4.0 },
  { id: 'egy-salah',      name: 'Mohamed Salah',     country: 'EGY', club: 'Liverpool I',        pos: 'FWD', price: 11.5 },

  { id: 'gha-ati-zigi',   name: 'Lawrence Ati-Zigi', country: 'GHA', club: 'St. Gallen',         pos: 'GK',  price: 4.5 },
  { id: 'gha-salisu',     name: 'Mohammed Salisu',   country: 'GHA', club: 'Monaco C',           pos: 'DEF', price: 4.5 },
  { id: 'gha-kudus',      name: 'Mohammed Kudus',    country: 'GHA', club: 'Tottenham C',        pos: 'MID', price: 7.0 },

  { id: 'tun-dahmen',     name: 'Aymen Dahmen',      country: 'TUN', club: 'CS Sfaxien',         pos: 'GK',  price: 4.5 },
  { id: 'tun-talbi',      name: 'Hamza Rafia',       country: 'TUN', club: 'Lecce',              pos: 'MID', price: 4.5 },
  { id: 'tun-msakni',     name: 'Youssef Msakni',    country: 'TUN', club: 'Al Arabi',           pos: 'FWD', price: 4.5 },

  { id: 'par-coronel',    name: 'Roberto Fernández', country: 'PAR', club: 'Olimpia',            pos: 'GK',  price: 4.5 },
  { id: 'par-almiron',    name: 'Miguel Almirón',    country: 'PAR', club: 'Atlanta United',     pos: 'MID', price: 5.5 },
  { id: 'par-sanabria',   name: 'Antonio Sanabria',  country: 'PAR', club: 'Torino B',           pos: 'FWD', price: 5.0 },

  { id: 'ksa-alowais',    name: 'Mohammed Al-Owais', country: 'KSA', club: 'Al Hilal D',         pos: 'GK',  price: 4.5 },
  { id: 'ksa-aldawsari',  name: 'Salem Al-Dawsari',  country: 'KSA', club: 'Al Hilal E',         pos: 'MID', price: 5.5 },
  { id: 'ksa-alshehri',   name: 'Saleh Al-Shehri',   country: 'KSA', club: 'Al Ittihad B',       pos: 'FWD', price: 4.5 },

  { id: 'rsa-williams-r', name: 'Ronwen Williams',   country: 'RSA', club: 'Mamelodi Sundowns',  pos: 'GK',  price: 4.5 },
  { id: 'rsa-mokoena',    name: 'Teboho Mokoena',    country: 'RSA', club: 'Mamelodi Sundowns B', pos: 'MID', price: 5.0 },
  { id: 'rsa-zwane',      name: 'Themba Zwane',      country: 'RSA', club: 'Mamelodi Sundowns C', pos: 'MID', price: 4.5 },

  { id: 'cze-stanek',     name: 'Jindřich Staněk',   country: 'CZE', club: 'Slavia Prague',      pos: 'GK',  price: 4.5 },
  { id: 'cze-hranac',     name: 'Robin Hranáč',      country: 'CZE', club: 'Hoffenheim B',       pos: 'DEF', price: 4.0 },
  { id: 'cze-schick',     name: 'Patrik Schick',     country: 'CZE', club: 'Bayer Leverkusen E', pos: 'FWD', price: 6.5 },
  { id: 'cze-hlozek',     name: 'Adam Hložek',       country: 'CZE', club: 'Hoffenheim C',       pos: 'FWD', price: 5.5 },

  { id: 'can-crepeau',    name: 'Maxime Crépeau',    country: 'CAN', club: 'Portland Timbers',   pos: 'GK',  price: 4.5 },
  { id: 'can-davies',     name: 'Alphonso Davies',   country: 'CAN', club: 'Bayern Munich E',    pos: 'DEF', price: 6.0 },
  { id: 'can-eustaquio',  name: 'Stephen Eustáquio', country: 'CAN', club: 'Porto B',            pos: 'MID', price: 5.0 },
  { id: 'can-david',      name: 'Jonathan David',    country: 'CAN', club: 'Juventus C',         pos: 'FWD', price: 7.5 },

  { id: 'nzl-marinovic',  name: 'Oliver Sail',       country: 'NZL', club: 'Wellington Phoenix', pos: 'GK',  price: 4.0 },
  { id: 'nzl-wood',       name: 'Chris Wood',        country: 'NZL', club: 'Nottingham Forest',  pos: 'FWD', price: 6.5 },

  { id: 'pan-mosquera',   name: 'Orlando Mosquera',  country: 'PAN', club: 'Olimpia B',          pos: 'GK',  price: 4.0 },
  { id: 'pan-carrasquilla', name: 'Adalberto Carrasquilla', country: 'PAN', club: 'Houston Dynamo', pos: 'MID', price: 4.5 },
  { id: 'pan-fajardo',    name: 'José Fajardo',      country: 'PAN', club: 'Independiente',      pos: 'FWD', price: 4.5 },

  { id: 'alg-mandrea',    name: 'Alexandre Oukidja',  country: 'ALG', club: 'Metz',              pos: 'GK',  price: 4.0 },
  { id: 'alg-bennacer',   name: 'Ismaël Bennacer',   country: 'ALG', club: 'Milan I',            pos: 'MID', price: 5.5 },
  { id: 'alg-mahrez',     name: 'Riyad Mahrez',      country: 'ALG', club: 'Al Ahli C',          pos: 'FWD', price: 7.0 },

  { id: 'civ-pepe',       name: 'Nicolas Pépé',      country: 'CIV', club: 'Villarreal',         pos: 'FWD', price: 5.5 },
  { id: 'bih-dzeko',      name: 'Edin Džeko',        country: 'BIH', club: 'Fiorentina',         pos: 'FWD', price: 5.5 },
  { id: 'bih-tahirovic',  name: 'Benjamin Tahirović', country: 'BIH', club: 'Ajax B',            pos: 'MID', price: 4.5 },
  { id: 'bih-sehic',      name: 'Ibrahim Šehić',     country: 'BIH', club: 'Zrinjski',           pos: 'GK',  price: 4.0 },

  { id: 'qat-barsham',    name: 'Meshaal Barsham',   country: 'QAT', club: 'Al Sadd',            pos: 'GK',  price: 4.0 },
  { id: 'qat-afif',       name: 'Akram Afif',        country: 'QAT', club: 'Al Sadd B',          pos: 'FWD', price: 5.5 },
  { id: 'iraq-jasim',     name: 'Aymen Hussein',     country: 'IRQ', club: 'Al Qadsiah B',       pos: 'FWD', price: 4.5 },
  { id: 'iraq-rashid',    name: 'Jalal Hassan',      country: 'IRQ', club: 'Al Shorta',          pos: 'GK',  price: 4.0 },

  { id: 'jor-shafi',      name: 'Yazeed Abulaila',   country: 'JOR', club: 'Al-Faisaly',         pos: 'GK',  price: 4.0 },
  { id: 'jor-altamari',   name: 'Mousa Al-Tamari',   country: 'JOR', club: 'Montpellier',        pos: 'FWD', price: 5.5 },
  { id: 'uzb-nematov',    name: 'Utkir Yusupov',     country: 'UZB', club: 'Pakhtakor',          pos: 'GK',  price: 4.0 },
  { id: 'uzb-shomurodov', name: 'Eldor Shomurodov',  country: 'UZB', club: 'Roma B',             pos: 'FWD', price: 5.0 },

  { id: 'cpv-vozinha',    name: 'Vozinha',           country: 'CPV', club: 'Al-Kholood',         pos: 'GK',  price: 4.0 },
  { id: 'cpv-tavares',    name: 'Bryan Teixeira',    country: 'CPV', club: 'Sheriff',            pos: 'MID', price: 4.5 },
  { id: 'cod-mbemba',     name: 'Chancel Mbemba',    country: 'COD', club: 'Lille',              pos: 'DEF', price: 4.5 },
  { id: 'cod-bakambu',    name: 'Cédric Bakambu',    country: 'COD', club: 'Real Betis B',       pos: 'FWD', price: 5.0 },

  { id: 'hai-placide',    name: 'Johny Placide',     country: 'HAI', club: 'Châteauroux',        pos: 'GK',  price: 4.0 },
  { id: 'hai-pierrot',    name: 'Frantzdy Pierrot',  country: 'HAI', club: 'Hapoel Be’er Sheva', pos: 'FWD', price: 4.5 },
  { id: 'cuw-room',       name: 'Eloy Room',         country: 'CUW', club: 'Columbus Crew',      pos: 'GK',  price: 4.0 },
  { id: 'cuw-bacuna',     name: 'Leandro Bacuna',    country: 'CUW', club: 'Almere City',        pos: 'MID', price: 4.5 },
]

// Quick lookup by id
export const PLAYER_BY_ID = PLAYERS.reduce((acc, p) => { acc[p.id] = p; return acc }, {})
