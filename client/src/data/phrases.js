// Phrases avec différents niveaux de difficulté
// Utilise les mots des langues pour créer des phrases cohérentes

import { languages } from './languages.js';

// Phrases simples (Facile) - 3-5 mots, mots courts et courants
const easyPhrases = {
  en: [
    'the cat is here',
    'i like this book',
    'she goes to school',
    'we have a dog',
    'they play outside',
    'he reads a book',
    'you can do it',
    'i see the sun',
    'we are friends',
    'she has a car',
    'they love music',
    'he wants food',
    'i need help',
    'we go home',
    'she likes cake',
    'they eat lunch',
    'he runs fast',
    'i drink water',
    'we sing songs',
    'she draws pictures'
  ],
  fr: [
    'le chat est là',
    'j aime ce livre',
    'elle va à l école',
    'nous avons un chien',
    'ils jouent dehors',
    'il lit un livre',
    'tu peux le faire',
    'je vois le soleil',
    'nous sommes amis',
    'elle a une voiture',
    'ils aiment la musique',
    'il veut manger',
    'j ai besoin d aide',
    'nous rentrons à la maison',
    'elle aime le gâteau',
    'ils mangent le déjeuner',
    'il court vite',
    'je bois de l eau',
    'nous chantons des chansons',
    'elle dessine des images'
  ],
  es: [
    'el gato está aquí',
    'me gusta este libro',
    'ella va a la escuela',
    'tenemos un perro',
    'ellos juegan afuera',
    'él lee un libro',
    'puedes hacerlo',
    'veo el sol',
    'somos amigos',
    'ella tiene un coche',
    'ellos aman la música',
    'él quiere comida',
    'necesito ayuda',
    'vamos a casa',
    'a ella le gusta el pastel',
    'ellos comen el almuerzo',
    'él corre rápido',
    'bebo agua',
    'cantamos canciones',
    'ella dibuja imágenes'
  ]
};

// Phrases moyennes (Moyen) - 6-10 mots, phrases plus complexes
const mediumPhrases = {
  en: [
    'the quick brown fox jumps over the lazy dog',
    'i want to learn how to play the piano',
    'she always reads books before going to sleep',
    'we should visit the museum this weekend',
    'they decided to start a new business together',
    'he enjoys playing video games with his friends',
    'i need to finish my homework before dinner',
    'we are planning a trip to the mountains',
    'she loves to cook delicious meals for her family',
    'they went to the store to buy some groceries',
    'he studies hard to get good grades in school',
    'i like to watch movies on rainy days',
    'we enjoy spending time together on weekends',
    'she practices the guitar every single day',
    'they organized a surprise party for their friend',
    'he works at a software company downtown',
    'i enjoy reading science fiction novels',
    'we decided to redecorate the living room',
    'she volunteers at the local animal shelter',
    'they love traveling to different countries'
  ],
  fr: [
    'le renard brun rapide saute par-dessus le chien paresseux',
    'je veux apprendre à jouer du piano',
    'elle lit toujours des livres avant de dormir',
    'nous devrions visiter le musée ce week-end',
    'ils ont décidé de créer une nouvelle entreprise ensemble',
    'il aime jouer aux jeux vidéo avec ses amis',
    'je dois finir mes devoirs avant le dîner',
    'nous planifions un voyage à la montagne',
    'elle adore cuisiner de délicieux repas pour sa famille',
    'ils sont allés au magasin pour acheter des provisions',
    'il étudie dur pour obtenir de bonnes notes à l école',
    'j aime regarder des films les jours de pluie',
    'nous aimons passer du temps ensemble le week-end',
    'elle pratique la guitare tous les jours',
    'ils ont organisé une fête surprise pour leur ami',
    'il travaille dans une entreprise de logiciels en centre-ville',
    'j aime lire des romans de science-fiction',
    'nous avons décidé de redécorer le salon',
    'elle fait du bénévolat au refuge pour animaux local',
    'ils adorent voyager dans différents pays'
  ],
  es: [
    'el zorro marrón rápido salta sobre el perro perezoso',
    'quiero aprender a tocar el piano',
    'ella siempre lee libros antes de dormir',
    'deberíamos visitar el museo este fin de semana',
    'decidieron comenzar un nuevo negocio juntos',
    'él disfruta jugando videojuegos con sus amigos',
    'necesito terminar mi tarea antes de la cena',
    'estamos planeando un viaje a las montañas',
    'ella ama cocinar comidas deliciosas para su familia',
    'fueron a la tienda para comprar algunos comestibles',
    'él estudia mucho para obtener buenas calificaciones en la escuela',
    'me gusta ver películas en días lluviosos',
    'disfrutamos pasar tiempo juntos los fines de semana',
    'ella practica la guitarra todos los días',
    'organizaron una fiesta sorpresa para su amigo',
    'él trabaja en una empresa de software en el centro',
    'disfruto leyendo novelas de ciencia ficción',
    'decidimos redecorar la sala de estar',
    'ella es voluntaria en el refugio de animales local',
    'ellos aman viajar a diferentes países'
  ]
};

// Phrases difficiles (Difficile) - 11-15 mots, vocabulaire avancé
const hardPhrases = {
  en: [
    'the sophisticated algorithm efficiently processes complex data structures and generates accurate results',
    'philosophers throughout history have debated the fundamental nature of consciousness and existence',
    'quantum mechanics reveals the probabilistic behavior of subatomic particles in extraordinary ways',
    'the intricate relationship between economics and psychology influences consumer behavior significantly',
    'astronomers discovered a remarkable exoplanet orbiting a distant star in the habitable zone',
    'the comprehensive analysis of linguistic patterns reveals fascinating insights into human communication',
    'neuroscientists are investigating the neural mechanisms underlying memory formation and retrieval',
    'the interdisciplinary approach combines elements from mathematics physics and computer science',
    'anthropologists study the cultural evolution of human societies across different geographical regions',
    'the theoretical framework provides a foundation for understanding complex biological systems',
    'archaeologists uncovered ancient artifacts that shed light on prehistoric civilizations',
    'the philosophical implications of artificial intelligence raise profound ethical questions',
    'meteorologists analyze atmospheric conditions to predict weather patterns with increasing accuracy',
    'the synthesis of organic compounds requires precise laboratory techniques and careful observation',
    'psychologists examine the cognitive processes involved in decision making and problem solving',
    'the mathematical model accurately describes the behavior of chaotic dynamical systems',
    'biologists investigate the genetic mechanisms responsible for evolutionary adaptations',
    'the historical analysis reveals patterns of social change across different time periods',
    'engineers develop innovative solutions to address complex technological challenges',
    'the literary analysis explores themes of identity and belonging in contemporary fiction'
  ],
  fr: [
    'l algorithme sophistiqué traite efficacement les structures de données complexes et génère des résultats précis',
    'les philosophes à travers l histoire ont débattu de la nature fondamentale de la conscience et de l existence',
    'la mécanique quantique révèle le comportement probabiliste des particules subatomiques de manière extraordinaire',
    'la relation complexe entre l économie et la psychologie influence considérablement le comportement des consommateurs',
    'les astronomes ont découvert une exoplanète remarquable en orbite autour d une étoile lointaine dans la zone habitable',
    'l analyse approfondie des modèles linguistiques révèle des aperçus fascinants sur la communication humaine',
    'les neuroscientifiques enquêtent sur les mécanismes neuronaux sous-jacents à la formation et à la récupération de la mémoire',
    'l approche interdisciplinaire combine des éléments des mathématiques de la physique et de l informatique',
    'les anthropologues étudient l évolution culturelle des sociétés humaines dans différentes régions géographiques',
    'le cadre théorique fournit une base pour comprendre les systèmes biologiques complexes',
    'les archéologues ont découvert des artefacts anciens qui éclairent les civilisations préhistoriques',
    'les implications philosophiques de l intelligence artificielle soulèvent des questions éthiques profondes',
    'les météorologues analysent les conditions atmosphériques pour prédire les modèles météorologiques avec une précision croissante',
    'la synthèse de composés organiques nécessite des techniques de laboratoire précises et une observation attentive',
    'les psychologues examinent les processus cognitifs impliqués dans la prise de décision et la résolution de problèmes',
    'le modèle mathématique décrit avec précision le comportement des systèmes dynamiques chaotiques',
    'les biologistes enquêtent sur les mécanismes génétiques responsables des adaptations évolutives',
    'l analyse historique révèle des modèles de changement social à travers différentes périodes',
    'les ingénieurs développent des solutions innovantes pour relever des défis technologiques complexes',
    'l analyse littéraire explore les thèmes de l identité et de l appartenance dans la fiction contemporaine'
  ],
  es: [
    'el algoritmo sofisticado procesa eficientemente estructuras de datos complejas y genera resultados precisos',
    'los filósofos a lo largo de la historia han debatido la naturaleza fundamental de la conciencia y la existencia',
    'la mecánica cuántica revela el comportamiento probabilístico de las partículas subatómicas de maneras extraordinarias',
    'la relación intrincada entre la economía y la psicología influye significativamente en el comportamiento del consumidor',
    'los astrónomos descubrieron un exoplaneta notable orbitando una estrella distante en la zona habitable',
    'el análisis exhaustivo de los patrones lingüísticos revela perspectivas fascinantes sobre la comunicación humana',
    'los neurocientíficos están investigando los mecanismos neuronales subyacentes a la formación y recuperación de la memoria',
    'el enfoque interdisciplinario combina elementos de las matemáticas la física y la informática',
    'los antropólogos estudian la evolución cultural de las sociedades humanas en diferentes regiones geográficas',
    'el marco teórico proporciona una base para comprender los sistemas biológicos complejos',
    'los arqueólogos descubrieron artefactos antiguos que arrojan luz sobre las civilizaciones prehistóricas',
    'las implicaciones filosóficas de la inteligencia artificial plantean profundas cuestiones éticas',
    'los meteorólogos analizan las condiciones atmosféricas para predecir patrones climáticos con creciente precisión',
    'la síntesis de compuestos orgánicos requiere técnicas de laboratorio precisas y observación cuidadosa',
    'los psicólogos examinan los procesos cognitivos involucrados en la toma de decisiones y la resolución de problemas',
    'el modelo matemático describe con precisión el comportamiento de los sistemas dinámicos caóticos',
    'los biólogos investigan los mecanismos genéticos responsables de las adaptaciones evolutivas',
    'el análisis histórico revela patrones de cambio social a través de diferentes períodos de tiempo',
    'los ingenieros desarrollan soluciones innovadoras para abordar desafíos tecnológicos complejos',
    'el análisis literario explora temas de identidad y pertenencia en la ficción contemporánea'
  ]
};

// Phrases très difficiles (Hardcore) - 16+ mots, vocabulaire technique et complexe
const hardcorePhrases = {
  en: [
    'the epistemological foundations of scientific knowledge require rigorous methodological frameworks that account for inherent uncertainties in empirical observations',
    'contemporary quantum field theory provides elegant mathematical descriptions of fundamental particle interactions through sophisticated gauge symmetry principles',
    'the interdisciplinary synthesis of cognitive neuroscience computational modeling and behavioral psychology yields unprecedented insights into neural information processing',
    'philosophical inquiries into the nature of consciousness challenge traditional dualistic frameworks and necessitate novel approaches to understanding subjective experience',
    'the intricate dynamics of global economic systems demonstrate complex nonlinear relationships between monetary policy fiscal interventions and market behaviors',
    'archaeological evidence from multiple excavation sites reveals sophisticated technological innovations that predate conventional historical timelines by millennia',
    'the theoretical underpinnings of general relativity and quantum mechanics remain fundamentally incompatible despite decades of intensive theoretical research',
    'linguistic typology examines cross-linguistic patterns that reveal universal constraints on possible human language structures and grammatical systems',
    'the molecular mechanisms underlying epigenetic modifications provide crucial insights into gene expression regulation and cellular differentiation processes',
    'philosophical debates surrounding free will and determinism intersect with contemporary neuroscience findings in complex and often contradictory ways',
    'the computational complexity of modern cryptographic algorithms requires sophisticated mathematical analysis to ensure security against increasingly powerful attack vectors',
    'anthropological studies of cultural transmission mechanisms reveal intricate patterns of knowledge preservation and adaptation across generational boundaries',
    'the theoretical framework of evolutionary game theory provides elegant mathematical models for understanding strategic interactions in biological and social systems',
    'contemporary research in artificial neural networks demonstrates remarkable capabilities for pattern recognition and complex decision-making tasks',
    'the philosophical implications of multiverse theories challenge traditional conceptions of causality and raise profound questions about the nature of reality'
  ],
  fr: [
    'les fondements épistémologiques de la connaissance scientifique nécessitent des cadres méthodologiques rigoureux qui tiennent compte des incertitudes inhérentes aux observations empiriques',
    'la théorie quantique des champs contemporaine fournit des descriptions mathématiques élégantes des interactions fondamentales des particules grâce à des principes de symétrie de jauge sophistiqués',
    'la synthèse interdisciplinaire de la neuroscience cognitive de la modélisation computationnelle et de la psychologie comportementale produit des aperçus sans précédent sur le traitement de l information neuronale',
    'les enquêtes philosophiques sur la nature de la conscience remettent en question les cadres dualistes traditionnels et nécessitent de nouvelles approches pour comprendre l expérience subjective',
    'la dynamique complexe des systèmes économiques mondiaux démontre des relations non linéaires complexes entre la politique monétaire les interventions fiscales et les comportements du marché',
    'les preuves archéologiques de plusieurs sites d excavation révèlent des innovations technologiques sophistiquées qui précèdent les chronologies historiques conventionnelles de millénaires',
    'les fondements théoriques de la relativité générale et de la mécanique quantique restent fondamentalement incompatibles malgré des décennies de recherche théorique intensive',
    'la typologie linguistique examine les modèles interlinguistiques qui révèlent des contraintes universelles sur les structures linguistiques humaines possibles et les systèmes grammaticaux',
    'les mécanismes moléculaires sous-jacents aux modifications épigénétiques fournissent des aperçus cruciaux sur la régulation de l expression génique et les processus de différenciation cellulaire',
    'les débats philosophiques entourant le libre arbitre et le déterminisme se croisent avec les découvertes de la neuroscience contemporaine de manière complexe et souvent contradictoire',
    'la complexité computationnelle des algorithmes cryptographiques modernes nécessite une analyse mathématique sophistiquée pour assurer la sécurité contre des vecteurs d attaque de plus en plus puissants',
    'les études anthropologiques des mécanismes de transmission culturelle révèlent des modèles complexes de préservation et d adaptation des connaissances à travers les frontières générationnelles',
    'le cadre théorique de la théorie des jeux évolutionnistes fournit des modèles mathématiques élégants pour comprendre les interactions stratégiques dans les systèmes biologiques et sociaux',
    'la recherche contemporaine sur les réseaux de neurones artificiels démontre des capacités remarquables pour la reconnaissance de formes et les tâches de prise de décision complexes',
    'les implications philosophiques des théories du multivers remettent en question les conceptions traditionnelles de la causalité et soulèvent des questions profondes sur la nature de la réalité'
  ],
  es: [
    'los fundamentos epistemológicos del conocimiento científico requieren marcos metodológicos rigurosos que tengan en cuenta las incertidumbres inherentes en las observaciones empíricas',
    'la teoría cuántica de campos contemporánea proporciona descripciones matemáticas elegantes de las interacciones fundamentales de partículas a través de principios sofisticados de simetría gauge',
    'la síntesis interdisciplinaria de la neurociencia cognitiva el modelado computacional y la psicología conductual produce perspectivas sin precedentes sobre el procesamiento de información neural',
    'las investigaciones filosóficas sobre la naturaleza de la conciencia desafían los marcos dualistas tradicionales y requieren enfoques novedosos para comprender la experiencia subjetiva',
    'la dinámica intrincada de los sistemas económicos globales demuestra relaciones no lineales complejas entre la política monetaria las intervenciones fiscales y los comportamientos del mercado',
    'la evidencia arqueológica de múltiples sitios de excavación revela innovaciones tecnológicas sofisticadas que preceden las líneas de tiempo históricas convencionales por milenios',
    'los fundamentos teóricos de la relatividad general y la mecánica cuántica permanecen fundamentalmente incompatibles a pesar de décadas de investigación teórica intensiva',
    'la tipología lingüística examina patrones interlingüísticos que revelan restricciones universales sobre las estructuras de lenguaje humano posibles y los sistemas gramaticales',
    'los mecanismos moleculares subyacentes a las modificaciones epigenéticas proporcionan perspectivas cruciales sobre la regulación de la expresión génica y los procesos de diferenciación celular',
    'los debates filosóficos en torno al libre albedrío y el determinismo se cruzan con los hallazgos de la neurociencia contemporánea de maneras complejas y a menudo contradictorias',
    'la complejidad computacional de los algoritmos criptográficos modernos requiere análisis matemático sofisticado para asegurar la seguridad contra vectores de ataque cada vez más poderosos',
    'los estudios antropológicos de los mecanismos de transmisión cultural revelan patrones intrincados de preservación y adaptación del conocimiento a través de las fronteras generacionales',
    'el marco teórico de la teoría de juegos evolutivos proporciona modelos matemáticos elegantes para comprender las interacciones estratégicas en sistemas biológicos y sociales',
    'la investigación contemporánea en redes neuronales artificiales demuestra capacidades notables para el reconocimiento de patrones y tareas complejas de toma de decisiones',
    'las implicaciones filosóficas de las teorías del multiverso desafían las concepciones tradicionales de la causalidad y plantean preguntas profundas sobre la naturaleza de la realidad'
  ]
};

/**
 * Génère une phrase selon le niveau de difficulté
 * @param {string} langCode - Code de la langue (en, fr, es, etc.)
 * @param {string} difficulty - Niveau de difficulté: 'easy', 'medium', 'hard', 'hardcore'
 * @returns {string} - Phrase générée
 */
export function generatePhrase(langCode = 'en', difficulty = 'medium') {
  const lang = langCode || 'en';
  let phrases = [];
  
  switch (difficulty) {
    case 'easy':
      phrases = easyPhrases[lang] || easyPhrases.en;
      break;
    case 'medium':
      phrases = mediumPhrases[lang] || mediumPhrases.en;
      break;
    case 'hard':
      phrases = hardPhrases[lang] || hardPhrases.en;
      break;
    case 'hardcore':
      phrases = hardcorePhrases[lang] || hardcorePhrases.en;
      break;
    default:
      phrases = mediumPhrases[lang] || mediumPhrases.en;
  }
  
  if (phrases.length === 0) {
    // Fallback: utiliser les mots de la langue
    const langData = languages[lang] || languages.en;
    const words = langData.words;
    const wordCount = difficulty === 'easy' ? 5 : difficulty === 'medium' ? 10 : difficulty === 'hard' ? 15 : 20;
    const result = [];
    for (let i = 0; i < wordCount; i++) {
      const randomIndex = Math.floor(Math.random() * words.length);
      if (i === 0) {
        result.push(words[randomIndex]);
      } else {
        result.push(' ' + words[randomIndex]);
      }
    }
    return result.join('');
  }
  
  // Sélectionner une phrase aléatoire
  const randomIndex = Math.floor(Math.random() * phrases.length);
  return phrases[randomIndex];
}

/**
 * Génère plusieurs phrases pour créer un texte plus long
 * @param {string} langCode - Code de la langue
 * @param {string} difficulty - Niveau de difficulté
 * @param {number} phraseCount - Nombre de phrases à générer
 * @returns {string} - Texte composé de plusieurs phrases
 */
export function generatePhraseText(langCode = 'en', difficulty = 'medium', phraseCount = 10) {
  const phrases = [];
  for (let i = 0; i < phraseCount; i++) {
    phrases.push(generatePhrase(langCode, difficulty));
  }
  return phrases.join(' ');
}

