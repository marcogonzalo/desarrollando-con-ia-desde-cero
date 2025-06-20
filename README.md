# Desarrollando una idea con IA partiendo de cero

En este repo muestro cómo he ido construyendo una idea de principio a fin para una presentación sobre programación con IA partiendo de cero.

## Paso 0: Definir el producto

Le he pedido ideas para solucionar problemas actuales mediante software. Para ello, he empleado este _prompt_:
> Quiero desarrollar un emprendimiento. ¿Cuáles consideras que son las principales necesidades que actualmente puede haber en el mercado para desarrollar un MVP con software?

**Idea seleccionada**: "Una extensión de navegador que detecte sitios web sospechosos en tiempo real y ofrezca consejos prácticos para evitar estafas."

## Paso 1: Definir el producto

Le he pedido que desarrolle una pequeña _prompt_ con la descripción y las características principales del proyecto, para luego colocarlo en el primer documento del banco de memoria: `./memory-bank/sobre-el-producto.md`.

> Escribe un prompt pequeño con la descripción del proyecto y las características principales para este MVP: "Una extensión de navegador que detecte sitios web sospechosos en tiempo real y ofrezca consejos prácticos para evitar estafas."

## Paso 2: Establecer el plan de implementación

He creado un fichero llamado `./memory-bank/plan-de-implementacion.md` y le he pedido `Gemini 2.5 Pro Thinking` que me desarrolle un plan de implementación y lo incorpore al banco de memoria.

> Con base en @sobre-el-producto.md y teniendo en consideración las características allí descritas, quiero que desarrolles un plan de implementación y lo escribas en @plan-de-implementacion.md con pasos mínimos necesarios para empezar a incorporar funcionalidades y alcanzar el MVP.
>
> <contenido>
> El plan de implementación debe tener:
> <descripcion-del-proyecto>
> Un pequeño preámbulo con la descripción del proyecto y la audiencia objetivo, describiendo las tecnologías necesarias para construirlo, las principales características del MVP, buenas prácticas a aplicar e instrucciones para el despliegue
> </descripcion-del-proyecto>
> <fases-del-plan>
> El plan de implementación debe contener una guía paso a paso detallada, con pequeñas tareas realizables separadas por fases
> </fases-del-plan>
> <despliegue>
> El plan de implementación también debe considerar un despliegue ágil y rápido tanto del MVP como de las consiguientes actualizaciones mayores
> </despliegue>
> </contenido>

El plan estaba bien planteado, así que lo acepté, aunque le pedí que revisara nuevamente el documento inicial porque faltaban algunos aspectos. Luego, le pedí que empleáramos Vite y Typescript en lugar de Javascript, y ShadCN en lugar de CSS3 puro. Y, finalmente, opté por pedirle que cambiara la estrategia, de tener una blacklist propia a que consultara la API de Google Safe Browsing de Google.

Así finalicé con el refinamiento de la primera versión del Plan de implementación.
