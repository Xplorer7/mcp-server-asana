# Asana Custom-Field-Definitionen im MCP-Server

**Datum:** 2026-04-22
**Status:** Design — freigegeben, Implementierung steht aus

## Ziel

Der MCP-Server `mcp-server-asana` kann derzeit Custom-Field-**Werte** auf Tasks und
Projekten lesen/setzen, aber die **Definitionen** selbst (Feldname, Typ, Enum-Optionen,
Projekt-Zuordnungen) nicht verwalten. Dieses Dokument beschreibt die Erweiterung um
11 Tools, die die REST-Endpunkte rund um Custom Fields abdecken.

## Scope

Drei zusammenhängende Bereiche der Asana-API:

**A) Custom-Field-Definitionen** (Workspace-Ebene, CRUD)
**B) Enum-Optionen** (Dropdown-Werte von Enum-/Multi-Enum-Feldern)
**C) Custom-Field-Settings** (Zuordnung Feld ↔ Projekt)

Alle drei werden vollständig abgedeckt — ohne destruktive Operationen wären Teile
des Feature-Sets inkonsistent.

## Architektur

Vier Änderungspunkte, alle folgen dem bestehenden Code-Muster:

1. **Neues Tool-File** `src/tools/custom-field-tools.ts` — 8 Tools für A + B
2. **Erweiterung** `src/tools/project-tools.ts` — 3 Tools für C (gehören
   konzeptionell zum Projekt)
3. **Erweiterung** `src/asana-client-wrapper.ts` — neue SDK-Instanzen
   (`CustomFieldsApi`, `CustomFieldSettingsApi`) im Konstruktor sowie 11 neue
   Wrapper-Methoden
4. **Erweiterung** `src/tool-handler.ts` — Imports, `all_tools`-Eintragungen,
   `READ_ONLY_TOOLS`-Ergänzungen (nur GET-Tools), `switch/case`-Handler

Keine neuen Dependencies. Keine neuen Environment-Variablen. Kein neues
Test-Framework.

## Tools im Detail

### In `src/tools/custom-field-tools.ts` (neu)

| Tool-Name | SDK-Methode | Read-Only | Destructive |
|---|---|:-:|:-:|
| `asana_list_custom_fields_for_workspace` | `CustomFieldsApi.getCustomFieldsForWorkspace` | ✓ | |
| `asana_get_custom_field` | `CustomFieldsApi.getCustomField` | ✓ | |
| `asana_create_custom_field` | `CustomFieldsApi.createCustomField` | | |
| `asana_update_custom_field` | `CustomFieldsApi.updateCustomField` | | |
| `asana_delete_custom_field` | `CustomFieldsApi.deleteCustomField` | | **✓** |
| `asana_create_enum_option` | `CustomFieldsApi.createEnumOptionForCustomField` | | |
| `asana_update_enum_option` | `CustomFieldsApi.updateEnumOption` | | |
| `asana_insert_enum_option` | `CustomFieldsApi.insertEnumOptionForCustomField` | | |

### In `src/tools/project-tools.ts` (ergänzt)

| Tool-Name | SDK-Methode | Read-Only | Destructive |
|---|---|:-:|:-:|
| `asana_get_custom_field_settings_for_project` | `CustomFieldSettingsApi.getCustomFieldSettingsForProject` | ✓ | |
| `asana_add_custom_field_setting_for_project` | `ProjectsApi.addCustomFieldSettingForProject` | | |
| `asana_remove_custom_field_setting_for_project` | `ProjectsApi.removeCustomFieldSettingForProject` | | **✓** |

## Input-Schema-Details

### `asana_create_custom_field`
- `workspace` (string, required) — Workspace-GID
- `name` (string, required)
- `resource_subtype` (string, required) — einer von: `text`, `number`, `enum`,
  `multi_enum`, `date`, `people`
- `description` (string, optional)
- `precision` (integer, optional) — nur für `number`
- `format` (string, optional) — `currency`, `percentage`, `custom` usw.
- `enum_options` (array, optional) — für `enum`/`multi_enum`, Elemente:
  `{ name: string, color?: string, enabled?: boolean }`

**Nicht exponiert:** `is_global_to_workspace` wird nicht als Tool-Parameter
angeboten. Die Asana-API lehnt den Wert `false` mit 400 Bad Request ab und
ignoriert `true` (legt jedes Feld als workspace-global an). Für
projekt-spezifische Felder bleibt nur die Asana-Web-UI.

### `asana_update_custom_field`
- `custom_field_gid` (string, required)
- `name`, `description`, `enabled` (alle optional)
- **`resource_subtype` kann nicht geändert werden** (API-Einschränkung)
- **Enum-Optionen können über dieses Tool nicht bearbeitet werden** — dafür gibt
  es die separaten Tools

### `asana_delete_custom_field`
- `custom_field_gid` (string, required)
- `confirm` (boolean, required) — muss explizit `true` sein; ohne den Flag wirft
  der Handler einen Fehler mit Warnhinweis

### `asana_create_enum_option`
- `custom_field_gid` (string, required)
- `name` (string, required)
- `color` (string, optional) — Asana-Farben: `red`, `orange`, `yellow-orange`,
  `yellow`, `yellow-green`, `green`, `blue-green`, `aqua`, `blue`, `indigo`,
  `purple`, `magenta`, `hot-pink`, `pink`, `cool-gray`
- `enabled` (boolean, optional)
- `insert_before` / `insert_after` (string, optional) — GID einer bestehenden
  Enum-Option, um die neue Option davor/dahinter einzusortieren (die
  Parameternamen entsprechen 1:1 dem Asana-API-Request-Body)

### `asana_update_enum_option`
- `enum_option_gid` (string, required)
- `name`, `color`, `enabled` (alle optional)

### `asana_insert_enum_option`
- `custom_field_gid` (string, required)
- `enum_option` (string, required) — GID der zu verschiebenden Option
- `before_enum_option` **oder** `after_enum_option` (string, required) — GID
  der Referenz-Option (Parameternamen entsprechen 1:1 dem Asana-API-Body)

### `asana_add_custom_field_setting_for_project`
- `project_gid` (string, required)
- `custom_field` (string, required) — Feld-GID
- `is_important` (boolean, optional) — zeigt Feld in der Projekt-Leiste oben an

### `asana_remove_custom_field_setting_for_project`
- `project_gid` (string, required)
- `custom_field` (string, required)
- `confirm` (boolean, required) — siehe Delete-Muster

### Read-Only-Tools (GET)
- `asana_list_custom_fields_for_workspace`: `workspace` (required), `limit`,
  `offset`, `opt_fields`
- `asana_get_custom_field`: `custom_field_gid` (required), `opt_fields`
- `asana_get_custom_field_settings_for_project`: `project_gid` (required),
  `limit`, `offset`, `opt_fields`

## Schutzschichten für destruktive Operationen

Drei Schichten, eine davon automatisch:

1. **`READ_ONLY_MODE`** — wenn gesetzt, existieren `delete_custom_field` und
   `remove_custom_field_setting_for_project` gar nicht erst in `list_of_tools`
   (sie sind nicht in `READ_ONLY_TOOLS` eingetragen).
2. **`destructiveHint: true`** als MCP-Annotation auf dem Tool-Objekt —
   kompatible Clients (Claude Desktop, Claude Code) können darauf eine
   Bestätigungsdialog-Warnung aufbauen.
3. **`confirm: true`-Pflichtparameter** im Input-Schema — ohne diesen Flag wirft
   der Handler einen strukturierten Fehler mit einer Klartext-Beschreibung des
   Effekts. Das zwingt Claude zu einem bewussten zweiten Tool-Call.

## Data Flow

```
MCP-Client (Claude)
      │  CallToolRequest { name, arguments }
      ▼
tool-handler.ts
      │  1) READ_ONLY_MODE-Check
      │  2) switch/case → passender Handler
      │  3) Bei destruktiven Ops: confirm-Check
      ▼
AsanaClientWrapper (neue Methoden)
      │  Body-Assembly: { data: { …args } }
      ▼
asana-SDK v3.1.11 (CustomFieldsApi / CustomFieldSettingsApi / ProjectsApi)
      ▼
Asana REST API (app.asana.com/api/1.0)
```

**Beispiel-Wrapper** für `createCustomField`:

```js
async createCustomField(args) {
  const { opt_fields, ...data } = args;
  return this.customFields.createCustomField(
    { data },
    opt_fields ? { opt_fields } : undefined
  );
}
```

## Error Handling

Drei Fehlerklassen, eingefügt in das bestehende outer `try/catch` in
`tool-handler.ts`:

**Pre-API-Validierung:**
- Destruktive Tools ohne `confirm: true` →
  `"Destruktive Operation. {Beschreibung}. Zum Ausführen nochmals mit confirm=true aufrufen."`
- `create_custom_field` mit ungültigem `resource_subtype` →
  `"resource_subtype muss einer der folgenden sein: text, number, enum, multi_enum, date, people"`
- `insert_enum_option` ohne `before_enum_option` und ohne `after_enum_option` →
  entsprechende Fehlermeldung

**Asana-API-Fehler:** Unverändert durchgereicht. Typisch: `403` bei gesperrten
Feldern / Scope-Mangel, `404` bei ungültigen GIDs, `400` bei
Namenskollisionen oder ungültigen Enum-Farben.

**In Tool-Descriptions dokumentiert** (kein Code-Check):
- `resource_subtype` kann nach Erstellung nicht geändert werden
- Enum-Optionen werden nicht gelöscht, nur über `enabled: false` deaktiviert
  (siehe "Offene Punkte")
- Per API erzeugte Felder sind workspace-global (`is_global_to_workspace: true`)
  — `false` wird von der API abgelehnt
- Gesperrte Felder sind nur vom sperrenden User änderbar

Kein neues Retry-/Rate-Limit-Handling — nichts davon existiert in der
bestehenden Codebase.

## Read-Only-Liste

In `READ_ONLY_TOOLS` (Array in `tool-handler.ts`) neu einzutragen sind **nur**:

- `asana_list_custom_fields_for_workspace`
- `asana_get_custom_field`
- `asana_get_custom_field_settings_for_project`

Alle 8 Schreib- und Destruktiv-Tools bleiben außen vor und sind damit bei
`READ_ONLY_MODE=true` sowohl aus `list_of_tools` herausgefiltert als auch im
Handler per Blockier-Check abgewiesen.

## Test-Constraints

**Asana hat keine Staging-Umgebung** — alle Tests laufen gegen die produktive
API. Ein separater Test-Workspace ist nicht möglich. Als Schutz gelten für
Tests folgende Einschränkungen:

- **Test-Projekt:** `Claude/API Test-Projekt` (manuell angelegt). Alle
  `asana_add_custom_field_setting_for_project`- und
  `asana_remove_custom_field_setting_for_project`-Aufrufe nutzen ausschließlich
  dieses Projekt.
- **Globales Flag:** Die Asana-API lehnt `is_global_to_workspace: false` ab
  (400 Bad Request). Per API angelegte Test-Felder sind daher zwangsläufig
  workspace-global sichtbar, solange sie existieren. Das macht
  Cleanup-Disziplin zur zweiten Schutzschicht.
- **Keine Änderung bestehender Felder:** Test-Felder haben einen erkennbaren
  Namens-Präfix (z.B. `MCP-Test-`), damit sie von produktiven Feldern
  unterscheidbar sind.
- **Cleanup-Disziplin:** Jede Test-Sequenz endet mit `asana_delete_custom_field`
  (mit `confirm:true`), damit keine Test-Reste zurückbleiben.

## Testing

Die Codebase hat keine automatisierten Unit-Tests. Tests laufen manuell über
`scripts/test-mcp.sh` als JSON-RPC-Roundtrips gegen die echte Asana-API.

**Manuelle Test-Sequenz:**

```bash
source scripts/test-mcp.sh

export WORKSPACE_GID=...       # Workspace-GID einmalig ermitteln
export PROJ_GID=...            # GID des Projekts "Claude/API Test-Projekt"

# 1) Enum-Feld anlegen (wird workspace-global — s. Test-Constraints)
mcp_call asana_create_custom_field '{
  "workspace":"'$WORKSPACE_GID'",
  "name":"MCP-Test-Prio",
  "resource_subtype":"enum",
  "enum_options":[
    {"name":"Hoch","color":"red"},
    {"name":"Niedrig","color":"green"}
  ]
}'
# → FIELD_GID merken

# 2) Feld lesen
mcp_call asana_get_custom_field '{"custom_field_gid":"'$FIELD_GID'"}'
mcp_call asana_list_custom_fields_for_workspace '{"workspace":"'$WORKSPACE_GID'"}'

# 3) Feld aktualisieren
mcp_call asana_update_custom_field '{
  "custom_field_gid":"'$FIELD_GID'",
  "name":"MCP-Test-Priorität",
  "description":"Geändert via MCP"
}'

# 4) Enum-Option hinzufügen, ändern, umsortieren
mcp_call asana_create_enum_option '{
  "custom_field_gid":"'$FIELD_GID'","name":"Mittel","color":"yellow"
}'
# → OPT_GID merken, HOCH_GID aus 1) merken
mcp_call asana_update_enum_option '{"enum_option_gid":"'$OPT_GID'","name":"Mittelhoch"}'
mcp_call asana_insert_enum_option '{
  "custom_field_gid":"'$FIELD_GID'",
  "enum_option":"'$OPT_GID'",
  "before_enum_option":"'$HOCH_GID'"
}'

# 5) Settings-Zyklus gegen das Test-Projekt
mcp_call asana_add_custom_field_setting_for_project '{
  "project_gid":"'$PROJ_GID'",
  "custom_field":"'$FIELD_GID'",
  "is_important":true
}'
mcp_call asana_get_custom_field_settings_for_project '{"project_gid":"'$PROJ_GID'"}'

# 6) Destruktiv-Tests: Confirm-Gate
mcp_call asana_remove_custom_field_setting_for_project '{
  "project_gid":"'$PROJ_GID'","custom_field":"'$FIELD_GID'"
}'
# → erwarteter Fehler: "Destruktive Operation. ... confirm=true ..."
mcp_call asana_remove_custom_field_setting_for_project '{
  "project_gid":"'$PROJ_GID'","custom_field":"'$FIELD_GID'","confirm":true
}'
# → erfolgreich

# 7) Cleanup — Feld löschen
mcp_call asana_delete_custom_field '{"custom_field_gid":"'$FIELD_GID'"}'
# → Fehler ohne confirm
mcp_call asana_delete_custom_field '{"custom_field_gid":"'$FIELD_GID'","confirm":true}'
# → erfolgreich

# 8) Verifikation: Feld ist aus Workspace-Liste verschwunden
mcp_call asana_list_custom_fields_for_workspace '{"workspace":"'$WORKSPACE_GID'"}'
```

**Read-Only-Mode-Test:**
```bash
READ_ONLY_MODE=true node dist/index.js
# über list_tools: nur die 3 neuen GET-Tools sind sichtbar
```

## Offene Punkte / Follow-ups

- **Löschen von Enum-Optionen:** Context7-Doku erwähnt einen
  `DELETE /enum_options/{gid}`-Endpunkt, das installierte `asana`-SDK v3.1.11
  bietet dafür aber keine Methode. Manuelle Prüfung per rohem `fetch`
  ausstehend. Falls der Endpunkt existiert, kann ein `asana_delete_enum_option`
  Tool als SDK-Bypass ergänzt werden.
- **Impact-Preview vor Delete:** Aktuell keine Vorab-Info darüber, wie viele
  Tasks/Projekte betroffen sind. Asana-API bietet dafür keinen günstigen
  Endpunkt. Wenn später gewünscht, müsste das über `search_tasks`-Fan-out
  simuliert werden — teuer und deshalb hier nicht enthalten.
- **Formel-Felder:** Können per API **nicht** angelegt oder geändert werden —
  das ist eine Limitierung der Asana-API selbst (nicht des SDK). Formel-Felder
  werden ausschließlich in der Asana-Web-UI erstellt (Business-/Enterprise-Feature).
  Bestehende Formel-Felder sind per API **lesbar**: `asana_get_custom_field`
  und `asana_list_custom_fields_for_workspace` liefern bei entsprechendem
  `opt_fields` das Flag `is_formula_field: true` und den berechneten Wert über
  `display_value`. Kein separates Tool nötig.
- **`reference`-Feldtyp:** Die aktuelle Online-Doku nennt `reference` als
  weiteren möglichen `resource_subtype`, das SDK v3.1.11 listet ihn in seinen
  JSDoc-Kommentaren jedoch nicht. Ob das SDK ihn dennoch durchreicht, ist nicht
  verifiziert. **Nicht Teil der Implementation.** Falls später Bedarf besteht,
  über manuellen API-Test klären und ggf. zur Liste der erlaubten
  `resource_subtype`-Werte hinzufügen.

## README-Update

Im `README.md` werden die 11 neuen Tools in der nummerierten Tool-Liste ergänzt
(siehe Checkliste in `CLAUDE.md`, Punkt 4).

## Akzeptanzkriterien

- [ ] 11 Tools sind in `list_of_tools` registriert und via `list_tools` sichtbar
- [ ] Alle drei READ-Tools erscheinen in `list_of_tools` bei
  `READ_ONLY_MODE=true`, die 8 Write-Tools nicht
- [ ] Test-Sequenz (Abschnitte 1–8 oben) läuft erfolgreich durch und hinterlässt
  keine Spuren im Workspace
- [ ] Destruktive Tools verweigern ohne `confirm: true` die Ausführung mit
  aussagekräftiger Fehlermeldung
- [ ] `npm run build` läuft ohne TypeScript-Fehler
- [ ] `README.md` listet die 11 neuen Tools
