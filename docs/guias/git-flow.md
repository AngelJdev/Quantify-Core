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

Por indicación del responsable del proyecto el 16/11/2026, las actualizaciones de `develop` y `main` se realizan por **fast-forward**, conservando los commits originales. Esta regla reemplaza la preferencia anterior por `--no-ff`.

Abrir y revisar el PR antes de actualizar la rama compartida. GitHub no ofrece fast-forward mediante el botón `Create a merge commit`: para esta modalidad, comprobar localmente la ascendencia, ejecutar `git merge --ff-only <rama>` en el destino y publicar con un push normal, sin force. Respetar las protecciones y comprobaciones del repositorio; si exigen otro mecanismo, detener la publicación y resolver esa incompatibilidad sin saltarlas.

```bash
git config --local branch.develop.mergeOptions --ff-only
git config --local branch.main.mergeOptions --ff-only
```

Si las ramas divergieron, un fast-forward directo es imposible. Conciliar sus cambios en una rama de integración revisable usando un merge normal (`--ff`, sin forzar `--no-ff`), resolver conflictos y validar. El resultado debe contener ambas historias como ancestros; solo entonces avanzar el destino con `--ff-only`. No reescribir ni forzar historial compartido para cambiar la apariencia del grafo. Utilizar una rama por actividad coherente y commits por unidades revisables.

## Preparar una versión

Crear `release/<version>` desde `develop`. En esa rama solo se ajustan detalles de la versión y se comprueba la entrega. Abrir un pull request hacia `main`; después de fusionarlo, etiquetar el commit publicado con `v<version>` y fusionar la rama de release de regreso a `develop` para conservar cualquier ajuste realizado durante el cierre. Si hay conflictos, resolverlos y verificar el resultado antes de publicar.

Una publicación de avance puede actualizar `main` sin crear todavía un tag. El tag documental de esta revisión requiere la aprobación visual solicitada por el responsable; actualizar ramas no equivale a concederla.

## Corregir una versión publicada

Crear `hotfix/<tema>` desde `main`, realizar y verificar la corrección, y abrir un pull request hacia `main`. Una vez fusionado, etiquetar la nueva versión y llevar la misma corrección a `develop` mediante otro pull request o una fusión revisada. Así la siguiente versión no pierde el parche.

No se fusionan ramas de trabajo directamente a `main`. Las ramas `main` y `develop` permanecen compartidas; las ramas de trabajo se pueden eliminar después de integrarlas.
