import { NextRequest, NextResponse } from 'next/server';

// Fonction pour convertir une réponse en score numérique
function getScore(answer: string): number {
  if (answer === 'd_accord') return 2;
  if (answer === 'neutre') return 1;
  if (answer === 'pas_d_accord') return 0;
  return 1; // Par défaut neutre
}

// Fonction pour analyser les réponses et générer un profil de personnalité
function analyzePersonality(answers: Record<string, string>) {
  // Calculer les scores pour différents traits
  const perfectionism = (getScore(answers.accept_errors || '') + getScore(answers.do_things_right || '')) / 2;
  const altruism = (getScore(answers.valued_helping || '') + getScore(answers.others_before_me || '')) / 2;
  const achievement = getScore(answers.success_important || '');
  const adaptability = getScore(answers.adapt_behavior || '');
  const uniqueness = getScore(answers.feel_different || '');
  const emotionality = getScore(answers.emotions_important || '');
  const introversion = getScore(answers.need_alone_time || '');
  const depth = getScore(answers.understand_depth || '');
  const riskAversion = (getScore(answers.think_risks || '') + getScore(answers.need_security || '')) / 2;
  const openness = getScore(answers.seek_experiences || '');
  const positivity = getScore(answers.avoid_negative || '');
  const control = getScore(answers.keep_control || '');
  const vulnerability = 2 - getScore(answers.hide_vulnerability || ''); // Inversé
  const conflictAvoidance = (getScore(answers.avoid_conflicts || '') + getScore(answers.preserve_harmony || '')) / 2;

  // Générer le prompt de personnalité détaillé
  let personalityDescription = `PROFIL DE PERSONNALITÉ:\n\n`;

  // Perfectionnisme
  if (perfectionism >= 1.5) {
    personalityDescription += `- Personne perfectionniste qui a du mal à accepter ses erreurs et ressent le besoin de faire les choses "comme il faut". Attaché à la qualité et aux standards élevés.\n`;
  } else if (perfectionism <= 0.5) {
    personalityDescription += `- Personne détendue, qui accepte facilement ses erreurs et n'est pas obsédée par la perfection. Flexible et tolérante avec soi-même.\n`;
  }

  // Altruisme
  if (altruism >= 1.5) {
    personalityDescription += `- Personne très altruiste qui se sent valorisée en aidant les autres et pense souvent aux besoins des autres avant les siens. Empathique et généreuse.\n`;
  } else if (altruism <= 0.5) {
    personalityDescription += `- Personne qui sait prendre soin d'elle-même et équilibre ses propres besoins avec ceux des autres. Indépendante.\n`;
  }

  // Réussite
  if (achievement >= 1.5) {
    personalityDescription += `- La réussite est très importante. Orientée vers les objectifs et motivée par l'accomplissement.\n`;
  }

  // Adaptation sociale
  if (adaptability >= 1.5) {
    personalityDescription += `- Adapte souvent son comportement pour être bien perçu. Consciente de l'image qu'elle projette et soucieuse de l'harmonie sociale.\n`;
  }

  // Unicité
  if (uniqueness >= 1.5) {
    personalityDescription += `- Se sent souvent différente des autres. A un sens de l'identité unique et peut avoir des perspectives originales.\n`;
  }

  // Émotions
  if (emotionality >= 1.5) {
    personalityDescription += `- Les émotions prennent une grande place dans la vie. Personne sensible, intuitive et en contact avec ses sentiments.\n`;
  } else if (emotionality <= 0.5) {
    personalityDescription += `- Personne plutôt rationnelle et équilibrée émotionnellement. Garde une certaine distance avec ses émotions.\n`;
  }

  // Introversion
  if (introversion >= 1.5) {
    personalityDescription += `- A besoin de beaucoup de temps seul pour se ressourcer. Introvertie, réfléchie et apprécie la solitude.\n`;
  } else if (introversion <= 0.5) {
    personalityDescription += `- Personne plutôt extravertie qui tire son énergie des interactions sociales. Dynamique et sociable.\n`;
  }

  // Profondeur
  if (depth >= 1.5) {
    personalityDescription += `- Aime comprendre les choses en profondeur avant d'agir. Analytique, réfléchie et méthodique.\n`;
  }

  // Aversion au risque
  if (riskAversion >= 1.5) {
    personalityDescription += `- Pense souvent aux risques avant de prendre des décisions et a besoin de se sentir en sécurité pour avancer sereinement. Prudente et réfléchie.\n`;
  } else if (riskAversion <= 0.5) {
    personalityDescription += `- Personne plutôt audacieuse qui n'a pas peur de prendre des risques. Aventureuse et spontanée.\n`;
  }

  // Ouverture
  if (openness >= 1.5) {
    personalityDescription += `- Cherche souvent de nouvelles expériences stimulantes. Curieuse, ouverte d'esprit et aventureuse.\n`;
  }

  // Positivité
  if (positivity >= 1.5) {
    personalityDescription += `- Évite autant que possible les situations trop négatives ou pesantes. Optimiste et cherche à maintenir une atmosphère positive.\n`;
  }

  // Contrôle
  if (control >= 1.5) {
    personalityDescription += `- Aime garder le contrôle de sa vie et de ses choix. Indépendante et déterminée.\n`;
  }

  // Vulnérabilité
  if (vulnerability <= 0.5) {
    personalityDescription += `- N'aime pas montrer sa vulnérabilité. Garde une certaine réserve et préfère paraître fort(e).\n`;
  } else if (vulnerability >= 1.5) {
    personalityDescription += `- À l'aise avec sa vulnérabilité et peut l'exprimer ouvertement. Authentique et transparente.\n`;
  }

  // Évitement des conflits
  if (conflictAvoidance >= 1.5) {
    personalityDescription += `- Évite les conflits autant que possible et préfère préserver l'harmonie plutôt que d'imposer son avis. Diplomate et conciliante.\n`;
  } else if (conflictAvoidance <= 0.5) {
    personalityDescription += `- N'a pas peur des conflits et peut exprimer son désaccord directement. Assertive et directe.\n`;
  }

  // Déterminer le ton général
  let tone = 'friendly';
  if (emotionality >= 1.5 && conflictAvoidance >= 1.5) {
    tone = 'warm';
  } else if (control >= 1.5 && vulnerability <= 0.5) {
    tone = 'professional';
  } else if (openness >= 1.5 && positivity >= 1.5) {
    tone = 'enthusiastic';
  } else if (introversion >= 1.5 && depth >= 1.5) {
    tone = 'thoughtful';
  }

  // Déterminer le style d'humour
  let humor = 'light';
  if (positivity >= 1.5 && openness >= 1.5) {
    humor = 'playful';
  } else if (uniqueness >= 1.5) {
    humor = 'witty';
  } else if (emotionality <= 0.5) {
    humor = 'dry';
  }

  // Déterminer la longueur des messages
  let messageLength = 'medium';
  if (depth >= 1.5 && perfectionism >= 1.5) {
    messageLength = 'detailed';
  } else if (openness >= 1.5 && emotionality <= 0.5) {
    messageLength = 'concise';
  }

  // Déterminer l'utilisation d'emojis
  let emojis = 'moderate';
  if (positivity >= 1.5 && emotionality >= 1.5) {
    emojis = 'frequent';
  } else if (emotionality <= 0.5 && control >= 1.5) {
    emojis = 'rare';
  }

  return {
    personalityDescription,
    tone,
    humor,
    messageLength,
    emojis,
    // Données brutes pour référence
    rawAnswers: answers,
    scores: {
      perfectionism,
      altruism,
      achievement,
      adaptability,
      uniqueness,
      emotionality,
      introversion,
      depth,
      riskAversion,
      openness,
      positivity,
      control,
      vulnerability,
      conflictAvoidance,
    },
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { answers } = body;

    if (!answers) {
      return NextResponse.json(
        { error: 'Réponses requises' },
        { status: 400 }
      );
    }

    // Analyser les réponses et générer le profil de personnalité
    const personalityAnalysis = analyzePersonality(answers);

    // Créer les règles de personnalité pour Claude
    const personalityRules = {
      // Format pour compatibilité avec l'API chat
      tone: personalityAnalysis.tone,
      humor: personalityAnalysis.humor,
      emojis: personalityAnalysis.emojis,
      messageLength: personalityAnalysis.messageLength,
      interests: [],
      // Description détaillée pour le prompt système
      description: personalityAnalysis.personalityDescription,
      // Données brutes
      rawAnswers: personalityAnalysis.rawAnswers,
      scores: personalityAnalysis.scores,
    };

    return NextResponse.json({
      success: true,
      personalityRules,
    });

  } catch (error) {
    console.error('Erreur lors de la transformation:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la transformation de la personnalité' },
      { status: 500 }
    );
  }
}
