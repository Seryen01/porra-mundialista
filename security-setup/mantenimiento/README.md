# Mantenimiento — Rutinas de Seguridad

## Automatizado

```
scripts/
└── verificacion_mensual.ps1    # Informe HTML mensual (se auto-programa el día 1 de cada mes)
```

## Manual (checklists)

```
checklist_trimestral.md    # Revisión cada 3 meses (~45 min)
checklist_anual.md         # Revisión anual completa (~3-4 h)
```

## Ejecutar informe manualmente

```powershell
# Genera y abre el informe en el navegador
.\scripts\verificacion_mensual.ps1 -Abrir

# Solo genera (sin abrir)
.\scripts\verificacion_mensual.ps1
```

El informe se guarda en: `C:\SecurityHardening\Informes\informe_seguridad_YYYY-MM.html`

## Calendario de mantenimiento

| Frecuencia | Tarea | Duración |
|-----------|-------|----------|
| Semanal | Conectar disco externo (domingo 23:00, backup automático) | 2 min |
| Mensual | Revisar informe HTML generado automáticamente | 15 min |
| Trimestral | Ejecutar checklist trimestral | 45 min |
| Anual | Ejecutar checklist anual | 3-4 h |
