import { Servicio } from '../modelos';

export const CONSULTORIO = {
  direccion: 'Av. Vélez Sarsfield 761, Depto. 1° B',
  ciudad: 'Córdoba Capital',
  horario: 'Lun a Vie · 9-13 y 15-20 hs',
};

export interface GrupoServicios {
  nombre: string;
  tagline: string;
}

export const GRUPOS: GrupoServicios[] = [
  { nombre: 'Osteopatía', tagline: 'Recuperá el equilibrio de tu cuerpo' },
  { nombre: 'Terapia Postural Activa', tagline: 'Movimiento consciente para tu postura' },
  { nombre: 'Nutrición', tagline: 'Alimentación al servicio de tu bienestar' },
  { nombre: 'Masoterapia', tagline: 'Descarga muscular y alivio profundo' },
  { nombre: 'Test de Aire Espirado', tagline: 'Diagnóstico digestivo simple y no invasivo' },
  { nombre: 'Programas y Talleres', tagline: 'Procesos de varias sesiones para sostener el cambio' },
];

export const SERVICIOS: Servicio[] = [
  /* ---------------------------------------------------------- Osteopatía */
  {
    id: 'osteopatia-primera',
    nombre: 'Primera consulta de Osteopatía (valoración inicial)',
    categoria: 'Osteopatía',
    duracionMin: 60,
    precio: 40000,
    descripcion:
      'Evaluación completa de tu historia clínica y tu postura para definir el plan de tratamiento.',
    detalle:
      'Traé estudios previos si los tenés (radiografías, resonancias, análisis). En esta consulta se define la frecuencia y el enfoque del tratamiento.',
    imagenes: ['img/servicios/columna.svg', 'img/servicios/manos.svg', 'img/servicios/postura.svg'],
  },
  {
    id: 'osteopatia-sesion',
    nombre: 'Sesión de Osteopatía',
    categoria: 'Osteopatía',
    duracionMin: 50,
    precio: 35000,

    descripcion:
      'Tratamiento manual integral para dolores de columna, articulares y musculares, adaptado a tu motivo de consulta.',
    detalle:
      'Incluye evaluación del motivo de consulta y tratamiento con técnicas manuales sobre tejidos blandos, vísceras y articulaciones. Vení con ropa cómoda.',
    imagenes: ['img/servicios/manos.svg', 'img/servicios/columna.svg'],
  },
  {
    id: 'osteopatia-control',
    nombre: 'Sesión de control (seguimiento breve)',
    categoria: 'Osteopatía',
    duracionMin: 30,
    precio: 24000,
    descripcion:
      'Sesión corta de mantenimiento para quienes ya vienen tratándose y necesitan un ajuste puntual.',
    detalle:
      'Disponible si tuviste una sesión en los últimos 90 días. Trabajamos sobre una única zona o sobre los ejercicios indicados en la consulta anterior.',
    imagenes: ['img/servicios/manos.svg'],
  },
  {
    id: 'osteopatia-visceral',
    nombre: 'Osteopatía visceral (digestiva)',
    categoria: 'Osteopatía',
    duracionMin: 45,
    precio: 35000,
    descripcion:
      'Técnicas suaves sobre el abdomen para hinchazón, constipación, reflujo y tensión diafragmática.',
    detalle:
      'Ideal como complemento del plan nutricional o del Test de Aire Espirado. Vení con una comida liviana, evitando el ayuno prolongado.',
    imagenes: ['img/servicios/nutricion.svg', 'img/servicios/manos.svg'],
  },
  {
    id: 'osteopatia-craneal',
    nombre: 'Osteopatía craneosacral',
    categoria: 'Osteopatía',
    duracionMin: 40,
    precio: 33000,
    descripcion:
      'Abordaje muy suave para dolores de cabeza, bruxismo, vértigo, insomnio y estrés sostenido.',
    detalle:
      'Sesión de bajísimo impacto: se trabaja en camilla, boca arriba y con ropa. Muchas personas se relajan profundamente durante la sesión.',
    imagenes: ['img/servicios/manos.svg'],
  },
  {
    id: 'osteopatia-deportiva',
    nombre: 'Osteopatía deportiva',
    categoria: 'Osteopatía',
    duracionMin: 50,
    precio: 37000,
    descripcion:
      'Tratamiento orientado a sobrecargas, tendinopatías y recuperación entre entrenamientos o competencias.',
    detalle:
      'Contame en observaciones tu deporte, volumen semanal y si tenés una competencia cerca para adaptar la intensidad de la sesión.',
    imagenes: ['img/servicios/postura.svg', 'img/servicios/columna.svg'],
  },
  {
    id: 'osteopatia-embarazo',
    nombre: 'Osteopatía en embarazo y posparto',
    categoria: 'Osteopatía',
    duracionMin: 50,
    precio: 36000,
    descripcion:
      'Acompañamiento para dolor lumbar, pelvis y suelo pélvico durante el embarazo y después del parto.',
    detalle:
      'Se trabaja en posiciones adaptadas y con técnicas seguras para cada trimestre. Indicá en observaciones tus semanas de gestación o la fecha de parto.',
    imagenes: ['img/servicios/columna.svg'],
  },

  /* --------------------------------------- Terapia Postural Activa (TPA) */
  {
    id: 'postural-evaluacion',
    nombre: 'Evaluación postural inicial',
    categoria: 'Terapia Postural Activa',
    duracionMin: 50,
    precio: 30000,

    descripcion:
      'Análisis de tu postura y de tus patrones de movimiento, con informe y plan de ejercicios personalizado.',
    detalle:
      'Se toman fotos posturales (con tu consentimiento) y se evalúan fuerza, movilidad y respiración. Te llevás el plan escrito para trabajar en casa.',
    imagenes: ['img/servicios/postura.svg', 'img/servicios/columna.svg'],
  },
  {
    id: 'postural-individual',
    nombre: 'Terapia Postural Activa · sesión individual',
    categoria: 'Terapia Postural Activa',
    duracionMin: 45,
    precio: 28000,
    descripcion:
      'Ejercicios guiados para reeducar la postura, fortalecer la musculatura profunda y prevenir recaídas.',
    detalle:
      'Sesión personalizada de ejercicio terapéutico. Vení con ropa deportiva; el material de trabajo lo pone el consultorio.',
    imagenes: ['img/servicios/postura.svg'],
  },
  {
    id: 'postural-duo',
    nombre: 'Terapia Postural Activa · sesión en dúo',
    categoria: 'Terapia Postural Activa',
    duracionMin: 60,
    precio: 22000,
    descripcion:
      'La misma sesión guiada, compartida con otra persona. El precio es por participante.',
    detalle:
      'Reservá dos lugares (uno por persona) o escribí en observaciones el nombre de quien te acompaña. Ideal para parejas, amigas o compañeros de entrenamiento.',
    imagenes: ['img/servicios/postura.svg'],
  },
  {
    id: 'postural-grupal',
    nombre: 'Clase grupal reducida (hasta 4 personas)',
    categoria: 'Terapia Postural Activa',
    duracionMin: 60,
    precio: 16000,
    descripcion:
      'Clase de higiene postural y fuerza suave en grupo chico, con seguimiento individual dentro de la clase.',
    detalle:
      'Cupo máximo de 4 personas por turno. Requiere haber hecho la evaluación postural inicial al menos una vez.',
    imagenes: ['img/servicios/postura.svg'],
  },
  {
    id: 'postural-respiracion',
    nombre: 'Reeducación respiratoria y diafragma',
    categoria: 'Terapia Postural Activa',
    duracionMin: 45,
    precio: 27500,
    descripcion:
      'Trabajo específico sobre la respiración: caja torácica, diafragma y control del estrés.',
    detalle:
      'Muy útil si tenés tensión cervical, sensación de falta de aire, ansiedad o hacés deportes de resistencia.',
    imagenes: ['img/servicios/manos.svg', 'img/servicios/postura.svg'],
  },
  {
    id: 'postural-oficina',
    nombre: 'Ergonomía para trabajo de escritorio',
    categoria: 'Terapia Postural Activa',
    duracionMin: 40,
    precio: 25000,
    descripcion:
      'Ajuste de tu puesto de trabajo y pausas activas para cervicales, muñecas y espalda baja.',
    detalle:
      'Traé fotos de tu escritorio y, si podés, las medidas de silla y monitor. Salís con un esquema de pausas activas para el día laboral.',
    imagenes: ['img/servicios/postura.svg'],
  },

  /* ----------------------------------------------------------- Nutrición */
  {
    id: 'nutricion-consulta',
    nombre: 'Consulta de Nutrición · primera vez',
    categoria: 'Nutrición',
    duracionMin: 40,
    precio: 30000,
    descripcion:
      'Plan de alimentación personalizado, orientado a tu salud digestiva y a tu bienestar general.',
    detalle:
      'Se revisan hábitos, antecedentes y objetivos. Si tenés análisis de sangre recientes, traelos para ajustar mejor el plan.',
    imagenes: ['img/servicios/nutricion.svg'],
  },
  {
    id: 'nutricion-seguimiento',
    nombre: 'Consulta de seguimiento nutricional',
    categoria: 'Nutrición',
    duracionMin: 25,
    precio: 20000,
    descripcion:
      'Revisión del plan en curso, ajustes según tu evolución y resolución de dudas.',
    detalle:
      'Recomendado cada 3 o 4 semanas. Traé el registro de comidas si venís llevándolo.',
    imagenes: ['img/servicios/nutricion.svg'],
  },
  {
    id: 'nutricion-digestiva',
    nombre: 'Plan para salud digestiva (SIBO · FODMAP)',
    categoria: 'Nutrición',
    duracionMin: 45,
    precio: 34000,
    descripcion:
      'Abordaje alimentario para hinchazón, colon irritable, SIBO o intolerancias ya diagnosticadas.',
    detalle:
      'Ideal después del Test de Aire Espirado. Incluye pautas por etapas (eliminación, reintroducción y mantenimiento) por escrito.',
    imagenes: ['img/servicios/nutricion.svg', 'img/servicios/manos.svg'],
  },
  {
    id: 'nutricion-deportiva',
    nombre: 'Nutrición deportiva',
    categoria: 'Nutrición',
    duracionMin: 40,
    precio: 32000,
    descripcion:
      'Estrategia de alimentación e hidratación según tu deporte, tus cargas y tus objetivos.',
    detalle:
      'Contame en observaciones tu disciplina, horarios de entrenamiento y si competís, para planificar la ingesta antes, durante y después.',
    imagenes: ['img/servicios/nutricion.svg', 'img/servicios/postura.svg'],
  },
  {
    id: 'nutricion-antropometria',
    nombre: 'Antropometría y composición corporal',
    categoria: 'Nutrición',
    duracionMin: 30,
    precio: 18000,
    descripcion:
      'Medición de pliegues, perímetros y composición corporal, con informe comparativo.',
    detalle:
      'Vení con ropa deportiva liviana, sin crema en la piel y bien hidratado. No hace falta ayuno.',
    imagenes: ['img/servicios/nutricion.svg'],
  },
  {
    id: 'nutricion-vegetariana',
    nombre: 'Alimentación vegetariana y vegana',
    categoria: 'Nutrición',
    duracionMin: 40,
    precio: 30000,
    descripcion:
      'Plan basado en plantas, cuidando proteínas, hierro, B12 y calcio sin perder practicidad.',
    detalle:
      'Sirve tanto si ya sos vegetariano como si querés hacer la transición. Incluye lista de compras y combinaciones de proteínas.',
    imagenes: ['img/servicios/nutricion.svg'],
  },

  /* --------------------------------------------------------- Masoterapia */
  {
    id: 'masaje-descontracturante',
    nombre: 'Masaje descontracturante',
    categoria: 'Masoterapia',
    duracionMin: 50,
    precio: 26000,
    descripcion:
      'Trabajo profundo sobre contracturas de cuello, hombros y espalda para aliviar la tensión acumulada.',
    detalle:
      'No requiere derivación ni estudios. Si buscás un abordaje clínico del dolor, conviene la sesión de Osteopatía.',
    imagenes: ['img/servicios/manos.svg'],
  },
  {
    id: 'masaje-relajante',
    nombre: 'Masaje relajante de cuerpo completo',
    categoria: 'Masoterapia',
    duracionMin: 60,
    precio: 24000,
    descripcion:
      'Maniobras suaves y envolventes de cuerpo completo, con foco en bajar el estrés y descansar mejor.',
    detalle:
      'Podés elegir la presión y la zona a evitar al comenzar la sesión. Se usa aceite neutro hipoalergénico.',
    imagenes: ['img/servicios/manos.svg'],
  },
  {
    id: 'masaje-drenaje',
    nombre: 'Drenaje linfático manual',
    categoria: 'Masoterapia',
    duracionMin: 60,
    precio: 30000,
    descripcion:
      'Técnica suave y rítmica para retención de líquidos, piernas hinchadas y recuperación posquirúrgica.',
    detalle:
      'En posoperatorios se necesita el alta del cirujano. Se recomienda una serie de sesiones seguidas para ver resultados.',
    imagenes: ['img/servicios/manos.svg', 'img/servicios/postura.svg'],
  },
  {
    id: 'masaje-deportivo',
    nombre: 'Masaje deportivo (pre y post competencia)',
    categoria: 'Masoterapia',
    duracionMin: 40,
    precio: 25000,
    descripcion:
      'Sesión de activación o de descarga según el momento de tu calendario deportivo.',
    detalle:
      'Indicá en observaciones si es antes o después de la competencia: la intensidad y las maniobras cambian por completo.',
    imagenes: ['img/servicios/postura.svg'],
  },
  {
    id: 'masaje-piernas',
    nombre: 'Masaje localizado de piernas y pies',
    categoria: 'Masoterapia',
    duracionMin: 30,
    precio: 17000,
    descripcion:
      'Sesión corta y focalizada para quienes pasan muchas horas de pie o caminando.',
    detalle:
      'Se trabaja de rodilla hacia abajo, incluyendo planta del pie. Buena opción para intercalar entre sesiones más largas.',
    imagenes: ['img/servicios/manos.svg'],
  },

  /* ------------------------------------------------ Test de Aire Espirado */
  {
    id: 'aire-espirado',
    nombre: 'Test de intolerancia a la lactosa',
    categoria: 'Test de Aire Espirado',
    duracionMin: 30,
    precio: 25000,
    descripcion:
      'Detección de intolerancia a la lactosa mediante muestras de aire espirado, sin extracción de sangre.',
    detalle:
      'Requiere preparación previa: ayuno de 8 hs y dieta especial el día anterior. Al reservar te enviamos las indicaciones completas.',
  },
  {
    id: 'aire-sibo',
    nombre: 'Test de SIBO (sobrecrecimiento bacteriano)',
    categoria: 'Test de Aire Espirado',
    duracionMin: 60,
    precio: 32000,
    descripcion:
      'Estudio de hidrógeno y metano en aire espirado para detectar sobrecrecimiento bacteriano del intestino delgado.',
    detalle:
      'Ayuno de 12 hs, dieta especial el día previo y suspensión de antibióticos y probióticos según indicación médica. Se toman varias muestras durante el estudio.',
  },
  {
    id: 'aire-fructosa',
    nombre: 'Test de intolerancia a la fructosa',
    categoria: 'Test de Aire Espirado',
    duracionMin: 45,
    precio: 27000,
    descripcion:
      'Evaluación de la absorción de fructosa, frecuente causa de hinchazón y dolor abdominal.',
    detalle:
      'Ayuno de 8 hs y dieta baja en fibra el día anterior. No se puede fumar ni hacer ejercicio intenso antes del estudio.',
  },
  {
    id: 'aire-sorbitol',
    nombre: 'Test de intolerancia al sorbitol',
    categoria: 'Test de Aire Espirado',
    duracionMin: 45,
    precio: 27000,
    descripcion:
      'Estudio del sorbitol, edulcorante presente en golosinas sin azúcar, chicles y algunas frutas.',
    detalle:
      'Mismas condiciones de preparación que el test de fructosa. Suele solicitarse junto con ese estudio.',
  },
  {
    id: 'aire-helicobacter',
    nombre: 'Test de Helicobacter pylori (urea espirada)',
    categoria: 'Test de Aire Espirado',
    duracionMin: 30,
    precio: 29000,
    descripcion:
      'Detección de Helicobacter pylori en aire espirado, útil para diagnóstico y control post tratamiento.',
    detalle:
      'Ayuno de 6 hs. Es necesario suspender inhibidores de la bomba de protones 14 días antes y antibióticos 4 semanas antes.',
  },
  {
    id: 'aire-interpretacion',
    nombre: 'Consulta de interpretación de resultados',
    categoria: 'Test de Aire Espirado',
    duracionMin: 25,
    precio: 15000,
    descripcion:
      'Lectura del informe del test junto a vos, con las primeras pautas de alimentación.',
    detalle:
      'Podés reservarla desde 48 hs después del estudio. Si querés el plan completo, conviene la consulta de salud digestiva.',
    imagenes: ['img/servicios/nutricion.svg'],
  },

  /* --------------------------------------------- Programas y Talleres */
  {
    id: 'programa-osteo-4',
    nombre: 'Programa de Osteopatía · 4 sesiones',
    categoria: 'Programas y Talleres',
    duracionMin: 50,
    precio: 126000,
    descripcion:
      'Cuatro sesiones de osteopatía con precio bonificado, para procesos de dolor persistente.',
    detalle:
      'Al reservar agendás la primera sesión; las tres restantes se coordinan en el consultorio según tu evolución. Vigencia de 3 meses.',
    imagenes: ['img/servicios/manos.svg', 'img/servicios/columna.svg'],
  },
  {
    id: 'programa-postural-8',
    nombre: 'Programa Postural · 8 sesiones',
    categoria: 'Programas y Talleres',
    duracionMin: 45,
    precio: 196000,
    descripcion:
      'Dos meses de terapia postural activa, con evaluación al inicio y al final del proceso.',
    detalle:
      'Incluye la evaluación postural inicial, 8 sesiones guiadas y el plan de ejercicios para casa. Se sugiere una frecuencia semanal.',
    imagenes: ['img/servicios/postura.svg'],
  },
  {
    id: 'programa-nutricion-3',
    nombre: 'Acompañamiento nutricional · 3 meses',
    categoria: 'Programas y Talleres',
    duracionMin: 40,
    precio: 84000,
    descripcion:
      'Primera consulta más cinco seguimientos, con mensajería para dudas entre encuentros.',
    detalle:
      'Pensado para cambios sostenidos de hábitos. Al reservar agendás la primera consulta; el resto se coordina en cada encuentro.',
    imagenes: ['img/servicios/nutricion.svg'],
  },
  {
    id: 'taller-higiene-postural',
    nombre: 'Taller de higiene postural (grupal)',
    categoria: 'Programas y Talleres',
    duracionMin: 75,
    precio: 12000,
    descripcion:
      'Encuentro teórico-práctico sobre cómo sentarte, levantar peso y organizar tu día sin dolor.',
    detalle:
      'Cupo de 8 personas. Vení con ropa cómoda; incluye material impreso para llevarte.',
    imagenes: ['img/servicios/postura.svg', 'img/servicios/columna.svg'],
  },
  {
    id: 'taller-alimentacion-consciente',
    nombre: 'Taller de alimentación consciente',
    categoria: 'Programas y Talleres',
    duracionMin: 60,
    precio: 10000,
    descripcion:
      'Herramientas prácticas para reconocer el hambre real, la saciedad y el comer emocional.',
    detalle:
      'Encuentro grupal de hasta 10 personas, con dinámicas y degustación. No es una consulta individual ni reemplaza el plan nutricional.',
    imagenes: ['img/servicios/nutricion.svg'],
  },
  {
    id: 'taller-corredores',
    nombre: 'Taller para corredores: prevención de lesiones',
    categoria: 'Programas y Talleres',
    duracionMin: 75,
    precio: 14000,
    descripcion:
      'Fuerza, movilidad y pautas de carga para llegar entero a tu próxima carrera.',
    detalle:
      'Traé tus zapatillas de entrenamiento. Se revisan gestos de carrera en grupo y se entrega una rutina de fuerza de 20 minutos.',
    imagenes: ['img/servicios/postura.svg'],
  },
];
