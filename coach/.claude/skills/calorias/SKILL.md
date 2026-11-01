---
name: calorias
description: Conteo de calorias y macros de un plato a partir de una foto (o de una descripcion) — identifica los alimentos, pregunta lo que la foto no muestra (porcion, aceite, salsas, si se lo comio todo), confirma y guarda la comida en el log, donde la ve la pestana Comida del dashboard. Usar cuando mande una foto de comida, diga "comi …", "cuantas calorias tiene esto" o /calorias.
---

Una foto no dice cuanto aceite lleva el plato, si el arroz es una taza o dos, ni si hay
queso debajo de la salsa. Esas son justo las cosas que mueven el numero. Por eso la regla
de este skill es: **no supongas nada en silencio.** Lo que no se ve se pregunta. Si al
final algo queda como supuesto, lo dices en voz alta y el lo confirma antes de guardar.

## 1. Mira la foto y nombra lo que ves

Lista cada componente que distingues, con lo que la imagen permite decir (tipo de alimento,
coccion aparente, tamano relativo al plato o a la mano/cubierto si aparecen). Si un
componente no lo puedes identificar ("¿eso es pure o arroz?"), no elijas: pregunta.

Si la foto es de un **producto envasado**, pide la etiqueta nutricional (foto de la tabla)
y los gramos que comio: los valores de la etiqueta mandan sobre la tabla de referencia.

## 2. Pregunta antes de calcular

Antes de dar un solo numero, haz las preguntas que cambian el conteo. Un solo mensaje,
numerado, maximo 4 preguntas, con opciones para responder rapido desde el telefono. Lo
que casi siempre hay que preguntar, por orden de impacto:

1. **Grasa de coccion y aderezos** — frito, a la plancha, al horno; ¿con cuanto aceite o
   mantequilla? (1 cda de aceite = ~120 kcal, es el error mas grande de cualquier conteo).
   Aderezo de la ensalada, mayonesa, salsas.
2. **Porcion** — si tiene pesa, los gramos (y si son en crudo o cocido). Si no, una
   referencia: taza, cucharon, "como mi palma", unidades. Un plato hondo y uno llano
   enganan en una foto.
3. **Ingredientes ocultos** — queso, crema, azucar en la bebida o el cafe, pan al lado,
   lo que haya debajo de una salsa o dentro de un wrap.
4. **¿Se lo comio todo?** y **¿hubo algo que no sale en la foto?** (bebida, postre, pan).
5. **¿Que comida es?** (desayuno, almuerzo, cena, snack, post) y la fecha si no es hoy —
   solo si no se deduce de la hora o de lo que dijo.

Ejemplo:
> Veo pechuga a la plancha, arroz blanco y ensalada de lechuga y tomate. Antes de contar:
> 1. ¿La pechuga con aceite? (nada / 1 cdta / 1 cda / no se)
> 2. ¿Cuanto arroz? (1/2 taza / 1 taza / 1½ / lo pese: __ g)
> 3. ¿La ensalada con aderezo? (nada / aceite: cuanto / otro)
> 4. ¿Te lo comiste entero y hubo bebida?

Si responde "no se" a algo importante, no inventes un valor: ofrece un rango y una
opcion por defecto explicita ("cuento 1 cdta de aceite, que es lo tipico a la plancha;
el rango es 450–560 kcal"), y baja la **confianza**. No vuelvas a preguntar lo mismo.

Si el plato ya lo conoces porque lo registro antes (`comida` de dias anteriores, o
el menu de `/app/pages/_lib/recomp/data.jsx`), puedes proponer la misma composicion,
pero igual confirmala: "¿igual que el martes: 150 g pollo, 1 taza arroz, 1 cdta aceite?".

## 3. Calcula y muestra la tabla

Usa `alimentos.md` (en esta carpeta) para los valores por 100 g. Para algo que no esta
ahi, usa valores estandar de tablas de composicion (USDA / tabla chilena) y dilo
("valor de referencia, no de la tabla del coach"). Gramos en cocido salvo que diga crudo.

Mensaje corto, una linea por componente, y el total:

```
Almuerzo — pollo, arroz y ensalada
· Pechuga plancha 150 g ........ 248 kcal · P 47 · C 0 · G 5
· Aceite 1 cdta (5 g) ........... 40 kcal · G 5
· Arroz blanco 1 taza (160 g) ... 208 kcal · P 4 · C 45 · G 0
· Ensalada sin aderezo .......... 25 kcal · P 1 · C 5
= 521 kcal · P 52 · C 50 · G 10   (confianza media: arroz sin pesar)
¿Confirmo?
```

Confianza: **alta** = pesado o etiqueta; **media** = porciones por referencia
confirmadas; **baja** = respondio "no se" a la grasa o a la porcion principal.

## 4. Guarda solo despues del "si"

```sh
comida guardar '{"meal":"almuerzo","description":"Pollo, arroz y ensalada",
  "confidence":"media","assumptions":"1 cdta aceite (confirmado); arroz 1 taza sin pesar; ensalada sin aderezo",
  "items":[{"name":"Pechuga de pollo a la plancha","grams":150,"kcal":248,"protein_g":46.5,"carbs_g":0,"fat_g":5.4},
           {"name":"Aceite de oliva","grams":5,"kcal":40,"fat_g":5},
           {"name":"Arroz blanco cocido","grams":160,"kcal":208,"protein_g":4.3,"carbs_g":45,"fat_g":0.5},
           {"name":"Lechuga y tomate","grams":150,"kcal":25,"protein_g":1.2,"carbs_g":5,"fat_g":0.3}]}'
```

- `assumptions`: lo que el confirmo y lo que quedo como supuesto explicito. Es lo que
  permite corregir despues sin rehacer todo.
- `eaten_on` solo si no es hoy. Los totales los suma la API desde `items`.
- `comida guardar` imprime la comida y el **total del dia contra la meta** (MACROS del
  dashboard). Responde en dos lineas: "✓ Almuerzo 521 kcal · P 52. Hoy: 1.180 / 2.400
  kcal, P 98 / 146 g." y, si viene al caso, cuanta proteina le falta para la meta.

## 5. Correcciones y consultas

- "Era media palta, no una": `comida` para ver los ids, luego
  `comida corregir <id> '{"items":[…todos los items, corregidos…]}'` (los items se
  reemplazan completos; la API recalcula los totales). Actualiza `assumptions` tambien.
- Registro equivocado: `comida borrar <id>`.
- "¿Como voy hoy?": `comida`. "¿Como comi esta semana?": `comida semana` — solo cuenta lo
  registrado; si hay dias con pocas comidas, dilo en vez de concluir que comio poco.

## Lo que no haces

- No guardes sin confirmacion, ni con un numero que no puedas explicar componente a
  componente.
- No des un total "a ojo" del plato entero: siempre desglosado.
- No cambies cargas ni el plan de entreno por lo que comio; no sermonees. Si un patron se
  repite (proteina corta varios dias), dilo una vez, con los numeros de `comida semana`.
- No guardes las fotos: lo que queda es la fila en `food_logs`.
