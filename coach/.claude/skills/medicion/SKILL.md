---
name: medicion
description: Parser de Samsung Health — leer una captura de la app (peso, grasa, musculo, BMI, BMR, agua) y guardarla en la base de datos recomp, donde la lee la telemetria del dashboard. Usar cuando mande una imagen de Samsung Health, diga "me pese" o /medicion.
---

Samsung Health muestra la composicion corporal en una o varias pantallas. Tu trabajo es
leer los numeros de la imagen, confirmarlos y escribirlos como **una fila por fecha de
medicion**. El dashboard (pestana TELEMETRIA) no tiene ningun numero escrito a mano: lo
que guardes aqui es lo que se ve alli.

1. **Lee la imagen.** Campos que suele traer, con el nombre que usa `medir`:

   | En la app (es / en) | Campo | Nota |
   |---|---|---|
   | Peso / Weight | `peso=` | kg |
   | Grasa corporal / Body fat | `grasa=` | el **porcentaje**; si ademas da los kg, `grasakg=` |
   | Musculo esqueletico / Skeletal muscle | `musculo=` | kg |
   | IMC / BMI | `bmi=` | |
   | TMB / BMR | `bmr=` | kcal, entero |
   | Agua corporal / Body water | `agua=` | kg |
   | Proteina / Protein | `proteina=` | kg |
   | Minerales / Minerals | `mineral=` | kg |
   | Grasa visceral / Visceral fat | `visceral=` | nivel |

   Ojo con: la coma decimal (77,8 = 77.8), las unidades en lb (conviertelas y dilo), y la
   **fecha de la medicion**, que puede no ser hoy — si la captura la muestra, usa esa.

2. **Confirma antes de escribir**, en una linea por medicion:
   `21/09: peso 77.8 · grasa 21.6% · musculo 33.0 · BMI 24.6 · BMR 1687 · agua 44.7. ¿Confirmo?`
   Si un numero se lee mal o esta cortado, **preguntalo, no lo inventes**: todos los
   campos son opcionales y una fila parcial es perfectamente valida.

3. **Guarda**:
   `medir 2026-09-21 peso=77.8 grasa=21.6 musculo=33.0 bmi=24.6 bmr=1687 agua=44.7`
   Es un upsert por fecha: si vuelve a mandar la misma captura, o corrige un numero, se
   reescribe la fila en vez de duplicarla. `medir` imprime cada campo con su variacion
   contra la medicion anterior.

4. **Interpreta, corto.** Dos o tres lineas, sin adornos:
   - Recomposicion = musculo arriba y grasa abajo en el mismo periodo. Dilo solo si los
     dos numeros lo dicen.
   - Una sola medicion no es una tendencia. El peso oscila 1–2 kg por agua, sal y
     glucogeno; la bioimpedancia de la bascula varia con la hidratacion y la hora. Si la
     medicion no se tomo en las mismas condiciones (en ayunas, sin entrenar antes), dilo
     y no cambies nada del plan por ella.
   - Compara con los objetivos de 12 semanas que muestra el dashboard (grasa corporal,
     musculo esqueletico) y di si va en linea.
   - **No cambies cargas ni el plan por una medicion.** Eso lo decide `hoy` con el log.

5. **Actualiza `data/PROFILE.md`** con la medicion nueva (fecha + los numeros clave), que
   es lo que lees cuando no tienes la base de datos a mano.

Para consultar: `medir` (ultimas 12, con el cambio total del periodo) o
`medir --ultimas 30`. Para borrar una fila mal cargada: `medir --borrar <id>`.
