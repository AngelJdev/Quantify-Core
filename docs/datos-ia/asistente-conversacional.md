# Asistente conversacional de Quantify

**Alcance aclarado por el responsable del proyecto el 16/11/2026. Estado: definición funcional; asistente pendiente de implementar.** Esta definición prevalece sobre las propuestas anteriores de IA predictiva en la visión y los materiales académicos.

La IA vive dentro de Quantify como asistente conversacional. Atiende solicitudes sencillas sobre hábitos y uso de la aplicación: «Ayúdame a crear un hábito nuevo», «Recomiéndame una rutina de lectura» o «Ayúdame a ajustar esta meta». Puede pedir información faltante, proponer opciones y ayudar a preparar un hábito. Las recomendaciones pueden partir de la solicitud del usuario; no necesitan un historial biométrico ni una población de entrenamiento.

## Recorrido esperado

1. El usuario escribe una solicitud dentro de Quantify.
2. El asistente pregunta lo necesario, como nombre, frecuencia, meta y unidad, o presenta una recomendación comprensible.
3. La propuesta aparece como borrador revisable; el usuario puede editarla, aceptarla o descartarla.
4. Solo una confirmación explícita guarda el hábito mediante la API de negocio, con sus validaciones, permisos e idempotencia. Una respuesta del asistente no cuenta como hábito creado.

Las métricas, rachas y check-ins continúan calculándose con las reglas deterministas de la API. El asistente no los inventa ni cambia por conversación. Las solicitudes ajenas a Quantify reciben una orientación breve para volver al alcance de la aplicación. Si el asistente no está disponible, el formulario manual de hábitos debe seguir disponible.

## Alcance de esta entrega

Incluye conversación sobre hábitos, ayuda para preparar borradores y recomendaciones simples. No requiere entrenar un modelo propio, estimar desgaste, asignar arquetipos de productividad ni generar predicciones biométricas. Esas ideas anteriores quedan fuera de esta entrega; cualquier ampliación requiere una decisión de alcance explícita.

Solo se comparte el contexto necesario y autorizado del usuario. El administrador no obtiene acceso a conversaciones ni hábitos privados por su rol. No se presupone que se almacenará el historial de chat: retención, eliminación, proveedor/modelo, datos enviados y consentimiento se deben definir antes de implementar.

## Decisiones y comprobación pendientes

La base NestJS y FastAPI se conserva; el reparto de responsabilidades del asistente, su proveedor y el contrato de conversación requieren revisión en D-07. No hay endpoint conversacional definido todavía. Los clientes acceden mediante la API de negocio, con identidad Keycloak/OIDC; no se añaden credenciales del proveedor a los clientes.

La aceptación deberá comprobar que una solicitud produce una propuesta pertinente; que los datos faltantes se preguntan; que cancelar no guarda; que confirmar dos veces no duplica; que los permisos y el contexto privado se respetan; y que los fallos permiten continuar manualmente. No se usarán porcentajes de confianza ficticios como prueba de calidad.

RF-07 y HU-07 conservan sus identificadores. Sus referencias anteriores a modelos predictivos se interpretan con esta delimitación hasta completar la revisión de requisitos, contratos y pruebas. El diseño conversacional de U11 está pendiente: la tarjeta estática actual es una referencia de recomendaciones, no una conversación implementada.
