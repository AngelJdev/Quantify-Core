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

Para la entrega de base técnica QUANCORE-43 se solicitó conservar los commits mediante **merge commit sin fast-forward**: en GitHub usar `Create a merge commit` (`merge_method=merge`), sin squash ni rebase. Al integrar localmente, el equivalente es `git merge --no-ff <rama>`. No empujar una fusión local a una rama compartida saltándose el PR; conservar las comprobaciones y reglas de protección aplicables.

## Preparar una versión

Crear `release/<version>` desde `develop`. En esa rama solo se ajustan detalles de la versión y se comprueba la entrega. Abrir un pull request hacia `main`; después de fusionarlo, etiquetar el commit publicado con `v<version>` y fusionar la rama de release de regreso a `develop` para conservar cualquier ajuste realizado durante el cierre. Si hay conflictos, resolverlos y verificar el resultado antes de publicar.

## Corregir una versión publicada

Crear `hotfix/<tema>` desde `main`, realizar y verificar la corrección, y abrir un pull request hacia `main`. Una vez fusionado, etiquetar la nueva versión y llevar la misma corrección a `develop` mediante otro pull request o una fusión revisada. Así la siguiente versión no pierde el parche.

No se fusionan ramas de trabajo directamente a `main`. Las ramas `main` y `develop` permanecen compartidas; las ramas de trabajo se pueden eliminar después de integrarlas.
