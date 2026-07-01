# MODUS RATIO

## Introducción

Modus Ratio será una aplicación web donde inicialmente se sube una foto de tu outfit (desde pies a cabeza), pero es posible solo de pantalon y camisa (aunque lo ideal sería analizar todo el outfit), para luego de analizarla, y según algunos parametros muy conocidos de reglas de vestimenta estilo (60/30/10), colores, largos y anchos dependiendo de altura, peso, color de piel y otros más (pendiente de especificar...), generará un ratio o puntaje general del equilibrio del outfit, si tiene consistencia, harmonia, o definitivamente no es buena elección. Este ratio sería algo orientado a un videojuego como si fueran barras de estadisticas pero con palabras simples de entender en cuanto a "Equilibrio de color", Harmonia, proporciones según altura y contextura..etc..


## Objetivo

Modus Ratio será una ayuda para todas las personas, mujeres, hombres, nobinario, etc, para mejorar sus habitos de vestimenta, entender un poco sobre las reglas de vestimenta, colores, dimensiones, etc y poder armar sus outfits de acuerdo a estas dependiendo de la selección de estilo (urbano, alternativo, casual, semiformal, formal, formal-urbano, formal-alternativo, oldmoney).

## Planteamiento Grafico

Una interfaz simple, estilo mesa de arquitectura (blueprint) o plano a cuadros, con estetica Cyberpunk en efectos. Para más detalles analizar el proyecto: C:\DevCode\Repositories\01_AzanoLabs\azanolabs-web que contiene la interfaz que se debe continuar, ya que aunque la aplicación no se hará con el proyecto del directorio, si se debe  usar exactamente la misma linea grafica ya que se hará como si se tratara del mismo proyecto pero apuntará a un subdominio diferente. Se debe analizar con exhaustivo detalle la linea grafica para continuarla en esta app. La pagina principal (home) de esta app, se hará como si fuera una interna de dicho proyecto.

- El home: Deberá tener la misma estructura de las internas, y luego del titulo Modus Ratio y subtitulo (Puntea mi Outfit), deberá haber un pequeño formulario estilo "navegador" donde habrá un input para subir la imagen (con drag&drop), selector de estilo (detallados en Objetivo), y algunos campos opcionales como rango de altura (selector de altura desplazable optimizado para desktop y mobile) entre 1,30 cm a 2,10cm,  color de piel, contextura por partes como superior o inferior (delgada, gruesa, atletica).

- Análisis de datos: En la fase del analisis, se debe controlar con un loader estilizado, moderno, con efectos de rayos de colores, como sobrecargando energia que aparecen al rededor y dentro del loader, y mientras empieza el loader empieza un movimiento suave, pero mientras más se acerca al final de la carga este loader tiembla más, como si tuviera mucho poder.

. Resultados: Los datos deben mostrarse remplazando el input de imagen y el loader, mostrando la imagen subida como una tarjeta con un chulito verde que muestre que cumple los estandares, un simbolo de advertencia amarillo que indique que hay cosas por mejorar, y un simbolo de prohibido rojo si está muy debajo de los estandares o recomendaciones.

- Re análisis: luego de los resultados debe haber un botón para volver a subir otra imagen y poner otros parametros (los parametros se guardan en localstorage para que en dado caso de subir varias imagenes no sea necesario especificar siempre los parametros, se actualizan cada vez que se cambian)

- Advertencias: Los mensajes de advertencia, notas o de atención deben ser como badges largos adecuados al contenido, con colores dependiendo del tipo de advertencia. Inicialmente en el home se pondrá una advertencia donde se especifique que las imagenes subidas para el analisis con IA no se guardan ni se comparten con terceros, tampoco los datos suministrados, estos serán enviados directamente al modelo de IA con instrucciones especificas para tener el analisis de la imagen sin ningún otro tipo de finalidad. Otra advertencia será en los resultados, donde indique que el estilo depende de cada persona y no tiene porque seguir estandares o ser igual a todos, pero hay reglas que pueden ayudar y esa es la finalidad del Ratio de Outfit.

- Transiciones: Las transiciones entre componentes (input de imagen, resultados, otra vez input), errores, etc, se debe manejar de manera congruente, no simple con solo opacidad aburrida, si no similar a las transiciones de vhs (efecto de distorción y lineas granuladas) como las transiciones del proyecto AzanoLabs Web. No pueden haber componentes que aparecen en pantalla sin transición adecuada.

- Apple/Iphone: context-iphone-bugs.md tiene una guia de que se debe revisar para que en visualización de apple/iphone los estilos creados se vean correctos.

## Planteamiento (Stack) tecnoligico

La app será desarrollada con Astro.js ultima versión (superior a 7, consultar en internet y docs), y relacionadas a su desarrollo React, Typescript, Tailwind, Zustand para manejo de estados más simples y efectivos y OpenAi librerías para poder utilizar el apikey de openAI (modelo GPT 4o Mini para analizar imagenes) y apikey de opencode usando el modelo de minimax M3 para el analisis de datos efectivo obtenido por el demolo de GPT.

Procesamiento de imagenes: La imagen se subirá a un Bucket de Cloudflare para poder generar una URL publica de la imagen, que luego se mandará a openAI para que el modelo en sus servidores descarguen la imagen y así no pase por vercel, que será nuestro host serverless para Astro.js. La imagen no debe pasar bajo ninguna situación por vercel para evitar consumir ancho de banda sin motivo, ya que las librerías de aws que creo que también se usan para R2 de cloudflare permiten hacer esto de manera DIRECTA desde el Cliente (navegadores) sin pasar por Vercel.

Procesamiento de datos de imagen: La imagen luego de ser subida  al bucket de Cloudflare y generar url publica, deberá enviarse dicha url a openAI bajo el modelo GPT 4o Mini con un contexto minimo donde se especifique que datos rescatar (tipo de ropa que identifica, colores, proporciones de colores, proporciones de la persona, calidad de la imagen (para poder dar advertencias al usuario que tal vez no se puedan dar buenos resultados porque  la imagen es mala), entre otras que sean relevantes) y especificarle al modelo que retorne un .md optimizado para agentes de IA, en lo posible en ingles que consume menos tokens.

Procesamiento de ranking: Basado en un contexto amplio sobre tipos de outfit, estilos, proporciones, etc, se deberá enviar al modelo Minimax M3 los resultados de GPT 4o Mini y las elecciones del usuario junto al contexto amplio. Estos datos deberán retornar un JSON basados en cierto modelo o ejemplo que también se deberá enviar all modelo minimask para que así la lógica interna de Astro.js pueda identificarlo como un JSON valido y poder pintar los resultados en la Ui de manera adecuada.

Luego de mostrar los resultados se deberá ejecutar un proceso que elimine las imagenes subidas al bucket (no todas, si no especificamente la de la url generada).

## Arquitectura de proyecto

Se deberá trabajar una arquitectura limpia y modular basada en el modelo atomico (atomos, moleculas, organismos,etc), se deberá utilizar las más recientes tecnologías de tailwind 4.3 donde no se usan medidas exactas en pixels tipo (5 pixels) si no cosas como text-1.5. Se debe utilizar la directiva @theme para declarar los estilso principales y que no cambian del sitio, BAJO NINGUNA CIRCUNSTANCIA SE DEBEN declarar estilos Inline en el TSX como style={}, las clases de utilidad deben aplicarse con las respectivas directivas tailwind en los archivos de estilos de cada componente etc.

Los componentes si se componen de TSX y .CSS deberán estar dentro de una carpeta con el nombre del componente que luego se debe importar/exportar siguiendo las practicas de Import/Export Barriels para mejorar la legibilidad del proyecto y no hacer un styles.css general gigante.

Tailwind se debe configurar para que pueda aplicarse correctamente en cada archivo de componente correctamente.

Si se crean variables de colores, fuentes, pixeles (rem, etc) exactos, se debe declarar un archivo de estilos de constantes.

Se debe declarar los siguientes tamaños de viewports o breakpoints para mejorar el responsive del sitio en web y mobile sin tener que detectar dispositivos: (sm:270x600, md: 360x740, lg:440x956, xl: 600 de ancho en adelante). Estos deben sobreescribir las dimensiones por defecto de los breakpoints de tailwind, no especificar en archivo tailwind.config ya que en la nueva versión 4.3 esto se sobre escribe en otro archivo, creo que en el @theme, pero no estoy seguro, averigualo. Tampoco se tiene que crear archivos postcss ya que en esta versión de Astro (7+) no es necesario.

Para las rutas de la api se deben declarar endpoints con nombres claros y concisos, se debe crear una seguridad basada en ratelimit similar a mi página AzanoRivers.com (C:\DevCode\Repositories\00_AzanoRivers), donde se envían las ips a redis (revisar archivos de .env para ver los datos de redis ya que debemos usar los mismos a ver si funciona sin tener que hacer algo adicional, solo usar la lógica de rate limit que ya tenemos ene ste proyecto).

Se deberá crear y declarar todas las variables de entorno en .env y leerlas con la forma más adecuada, si no ando mal en Astro 7 se puede usar con Vite (consultar en internet documentación de Astro 7 para usar lo más actualizado y moderno).

Los paquetes e inicialización del proyecto se deberán usar con pnpm install, nunca, jamas hacer el package.json y hardcodear versiones, JAMAS, todas las dependencias e instalación de Astro, etc, etc, debe hacerse por comandos de pnpm como si se hicera manual para que así se genere de manera automaticamente el package.json NUNCA HACERLO HARDCODEADO.

## Arquitectura Agentica - AI

Se debe crear la arquitectura Harness con 3 modelos especiales para cada tarea (Orquestador, Implementador, Revisor). Cada Tarea de un plan de trabajo se debe analizar, entender como hacerla, orquestar con skills y tecnologías especificas, Implementar la solución, revisión de errores y revisión de auditoria

Localmente ya hay skills instaladas de (skills.sh) de vercel con respecto a UiUx, diseño de interfaces, mejores practicas de React. Se deben Instalar las que sean necesarias para este proyecto, en lo posible de fuentes recomendadas como Skills.sh de vercel

Se usará Claude bajo modelo Sonnete 4.6, pero tal vez se cambie a OpenCode, por lo tanto se debe pensar en crear una arquitectura de agentes especifico para cada caso con sus carpetas separadas, no dentro del proyecto ni revueltas con el código, algo limpio. Entiendo que OpenCode es compatible con las configuraciones de Claude.md y sus skills así que analizar bien donde poner cada carpeta, skills, agent.md skills.md etc...

## Referencias

1. Proyecto con .env para OpenAI y Redis (C:\DevCode\Repositories\00_AzanoRivers)
2. Proyecto con linea Grafica, UiUx y diseño de la interfaz (identica): C:\DevCode\Repositories\01_AzanoLabs\azanolabs-web
3. context-iphone-bugs.md tiene una guia de que se debe revisar para que en visualización de apple/iphone los estilos creados se vean correctos