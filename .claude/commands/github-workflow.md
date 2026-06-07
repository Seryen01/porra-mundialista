# GitHub Workflow — Porra Mundialista

Eres el asistente de flujo de trabajo Git/GitHub para este proyecto. Cuando el usuario invoca `/github-workflow`, guía la acción solicitada siguiendo las reglas de branching definidas abajo.

## Estructura de ramas

```
master          ← producción / releases (NUNCA desarrollar aquí)
  └── develop   ← integración (base de todo el desarrollo)
        ├── feature/nombre-corto   ← nuevas funcionalidades
        ├── fix/nombre-corto       ← corrección de bugs
        └── chore/nombre-corto    ← tareas técnicas (deps, config, refactor)
hotfix/nombre   ← urgencias desde master (va directo a master + se mergea a develop)
```

## Comandos disponibles

Llama a esta skill con uno de estos argumentos:

| Argumento | Descripción |
|---|---|
| `feature <nombre>` | Crea una rama `feature/<nombre>` desde develop |
| `fix <nombre>`     | Crea una rama `fix/<nombre>` desde develop |
| `chore <nombre>`   | Crea una rama `chore/<nombre>` desde develop |
| `hotfix <nombre>`  | Crea una rama `hotfix/<nombre>` desde master |
| `pr`               | Crea un Pull Request de la rama actual → develop |
| `release`          | Crea un PR de develop → master |
| `status`           | Muestra el estado actual del flujo (rama, diff vs develop, etc.) |
| `sync`             | Actualiza la rama actual con develop (rebase) |

## Instrucciones de ejecución

### Si el argumento es `feature <nombre>`, `fix <nombre>` o `chore <nombre>`

Ejecuta en orden:
```bash
git checkout develop
git pull origin develop
git checkout -b <tipo>/<nombre>
git push -u origin <tipo>/<nombre>
```
Informa al usuario de la rama creada y que debe trabajar en ella.

### Si el argumento es `hotfix <nombre>`

```bash
git checkout master
git pull origin master
git checkout -b hotfix/<nombre>
git push -u origin hotfix/<nombre>
```

### Si el argumento es `pr`

1. Ejecuta `git status` y `git log develop..HEAD --oneline` para ver el estado.
2. Si hay cambios sin commitear, avisa y para.
3. Ejecuta `git push origin HEAD` para asegurarte de que está al día.
4. Crea el PR con `gh pr create` apuntando a `develop` (o a `master` si la rama es `hotfix/*`).
5. El título del PR debe seguir Conventional Commits: `feat:`, `fix:`, `chore:`, `docs:`, `test:`, `refactor:`.
6. El cuerpo debe incluir: qué hace, por qué, y checklist de testing.

### Si el argumento es `release`

1. Verifica que estás en `develop` y no hay cambios pendientes.
2. Crea un PR de `develop` → `master` con `gh pr create --base master`.
3. El título debe ser `release: vX.Y.Z` donde el número de versión se infiere del contexto.

### Si el argumento es `status`

Ejecuta y muestra el output de:
```bash
git branch --show-current
git log develop..HEAD --oneline
git status --short
```

### Si el argumento es `sync`

```bash
git fetch origin develop
git rebase origin/develop
```
Si hay conflictos, guía al usuario para resolverlos.

## Reglas generales

- **Nunca** hacer push directo a `master` ni a `develop`. Siempre por PR.
- Los commits deben seguir **Conventional Commits**: `feat:`, `fix:`, `docs:`, `test:`, `refactor:`, `chore:`.
- Cada PR debe apuntar a `develop`, excepto `hotfix/*` que apunta a `master`.
- Borrar la rama remota después de mergear el PR.
- Los mensajes de commit en español o inglés son válidos, pero consistentes dentro de un PR.

## Ejemplo de sesión típica

```
/github-workflow feature nueva-tabla-clasificacion
# → crea feature/nueva-tabla-clasificacion desde develop

# ... desarrollas, haces commits ...

/github-workflow pr
# → empuja y crea PR hacia develop
```
