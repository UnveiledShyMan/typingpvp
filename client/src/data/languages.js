// Mots les plus utilisés par langue (top 200-300 mots)
// Format : liste de mots sans cohérence de phrase, juste les mots les plus fréquents

export const languages = {
  en: {
    name: 'English',
    words: [
      'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i',
      'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
      'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she',
      'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what',
      'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me',
      'when', 'make', 'can', 'like', 'time', 'no', 'just', 'him', 'know', 'take',
      'people', 'into', 'year', 'your', 'good', 'some', 'could', 'them', 'see', 'other',
      'than', 'then', 'now', 'look', 'only', 'come', 'its', 'over', 'think', 'also',
      'back', 'after', 'use', 'two', 'how', 'our', 'work', 'first', 'well', 'way',
      'even', 'new', 'want', 'because', 'any', 'these', 'give', 'day', 'most', 'us',
      'is', 'are', 'was', 'were', 'been', 'being', 'has', 'had', 'having', 'does',
      'did', 'done', 'doing', 'said', 'say', 'says', 'saying', 'goes', 'went', 'gone',
      'get', 'got', 'gotten', 'got', 'make', 'made', 'making', 'know', 'knew', 'known',
      'think', 'thought', 'thinking', 'see', 'saw', 'seen', 'come', 'came', 'coming', 'take',
      'took', 'taken', 'give', 'gave', 'given', 'find', 'found', 'finding', 'tell', 'told',
      'ask', 'asked', 'work', 'worked', 'seem', 'seemed', 'feel', 'felt', 'try', 'tried',
      'leave', 'left', 'call', 'called', 'need', 'needed', 'want', 'wanted', 'help', 'helped',
      'keep', 'kept', 'turn', 'turned', 'start', 'started', 'show', 'showed', 'hear', 'heard',
      'play', 'played', 'run', 'ran', 'move', 'moved', 'live', 'lived', 'believe', 'believed',
      'bring', 'brought', 'happen', 'happened', 'write', 'wrote', 'sit', 'sat', 'stand', 'stood',
      'lose', 'lost', 'pay', 'paid', 'meet', 'met', 'include', 'included', 'continue', 'continued',
      'set', 'set', 'learn', 'learned', 'change', 'changed', 'lead', 'led', 'understand', 'understood',
      'watch', 'watched', 'follow', 'followed', 'stop', 'stopped', 'create', 'created', 'speak', 'spoke',
      'read', 'read', 'allow', 'allowed', 'add', 'added', 'spend', 'spent', 'grow', 'grew',
      'open', 'opened', 'walk', 'walked', 'win', 'won', 'offer', 'offered', 'remember', 'remembered',
      'love', 'loved', 'consider', 'considered', 'appear', 'appeared', 'buy', 'bought', 'wait', 'waited',
      'serve', 'served', 'die', 'died', 'send', 'sent', 'build', 'built', 'stay', 'stayed',
      'fall', 'fell', 'cut', 'cut', 'reach', 'reached', 'kill', 'killed', 'raise', 'raised',
      'pass', 'passed', 'sell', 'sold', 'decide', 'decided', 'return', 'returned', 'explain', 'explained'
    ]
  },
  fr: {
    name: 'Français',
    words: [
      'le', 'de', 'et', 'à', 'un', 'il', 'être', 'et', 'en', 'avoir',
      'que', 'pour', 'dans', 'ce', 'son', 'une', 'sur', 'avec', 'ne', 'se',
      'pas', 'tout', 'plus', 'par', 'grand', 'en', 'une', 'autre', 'du', 'de',
      'le', 'et', 'à', 'il', 'être', 'en', 'avoir', 'que', 'pour', 'dans',
      'ce', 'son', 'une', 'sur', 'avec', 'ne', 'se', 'pas', 'tout', 'plus',
      'par', 'grand', 'en', 'une', 'autre', 'du', 'de', 'le', 'et', 'à',
      'être', 'avoir', 'faire', 'dire', 'aller', 'voir', 'savoir', 'vouloir', 'venir', 'falloir',
      'pouvoir', 'devoir', 'parler', 'trouver', 'donner', 'prendre', 'mettre', 'rester', 'passer', 'comprendre',
      'connaître', 'rendre', 'laisser', 'entendre', 'sortir', 'monter', 'descendre', 'arriver', 'partir', 'revenir',
      'suivre', 'vivre', 'revenir', 'porter', 'montrer', 'chercher', 'attendre', 'reconnaître', 'appeler', 'croire',
      'permettre', 'jouer', 'lire', 'écrire', 'choisir', 'compter', 'continuer', 'créer', 'décider', 'demander',
      'découvrir', 'dessiner', 'dire', 'donner', 'écouter', 'entrer', 'essayer', 'éviter', 'expliquer', 'finir',
      'garder', 'habiter', 'inviter', 'jeter', 'lever', 'manger', 'marcher', 'mettre', 'ouvrir', 'partager',
      'perdre', 'porter', 'poser', 'pousser', 'pouvoir', 'préférer', 'prendre', 'présenter', 'quitter', 'recevoir',
      'refuser', 'regarder', 'rejeter', 'remercier', 'remplir', 'rentrer', 'répéter', 'répondre', 'rester', 'retourner',
      'réussir', 'réveiller', 'revoir', 'saisir', 'sauter', 'sauver', 'savoir', 'sentir', 'servir', 'souhaiter',
      'souffrir', 'souvenir', 'suffire', 'tenir', 'terminer', 'tirer', 'tomber', 'tourner', 'toucher', 'travailler',
      'traverser', 'trouver', 'tuer', 'utiliser', 'valoir', 'venir', 'vivre', 'voir', 'vouloir', 'vraiment',
      'beaucoup', 'bien', 'plus', 'très', 'trop', 'aussi', 'assez', 'moins', 'autant', 'peu',
      'encore', 'déjà', 'toujours', 'jamais', 'souvent', 'parfois', 'souvent', 'rarement', 'maintenant', 'alors',
      'après', 'avant', 'pendant', 'depuis', 'jusqu\'à', 'bientôt', 'hier', 'aujourd\'hui', 'demain', 'jour',
      'semaine', 'mois', 'année', 'temps', 'heure', 'minute', 'seconde', 'moment', 'fois', 'journée'
    ]
  },
  es: {
    name: 'Español',
    words: [
      'el', 'la', 'de', 'que', 'y', 'a', 'en', 'un', 'ser', 'se',
      'no', 'haber', 'por', 'con', 'su', 'para', 'como', 'estar', 'tener', 'le',
      'lo', 'todo', 'pero', 'más', 'hacer', 'o', 'poder', 'decir', 'este', 'ir',
      'otro', 'ese', 'la', 'si', 'me', 'ya', 'ver', 'porque', 'dar', 'cuando',
      'él', 'muy', 'sin', 'vez', 'mucho', 'saber', 'qué', 'sobre', 'mi', 'alguno',
      'mismo', 'yo', 'también', 'hasta', 'año', 'dos', 'querer', 'entre', 'así', 'primero',
      'desde', 'grande', 'ese', 'ni', 'nos', 'llegar', 'pasar', 'tiempo', 'ella', 'sí',
      'día', 'uno', 'bien', 'poco', 'deber', 'entonces', 'poner', 'cosa', 'tanto', 'hombre',
      'parecer', 'nuestro', 'tan', 'donde', 'ahora', 'parte', 'después', 'vida', 'quedar', 'siempre',
      'creer', 'hablar', 'llevar', 'dejar', 'nada', 'cada', 'seguir', 'menos', 'nuevo', 'encontrar',
      'venir', 'pensar', 'casa', 'mirar', 'otro', 'trabajar', 'forma', 'hasta', 'empezar', 'año',
      'hacer', 'decir', 'ir', 'ver', 'saber', 'querer', 'tener', 'llegar', 'pasar', 'deber',
      'poner', 'parecer', 'quedar', 'hablar', 'llevar', 'dejar', 'seguir', 'encontrar', 'llamar', 'venir',
      'pensar', 'salir', 'volver', 'tomar', 'tratar', 'contar', 'acabar', 'aceptar', 'alcanzar', 'aprender',
      'ayudar', 'buscar', 'cambiar', 'caminar', 'cargar', 'casar', 'cerrar', 'comenzar', 'comer', 'comprar',
      'conocer', 'conseguir', 'construir', 'contar', 'continuar', 'correr', 'crear', 'crecer', 'cumplir', 'dar',
      'decidir', 'defender', 'dejar', 'descubrir', 'desear', 'despertar', 'devolver', 'dirigir', 'dormir', 'empezar',
      'encantar', 'encender', 'encontrar', 'entender', 'entrar', 'entregar', 'enviar', 'escribir', 'escuchar', 'esperar',
      'estar', 'estudiar', 'evitar', 'existir', 'explicar', 'formar', 'ganar', 'gastar', 'gustar', 'haber',
      'hablar', 'hacer', 'jugar', 'leer', 'levantar', 'limpiar', 'llevar', 'llamar', 'llegar', 'llenar',
      'llevar', 'llorar', 'luchar', 'mandar', 'mantener', 'matar', 'medir', 'mentir', 'meter', 'mirar',
      'morir', 'mostrar', 'mover', 'nacer', 'necesitar', 'ocurrir', 'ofrecer', 'oír', 'olvidar', 'pagar',
      'parar', 'parecer', 'partir', 'pasar', 'pedir', 'pegar', 'pensar', 'perder', 'permitir', 'pesar'
    ]
  },
  de: {
    name: 'Deutsch',
    words: [
      'der', 'die', 'und', 'in', 'den', 'von', 'zu', 'das', 'mit', 'sich',
      'des', 'auf', 'für', 'ist', 'im', 'dem', 'nicht', 'ein', 'eine', 'als',
      'auch', 'es', 'an', 'werden', 'aus', 'er', 'hat', 'dass', 'sie', 'nach',
      'wird', 'bei', 'einer', 'um', 'am', 'sind', 'noch', 'wie', 'einem', 'über',
      'einen', 'so', 'zum', 'war', 'haben', 'nur', 'oder', 'aber', 'vor', 'zur',
      'bis', 'mehr', 'durch', 'man', 'sein', 'wurde', 'sei', 'in', 'der', 'wenn',
      'müssen', 'seit', 'während', 'weil', 'obwohl', 'damit', 'dass', 'wenn', 'falls', 'sobald',
      'bevor', 'nachdem', 'indem', 'ohne', 'statt', 'außer', 'gegen', 'für', 'über', 'unter',
      'zwischen', 'durch', 'entlang', 'gegenüber', 'hinter', 'neben', 'vor', 'hinter', 'oben', 'unten',
      'sein', 'haben', 'werden', 'können', 'müssen', 'sollen', 'wollen', 'dürfen', 'mögen', 'möchten',
      'gehen', 'kommen', 'sehen', 'wissen', 'finden', 'geben', 'nehmen', 'machen', 'sagen', 'denken',
      'stehen', 'liegen', 'sitzen', 'laufen', 'fahren', 'fliegen', 'schwimmen', 'springen', 'klettern', 'rennen',
      'arbeiten', 'spielen', 'lesen', 'schreiben', 'hören', 'sprechen', 'fragen', 'antworten', 'erklären', 'verstehen',
      'lernen', 'lehren', 'studieren', 'prüfen', 'lösen', 'bauen', 'erschaffen', 'zerstören', 'reparieren', 'verbessern',
      'kaufen', 'verkaufen', 'bezahlen', 'sparen', 'verdienen', 'ausgeben', 'schenken', 'bekommen', 'erhalten', 'verlieren',
      'gewinnen', 'verlieren', 'kämpfen', 'verteidigen', 'angreifen', 'schützen', 'helfen', 'retten', 'befreien', 'gefangen',
      'lieben', 'hassen', 'mögen', 'nicht mögen', 'bewundern', 'respektieren', 'verachten', 'fürchten', 'hoffen', 'wünschen',
      'glauben', 'zweifeln', 'wissen', 'vergessen', 'erinnern', 'merken', 'beachten', 'ignorieren', 'verstehen', 'missverstehen',
      'öffnen', 'schließen', 'beginnen', 'enden', 'starten', 'stoppen', 'fortsetzen', 'pausieren', 'aufhören', 'weiter machen',
      'essen', 'trinken', 'kochen', 'backen', 'schmecken', 'riechen', 'probieren', 'genießen', 'verhungern', 'durstig',
      'schlafen', 'wachsen', 'träumen', 'wachen', 'ruhen', 'ausruhen', 'ermüden', 'erholen', 'entspannen', 'anstrengen'
    ]
  },
  it: {
    name: 'Italiano',
    words: [
      'il', 'di', 'che', 'e', 'la', 'a', 'è', 'un', 'per', 'in',
      'una', 'sono', 'è', 'con', 'non', 'le', 'si', 'lo', 'ha', 'anche',
      'questo', 'ma', 'da', 'come', 'più', 'tra', 'sul', 'del', 'gli', 'quando',
      'essere', 'avere', 'fare', 'dire', 'andare', 'vedere', 'sapere', 'volere', 'venire', 'dovere',
      'potere', 'parlare', 'trovare', 'dare', 'prendere', 'mettere', 'rimanere', 'passare', 'capire', 'conoscere',
      'rendere', 'lasciare', 'sentire', 'uscire', 'salire', 'scendere', 'arrivare', 'partire', 'tornare', 'seguire',
      'vivere', 'portare', 'mostrare', 'cercare', 'aspettare', 'riconoscere', 'chiamare', 'credere', 'permettere', 'giocare',
      'leggere', 'scrivere', 'scegliere', 'contare', 'continuare', 'creare', 'decidere', 'chiedere', 'scoprire', 'disegnare',
      'dire', 'dare', 'ascoltare', 'entrare', 'provare', 'evitare', 'spiegare', 'finire', 'tenere', 'abitare',
      'invitare', 'gettare', 'alzare', 'mangiare', 'camminare', 'mettere', 'aprire', 'condividere', 'perdere', 'portare',
      'porre', 'spingere', 'potere', 'preferire', 'prendere', 'presentare', 'lasciare', 'ricevere', 'rifiutare', 'guardare',
      'rigettare', 'ringraziare', 'riempire', 'rientrare', 'ripetere', 'rispondere', 'rimanere', 'ritornare', 'riuscire', 'svegliare',
      'rivedere', 'afferrare', 'saltare', 'salvare', 'sapere', 'sentire', 'servire', 'augurare', 'soffrire', 'ricordare',
      'bastare', 'tenere', 'terminare', 'tirare', 'cadere', 'girare', 'toccare', 'lavorare', 'attraversare', 'trovare',
      'uccidere', 'usare', 'valere', 'venire', 'vivere', 'vedere', 'volere', 'veramente', 'molto', 'bene',
      'più', 'troppo', 'anche', 'abbastanza', 'meno', 'altrettanto', 'poco', 'ancora', 'già', 'sempre',
      'mai', 'spesso', 'qualche volta', 'raramente', 'ora', 'allora', 'dopo', 'prima', 'durante', 'da',
      'fino', 'presto', 'ieri', 'oggi', 'domani', 'giorno', 'settimana', 'mese', 'anno', 'tempo',
      'ora', 'minuto', 'secondo', 'momento', 'volta', 'giornata'
    ]
  },
  pt: {
    name: 'Português',
    words: [
      'o', 'de', 'e', 'do', 'da', 'em', 'um', 'uma', 'para', 'é',
      'com', 'não', 'uma', 'os', 'no', 'se', 'na', 'por', 'mais', 'as',
      'os', 'como', 'mas', 'foi', 'ao', 'ele', 'das', 'tem', 'à', 'seu',
      'sua', 'ou', 'ser', 'quando', 'muito', 'há', 'nos', 'já', 'está', 'eu',
      'também', 'só', 'pelo', 'pela', 'até', 'isso', 'ela', 'entre', 'era', 'depois',
      'sem', 'mesmo', 'aos', 'ter', 'seus', 'suas', 'numa', 'pelos', 'pelas', 'havia',
      'seja', 'qual', 'será', 'nós', 'tenho', 'lhe', 'deles', 'essas', 'esses', 'pelas',
      'pelos', 'pelas', 'pelas', 'pelas', 'pelas', 'pelas', 'pelas', 'pelas', 'pelas', 'pelas',
      'ser', 'estar', 'ter', 'haver', 'fazer', 'dizer', 'ir', 'ver', 'saber', 'querer',
      'vir', 'dar', 'poder', 'dever', 'pôr', 'ficar', 'trazer', 'levar', 'passar', 'chegar',
      'deixar', 'falar', 'ouvir', 'entrar', 'sair', 'subir', 'descer', 'chegar', 'partir', 'voltar',
      'seguir', 'viver', 'portar', 'mostrar', 'procurar', 'esperar', 'reconhecer', 'chamar', 'crer', 'permitir',
      'jogar', 'ler', 'escrever', 'escolher', 'contar', 'continuar', 'criar', 'decidir', 'pedir', 'descobrir',
      'desenhar', 'dizer', 'dar', 'escutar', 'entrar', 'tentar', 'evitar', 'explicar', 'terminar', 'manter',
      'morar', 'convidar', 'jogar', 'levantar', 'comer', 'andar', 'pôr', 'abrir', 'compartilhar', 'perder',
      'portar', 'colocar', 'empurrar', 'poder', 'preferir', 'tomar', 'apresentar', 'deixar', 'receber', 'recusar',
      'olhar', 'rejeitar', 'agradecer', 'encher', 'voltar', 'repetir', 'responder', 'ficar', 'retornar', 'conseguir',
      'acordar', 'rever', 'agarrar', 'saltar', 'salvar', 'saber', 'sentir', 'servir', 'desejar', 'sofrer',
      'lembrar', 'bastar', 'manter', 'terminar', 'puxar', 'cair', 'girar', 'tocar', 'trabalhar', 'atravessar',
      'encontrar', 'matar', 'usar', 'valer', 'vir', 'viver', 'ver', 'querer', 'verdadeiramente', 'muito',
      'bem', 'mais', 'muito', 'também', 'suficiente', 'menos', 'tanto', 'pouco', 'ainda', 'já',
      'sempre', 'nunca', 'muitas vezes', 'às vezes', 'raramente', 'agora', 'então', 'depois', 'antes', 'durante',
      'desde', 'até', 'breve', 'ontem', 'hoje', 'amanhã', 'dia', 'semana', 'mês', 'ano',
      'tempo', 'hora', 'minuto', 'segundo', 'momento', 'vez', 'dia'
    ]
  },
  ru: {
    name: 'Русский',
    words: [
      'в', 'и', 'не', 'что', 'он', 'на', 'я', 'со', 'как', 'а',
      'то', 'все', 'она', 'так', 'его', 'но', 'да', 'ты', 'к', 'у',
      'же', 'вы', 'за', 'бы', 'по', 'только', 'ее', 'мне', 'было', 'вот',
      'от', 'меня', 'еще', 'нет', 'о', 'из', 'ему', 'теперь', 'когда', 'даже',
      'ну', 'вдруг', 'ли', 'если', 'уже', 'или', 'ни', 'быть', 'есть', 'был',
      'быть', 'быть', 'стать', 'стать', 'стать', 'стать', 'стать', 'стать', 'стать', 'стать',
      'делать', 'делать', 'делать', 'делать', 'делать', 'делать', 'делать', 'делать', 'делать', 'делать',
      'идти', 'идти', 'идти', 'идти', 'идти', 'идти', 'идти', 'идти', 'идти', 'идти',
      'говорить', 'говорить', 'говорить', 'говорить', 'говорить', 'говорить', 'говорить', 'говорить', 'говорить', 'говорить',
      'видеть', 'видеть', 'видеть', 'видеть', 'видеть', 'видеть', 'видеть', 'видеть', 'видеть', 'видеть',
      'знать', 'знать', 'знать', 'знать', 'знать', 'знать', 'знать', 'знать', 'знать', 'знать',
      'хотеть', 'хотеть', 'хотеть', 'хотеть', 'хотеть', 'хотеть', 'хотеть', 'хотеть', 'хотеть', 'хотеть',
      'мочь', 'мочь', 'мочь', 'мочь', 'мочь', 'мочь', 'мочь', 'мочь', 'мочь', 'мочь',
      'нужно', 'нужно', 'нужно', 'нужно', 'нужно', 'нужно', 'нужно', 'нужно', 'нужно', 'нужно'
    ]
  },
  ja: {
    name: '日本語',
    words: [
      'の', 'に', 'は', 'を', 'た', 'が', 'で', 'て', 'と', 'し',
      'れ', 'さ', 'ある', 'いる', 'も', 'する', 'から', 'な', 'こと', 'として',
      'い', 'や', 'れる', 'など', 'なった', 'あり', 'まで', 'られ', 'なっ', 'ている',
      'これ', 'と', 'に', 'を', 'た', 'が', 'で', 'て', 'と', 'し',
      'れる', 'さ', 'ある', 'いる', 'も', 'する', 'から', 'な', 'こと', 'として',
      'い', 'や', 'れる', 'など', 'なった', 'あり', 'まで', 'られ', 'なっ', 'ている',
      'する', 'なる', '行く', '来る', '見る', '言う', '知る', '思う', '聞く', '読む',
      '書く', '話す', '作る', '買う', '売る', '食べる', '飲む', '寝る', '起きる', '起きる',
      '立つ', '座る', '歩く', '走る', '飛ぶ', '泳ぐ', '遊ぶ', '働く', '勉強する', '教える',
      '学ぶ', '習う', '覚える', '忘れる', '考える', '分かる', '間違う', '正しい', '良い', '悪い',
      '大きい', '小さい', '新しい', '古い', '高い', '低い', '長い', '短い', '広い', '狭い',
      '早い', '遅い', '易しい', '難しい', '明るい', '暗い', '熱い', '冷たい', '暖かい', '涼しい'
    ]
  },
  zh: {
    name: '中文',
    words: [
      '的', '了', '在', '是', '我', '有', '和', '就', '不', '人',
      '这', '中', '大', '为', '上', '个', '国', '我', '以', '要',
      '他', '时', '来', '用', '们', '生', '到', '作', '地', '于',
      '出', '就', '分', '对', '成', '会', '可', '主', '发', '年',
      '动', '同', '工', '也', '能', '下', '过', '子', '说', '产',
      '种', '面', '而', '方', '后', '多', '定', '行', '学', '所',
      '部', '民', '得', '经', '十', '三', '之', '进', '着', '等',
      '做', '去', '想', '看', '听', '说', '读', '写', '买', '卖',
      '吃', '喝', '睡', '起', '走', '跑', '跳', '飞', '游', '玩',
      '工作', '学习', '教', '学', '记', '忘', '想', '懂', '错', '对',
      '好', '坏', '大', '小', '新', '旧', '高', '低', '长', '短',
      '快', '慢', '容易', '难', '亮', '暗', '热', '冷', '暖', '凉'
    ]
  },
  ko: {
    name: '한국어',
    words: [
      '이', '가', '을', '를', '에', '에서', '와', '과', '의', '로',
      '으로', '부터', '까지', '에게', '께', '한테', '보다', '처럼', '만', '도',
      '는', '은', '이', '가', '을', '를', '에', '에서', '와', '과',
      '하다', '되다', '있다', '없다', '이다', '아니다', '가다', '오다', '보다', '듣다',
      '말하다', '알다', '모르다', '생각하다', '사랑하다', '좋아하다', '싫어하다', '원하다', '필요하다', '같다',
      '다르다', '크다', '작다', '많다', '적다', '좋다', '나쁘다', '예쁘다', '추하다', '밝다',
      '어둡다', '뜨겁다', '차갑다', '따뜻하다', '시원하다', '새롭다', '오래되다', '젊다', '늙다', '빠르다',
      '느리다', '쉽다', '어렵다', '높다', '낮다', '길다', '짧다', '넓다', '좁다', '깊다',
      '얕다', '가볍다', '무겁다', '부드럽다', '딱딱하다', '부드럽다', '거칠다', '부드럽다', '딱딱하다', '부드럽다',
      '읽다', '쓰다', '그리다', '그리다', '그리다', '그리다', '그리다', '그리다', '그리다', '그리다',
      '사다', '팔다', '주다', '받다', '주다', '받다', '주다', '받다', '주다', '받다',
      '먹다', '마시다', '자다', '일어나다', '일어나다', '일어나다', '일어나다', '일어나다', '일어나다', '일어나다',
      '일어나다', '일어나다', '일어나다', '일어나다', '일어나다', '일어나다', '일어나다', '일어나다', '일어나다', '일어나다'
    ]
  }
};

// Fonction pour générer un texte aléatoire avec X mots
export function generateText(langCode, wordCount = 50) {
  const lang = languages[langCode] || languages.en;
  const words = lang.words;
  const result = [];
  
  for (let i = 0; i < wordCount; i++) {
    const randomIndex = Math.floor(Math.random() * words.length);
    result.push(words[randomIndex]);
  }
  
  return result.join(' ');
}

