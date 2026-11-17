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

Todas las ramas de actividad (`feature/`, `feat/`, `fix/` y `docs/`) se integran hacia **`develop` mediante merge commit sin fast-forward**. En GitHub usar `Create a merge commit` (`merge_method=merge`), sin squash ni rebase. El primer padre del merge debe ser el estado anterior de `develop`; el segundo, la rama de actividad. La entrega QUANCORE-43 sigue la misma regla. No integrar una actividad fusionando `develop` dentro de su rama como sustituto del PR hacia `develop`.

Al integrar localmente, el equivalente es situarse en `develop` y ejecutar `git merge --no-ff <rama>`. No empujar una fusión local a una rama compartida saltándose el PR; conservar las comprobaciones y reglas de protección aplicables. Para prevenir fast-forward en merges locales de integración, configurar este clon:

```bash
git config --local branch.develop.mergeOptions --no-ff
```

Las curvas laterales del grafo son normales con `--no-ff`: conservan la rama y sus commits. Para revisar la secuencia de integraciones de `develop` en una sola línea, usar `git log --first-parent --oneline develop`. No reescribir ni forzar el historial compartido para cambiar su apariencia. Usar una rama por actividad coherente y commits por unidades revisables; evitar ramas o merges por cada ajuste menor.

## Preparar una versión

Crear `release/<version>` desde `develop`. En esa rama solo se ajustan detalles de la versión y se comprueba la entrega. Abrir un pull request hacia `main`; después de fusionarlo, etiquetar el commit publicado con `v<version>` y fusionar la rama de release de regreso a `develop` para conservar cualquier ajuste realizado durante el cierre. Si hay conflictos, resolverlos y verificar el resultado antes de publicar.

## Corregir una versión publicada

Crear `hotfix/<tema>` desde `main`, realizar y verificar la corrección, y abrir un pull request hacia `main`. Una vez fusionado, etiquetar la nueva versión y llevar la misma corrección a `develop` mediante otro pull request o una fusión revisada. Así la siguiente versión no pierde el parche.

No se fusionan ramas de trabajo directamente a `main`. Las ramas `main` y `develop` permanecen compartidas; las ramas de trabajo se pueden eliminar después de integrarlas.
