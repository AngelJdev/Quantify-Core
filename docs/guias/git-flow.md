# Flujo de ramas

Este repositorio usa `main` para las versiones publicadas y `develop` para integrar el trabajo de la siguiente versión. Todo el equipo puede obtener las ramas compartidas con `git fetch origin`.

| Rama | Se crea desde | Se integra en |
|---|---|---|
| `feature/<tema>` | `develop` | `develop` |
| `docs/<tema>` y `fix/<tema>` | `develop` | `develop` |
| `release/<version>` | `develop` | `main` y `develop` |
| `hotfix/<tema>` | `main` | `main` y `develop` |

## Trabajo diario

```bash
git fetch origin
git switch develop
git pull --ff-only origin develop
git switch -c feature/<tema>
# Editar y verificar los archivos del cambio.
git add <archivos>
git commit -m "feat: describir el cambio"
git push -u origin feature/<tema>
```

Abrir un pull request de la rama de trabajo hacia `develop`. Revisar y fusionar el cambio antes de iniciar el siguiente trabajo que dependa de él. Para documentación o correcciones normales se usa el mismo procedimiento con los prefijos `docs/` o `fix/`.

Por indicación del responsable del proyecto el **17/11/2026**, las ramas de trabajo se integran en `develop` mediante **`git merge --no-ff`**. `main` recibe la integración de una versión preparada desde `develop`, también conservando un commit de merge. Esta instrucción reemplaza la preferencia por fast-forward del 16/11/2026.

**El responsable del proyecto realiza todos los merges.** El agente puede crear la rama adecuada desde `develop`, editar, validar y preparar commits por actividad; no integra ramas, no actualiza `develop` ni `main` y no publica sin el alcance solicitado. Abrir y revisar el PR antes de integrar; respetar las protecciones y comprobaciones del repositorio.

```bash
# Integración a cargo del responsable, después de revisar y validar:
git switch develop
git merge --no-ff fix/<tema>
```

Si hay conflictos, el responsable concilia los cambios y valida antes de publicar. No reescribir ni forzar historial compartido para cambiar la apariencia del grafo ni cambiar identidad o configuración Git durante una edición documental. Las opciones `--ff-only` configuradas anteriormente no sustituyen la nueva instrucción explícita de `--no-ff`. Utilizar una rama por actividad coherente y commits por unidades revisables.

## Preparar una versión

Crear `release/<version>` desde `develop`. En esa rama solo se ajustan detalles de la versión y se comprueba la entrega. Abrir un pull request hacia `main`; después de fusionarlo, etiquetar el commit publicado con `v<version>` y fusionar la rama de release de regreso a `develop` para conservar cualquier ajuste realizado durante el cierre. Si hay conflictos, resolverlos y verificar el resultado antes de publicar.

Una publicación de avance puede actualizar `main` sin crear todavía un tag. El tag documental de esta revisión requiere la aprobación visual solicitada por el responsable; actualizar ramas no equivale a concederla.

## Corregir una versión publicada

Crear `hotfix/<tema>` desde `main`, realizar y verificar la corrección, y abrir un pull request hacia `main`. Una vez fusionado, etiquetar la nueva versión y llevar la misma corrección a `develop` mediante otro pull request o una fusión revisada. Así la siguiente versión no pierde el parche.

No se fusionan ramas de trabajo directamente a `main`. Las ramas `main` y `develop` permanecen compartidas; las ramas de trabajo se pueden eliminar después de integrarlas.
