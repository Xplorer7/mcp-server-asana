# MCP Server für Asana

[![npm version](https://badge.fury.io/js/%40roychri%2Fmcp-server-asana.svg)](https://www.npmjs.com/package/@roychri/mcp-server-asana)

Diese Model-Context-Protocol-Server-Implementierung für Asana ermöglicht es, von einem MCP-Client (z. B. Anthropics Claude Desktop) aus mit der Asana-API zu sprechen.

Weitere Details zu MCP:
 - https://www.anthropic.com/news/model-context-protocol
 - https://modelcontextprotocol.io/introduction
 - https://github.com/modelcontextprotocol

<a href="https://glama.ai/mcp/servers/ln1qzdhwmc"><img width="380" height="200" src="https://glama.ai/mcp/servers/ln1qzdhwmc/badge" alt="mcp-server-asana MCP server" /></a>

## Umgebungsvariablen

- `ASANA_ACCESS_TOKEN`: (Pflicht) Dein Asana Access Token
- `READ_ONLY_MODE`: (Optional) Auf `'true'` setzen, um alle schreibenden Operationen zu deaktivieren. In diesem Modus:
  - Tools, die Asana-Daten verändern (create, update, delete), sind deaktiviert
  - Der `create-task`-Prompt ist deaktiviert
  - Nur lesende Operationen stehen zur Verfügung
  Nützlich zum Testen oder wenn sichergestellt werden soll, dass keine Änderungen am Asana-Workspace vorgenommen werden können.

## Nutzung

Im KI-Tool deiner Wahl (z. B. Claude Desktop) eine Frage zu Asana-Tasks, -Projekten, -Workspaces oder -Kommentaren stellen. Die Erwähnung des Wortes „asana“ erhöht die Wahrscheinlichkeit, dass das LLM das passende Tool wählt.

Beispiel:

> Wie viele offene Asana-Tasks haben wir im Projekt Sprint 30?

Ein weiteres Beispiel:

![Claude Desktop Beispiel](https://raw.githubusercontent.com/roychri/mcp-server-asana/main/mcp-server-asana-claude-example.png)

## Tools

1. `asana_list_workspaces`
    * Listet alle verfügbaren Workspaces in Asana
    * Optionale Parameter:
        * opt_fields (string): Kommagetrennte Liste optionaler Felder, die mit zurückgegeben werden sollen
    * Liefert: Liste der Workspaces
2. `asana_search_projects`
    * Sucht Projekte in Asana über Namens-Mustervergleich
    * Pflichtparameter:
        * workspace (string): Der Workspace, in dem gesucht wird
        * name_pattern (string): Regulärer Ausdruck zum Matchen von Projektnamen
    * Optionale Parameter:
        * archived (boolean): Nur archivierte Projekte zurückgeben (Standard: false)
        * opt_fields (string): Kommagetrennte Liste optionaler Felder
    * Liefert: Liste passender Projekte
3. `asana_search_tasks`
    * Sucht Tasks in einem Workspace mit erweiterten Filteroptionen
    * Pflichtparameter:
        * workspace (string): Der Workspace, in dem gesucht wird
    * Optionale Parameter:
        * text (string): Text, nach dem in Task-Namen und -Beschreibungen gesucht wird
        * resource_subtype (string): Filter nach Task-Subtyp (z. B. milestone)
        * completed (boolean): Filter für erledigte Tasks
        * is_subtask (boolean): Filter für Subtasks
        * has_attachment (boolean): Filter für Tasks mit Anhängen
        * is_blocked (boolean): Filter für Tasks mit offenen Abhängigkeiten
        * is_blocking (boolean): Filter für offene Tasks mit abhängigen Tasks
        * assignee, projects, sections, tags, teams und viele weitere erweiterte Filter
        * sort_by (string): Sortierung nach due_date, created_at, completed_at, likes, modified_at (Standard: modified_at)
        * sort_ascending (boolean): Aufsteigend sortieren (Standard: false)
        * opt_fields (string): Kommagetrennte Liste optionaler Felder
        * custom_fields (object): Objekt mit Custom-Field-Filtern
    * Liefert: Liste passender Tasks
4. `asana_get_task`
    * Liefert Detailinformationen zu einem bestimmten Task
    * Pflichtparameter:
        * task_id (string): Die ID des Tasks, der abgerufen wird
    * Optionale Parameter:
        * opt_fields (string): Kommagetrennte Liste optionaler Felder
    * Liefert: Detaillierte Task-Informationen
5. `asana_create_task`
    * Erstellt einen neuen Task in einem Projekt
    * Pflichtparameter:
        * project_id (string): Das Projekt, in dem der Task angelegt wird
        * name (string): Name des Tasks
    * Optionale Parameter:
        * notes (string): Beschreibung des Tasks
        * html_notes (string): HTML-ähnlich formatierte Beschreibung
        * due_on (string): Fälligkeitsdatum im Format YYYY-MM-DD
        * assignee (string): Verantwortlicher (kann 'me' oder eine User-ID sein)
        * followers (array of strings): User-IDs, die als Follower hinzugefügt werden
        * parent (string): ID des übergeordneten Tasks
        * projects (array of strings): IDs der Projekte, denen der Task zugeordnet wird
        * resource_subtype (string): Typ des Tasks (default_task oder milestone)
        * custom_fields (object): Mapping von Custom-Field-GIDs auf Werte
    * Liefert: Informationen zum erstellten Task
6. `asana_get_task_stories`
    * Liefert Kommentare und Stories zu einem bestimmten Task
    * Pflichtparameter:
        * task_id (string): Die Task-ID
    * Optionale Parameter:
        * opt_fields (string): Kommagetrennte Liste optionaler Felder
    * Liefert: Liste der Task-Stories/Kommentare
7. `asana_update_task`
    * Aktualisiert die Details eines vorhandenen Tasks
    * Pflichtparameter:
        * task_id (string): Die zu aktualisierende Task-ID
    * Optionale Parameter:
        * name (string): Neuer Name des Tasks
        * notes (string): Neue Beschreibung des Tasks
        * html_notes (string): HTML-ähnlich formatierte Beschreibung (eingeschränkter HTML-Umfang)
        * due_on (string): Neues Fälligkeitsdatum (YYYY-MM-DD)
        * assignee (string): Neuer Verantwortlicher ('me' oder User-ID)
        * followers (array): User-IDs, die als Follower hinzugefügt werden
        * parent (string): Neue übergeordnete Task-ID
        * completed (boolean): Task als erledigt markieren
        * resource_subtype (string): Task-Typ (default_task oder milestone)
        * custom_fields (object): Mapping von Custom-Field-GIDs auf Werte
    * Liefert: Aktualisierte Task-Informationen
8. `asana_get_project`
    * Liefert Detailinformationen zu einem bestimmten Projekt
    * Pflichtparameter:
        * project_id (string): Die ID des Projekts
    * Optionale Parameter:
        * opt_fields (string): Kommagetrennte Liste optionaler Felder
    * Liefert: Detaillierte Projektinformationen
9. `asana_get_project_task_counts`
    * Liefert die Anzahl der Tasks in einem Projekt
    * Pflichtparameter:
        * project_id (string): Projekt-ID
    * Optionale Parameter:
        * opt_fields (string): Kommagetrennte Liste optionaler Felder
    * Liefert: Task-Anzahl-Informationen
10. `asana_get_project_sections`
    * Liefert Sections eines Projekts
    * Pflichtparameter:
        * project_id (string): Projekt-ID
    * Optionale Parameter:
        * opt_fields (string): Kommagetrennte Liste optionaler Felder
    * Liefert: Liste der Projekt-Sections
11. `asana_create_task_story`
    * Erstellt einen Kommentar oder eine Story zu einem Task
    * Pflichtparameter:
        * task_id (string): Die Task-ID
        * text (string): Textinhalt des Kommentars
    * Optionale Parameter:
        * opt_fields (string): Kommagetrennte Liste optionaler Felder
    * Liefert: Informationen zur erstellten Story
12. `asana_add_task_dependencies`
    * Setzt Abhängigkeiten für einen Task
    * Pflichtparameter:
        * task_id (string): Task-ID, für die Abhängigkeiten gesetzt werden
        * dependencies (array of strings): Task-IDs, von denen dieser Task abhängt
    * Liefert: Aktualisierte Task-Abhängigkeiten
13. `asana_add_task_dependents`
    * Setzt abhängige Tasks (Tasks, die von diesem Task abhängen)
    * Pflichtparameter:
        * task_id (string): Task-ID
        * dependents (array of strings): Task-IDs der abhängigen Tasks
    * Liefert: Aktualisierte abhängige Tasks
14. `asana_create_subtask`
    * Erstellt einen Subtask zu einem vorhandenen Task
    * Pflichtparameter:
        * parent_task_id (string): Übergeordnete Task-ID
        * name (string): Name des Subtasks
    * Optionale Parameter:
        * notes (string): Beschreibung des Subtasks
        * due_on (string): Fälligkeitsdatum (YYYY-MM-DD)
        * assignee (string): Verantwortlicher ('me' oder User-ID)
        * opt_fields (string): Kommagetrennte Liste optionaler Felder
    * Liefert: Informationen zum erstellten Subtask
15. `asana_get_multiple_tasks_by_gid`
    * Liefert Detailinformationen zu mehreren Tasks anhand ihrer GIDs (maximal 25)
    * Pflichtparameter:
        * task_ids (array of strings oder kommagetrennter string): Task-GIDs (max. 25)
    * Optionale Parameter:
        * opt_fields (string): Kommagetrennte Liste optionaler Felder
    * Liefert: Liste detaillierter Task-Informationen
16. `asana_get_project_status`
    * Liefert ein Projekt-Status-Update
    * Pflichtparameter:
        * project_status_gid (string): Die GID des Projekt-Status
    * Optionale Parameter:
        * opt_fields (string): Kommagetrennte Liste optionaler Felder
    * Liefert: Projekt-Status-Informationen
17. `asana_get_project_statuses`
    * Liefert alle Status-Updates eines Projekts
    * Pflichtparameter:
        * project_gid (string): Projekt-GID
    * Optionale Parameter:
        * limit (number): Ergebnisse pro Seite (1-100)
        * offset (string): Pagination-Offset-Token
        * opt_fields (string): Kommagetrennte Liste optionaler Felder
    * Liefert: Liste der Projekt-Status-Updates
18. `asana_create_project_status`
    * Erstellt ein neues Status-Update für ein Projekt
    * Pflichtparameter:
        * project_gid (string): Projekt-GID
        * text (string): Textinhalt des Status-Updates
    * Optionale Parameter:
        * color (string): Farbe des Status (green, yellow, red)
        * title (string): Titel des Status-Updates
        * html_text (string): HTML-formatierter Text
        * opt_fields (string): Kommagetrennte Liste optionaler Felder
    * Liefert: Informationen zum erstellten Status
19. `asana_delete_project_status`
    * Löscht ein Projekt-Status-Update
    * Pflichtparameter:
        * project_status_gid (string): GID des zu löschenden Status
    * Liefert: Bestätigung der Löschung
20. `asana_set_parent_for_task`
    * Setzt den übergeordneten Task eines Tasks und positioniert den Subtask zwischen anderen Subtasks
    * Pflichtparameter:
        * task_id (string): Task-ID
        * data (object):
            * parent (string): Neuer übergeordneter Task oder null für keinen Parent
    * Optionale Parameter:
        * insert_after (string): Subtask, hinter den der Task eingefügt wird, oder null für Beginn
        * insert_before (string): Subtask, vor den der Task eingefügt wird, oder null für Ende
        * opt_fields (string): Kommagetrennte Liste optionaler Felder
    * Liefert: Aktualisierte Task-Informationen
21. `asana_get_tag`
    * Liefert Detailinformationen zu einem bestimmten Tag
    * Pflichtparameter:
        * tag_gid (string): Eindeutiger Bezeichner des Tags
    * Optionale Parameter:
        * opt_fields (string): Kommagetrennte Liste optionaler Felder
    * Liefert: Detaillierte Tag-Informationen
22. `asana_get_tags_for_task`
    * Liefert die Tags eines Tasks
    * Pflichtparameter:
        * task_gid (string): Task-GID
    * Optionale Parameter:
        * limit (number): Ergebnisse pro Seite (1-100)
        * offset (string): Offset-Token für die nächste Seite
        * opt_fields (string): Kommagetrennte Liste optionaler Felder
    * Liefert: Liste der Tags, die dem Task zugeordnet sind
23. `asana_get_tasks_for_tag`
    * Liefert Tasks zu einem bestimmten Tag
    * Pflichtparameter:
        * tag_gid (string): Tag-GID
    * Optionale Parameter:
        * opt_fields (string): Kommagetrennte Liste optionaler Felder
        * opt_pretty (boolean): Antwort in aufbereitetem Format
        * limit (integer): Ergebnisse pro Seite (1-100)
        * offset (string): Offset-Token für die nächste Seite
    * Liefert: Liste der Tasks zum Tag
24. `asana_get_tags_for_workspace`
    * Liefert Tags in einem Workspace
    * Pflichtparameter:
        * workspace_gid (string): GID des Workspaces oder der Organisation
    * Optionale Parameter:
        * limit (integer): Ergebnisse pro Seite (1-100)
        * offset (string): Offset-Token für die nächste Seite
        * opt_fields (string): Kommagetrennte Liste optionaler Felder
    * Liefert: Liste der Tags im Workspace
25. `asana_update_tag`
    * Aktualisiert einen vorhandenen Tag
    * Pflichtparameter:
        * tag_gid (string): Tag-GID
    * Optionale Parameter:
        * name (string): Name des Tags
        * color (string): Farbe. Einer von: dark-pink, dark-green, dark-blue, dark-red, dark-teal, dark-brown, dark-orange, dark-purple, dark-warm-gray, light-pink, light-green, light-blue, light-red, light-teal, light-brown, light-orange, light-purple, light-warm-gray
        * notes (string): Notizen zum Tag
        * opt_fields (string): Kommagetrennte Liste optionaler Felder
    * Liefert: Aktualisierte Tag-Informationen
26. `asana_delete_tag`
    * Löscht einen Tag
    * Pflichtparameter:
        * tag_gid (string): Tag-GID
    * Liefert: Bestätigung der Löschung
27. `asana_create_tag_for_workspace`
    * Erstellt einen neuen Tag in einem Workspace
    * Pflichtparameter:
        * workspace_gid (string): Workspace- oder Organisations-GID
        * name (string): Name des Tags
    * Optionale Parameter:
        * color (string): Farbe. Einer von: dark-pink, dark-green, dark-blue, dark-red, dark-teal, dark-brown, dark-orange, dark-purple, dark-warm-gray, light-pink, light-green, light-blue, light-red, light-teal, light-brown, light-orange, light-purple, light-warm-gray
        * notes (string): Notizen zum Tag
        * opt_fields (string): Kommagetrennte Liste optionaler Felder
    * Liefert: Informationen zum erstellten Tag
28. `asana_add_tag_to_task`
    * Fügt einen Tag zu einem Task hinzu
    * Pflichtparameter:
        * task_gid (string): Task-GID
        * tag_gid (string): Tag-GID
    * Liefert: Erfolgsmeldung
29. `asana_remove_tag_from_task`
    * Entfernt einen Tag von einem Task
    * Pflichtparameter:
        * task_gid (string): Task-GID
        * tag_gid (string): Tag-GID
    * Liefert: Erfolgsmeldung
30. `asana_add_project_to_task`
    * Fügt einen vorhandenen Task zu einem Projekt hinzu
    * Pflichtparameter:
        * task_id (string): Task-ID
        * project_id (string): Projekt-ID
    * Optionale Parameter:
        * section (string): Section-ID innerhalb des Projekts
        * insert_after (string): Task-ID, hinter die dieser Task eingefügt wird. Maximal einer von insert_before, insert_after oder section darf gesetzt sein.
        * insert_before (string): Task-ID, vor die dieser Task eingefügt wird. Maximal einer von insert_before, insert_after oder section darf gesetzt sein.
    * Liefert: Bestätigung, dass der Task zum Projekt hinzugefügt wurde
    * Hinweise: Ohne Positionierungsparameter wird der Task am Ende des Projekts eingefügt
31. `asana_remove_project_from_task`
    * Entfernt einen Task aus einem Projekt
    * Pflichtparameter:
        * task_id (string): Task-ID
        * project_id (string): Projekt-ID
    * Liefert: Bestätigung, dass der Task aus dem Projekt entfernt wurde
    * Hinweise: Der Task existiert weiterhin im System, ist aber nicht mehr Teil des Projekts
32. `asana_delete_task`
    * Löscht einen Task endgültig
    * Pflichtparameter:
        * task_id (string): Task-ID
    * Liefert: Bestätigung, dass der Task gelöscht wurde
    * Hinweise: Nicht rückgängig machbar. Der Task wird dauerhaft entfernt.
33. `asana_create_project`
    * Erstellt ein neues Projekt in einem Workspace oder Team
    * Pflichtparameter:
        * workspace (string): Workspace-GID, in dem das Projekt angelegt wird
        * name (string): Name des Projekts
    * Optionale Parameter:
        * team (string): Team-GID (Pflicht bei Organisations-Workspaces)
        * notes (string): Beschreibung oder Notizen zum Projekt
        * color (string): Projekt-Farbe (z. B. dark-pink, dark-green, light-blue)
        * privacy_setting (string): Sichtbarkeit (public_to_workspace, private_to_team, private)
        * default_view (string): Standardansicht (list, board, calendar, timeline)
        * opt_fields (string): Kommagetrennte Liste optionaler Felder
    * Liefert: Das erstellte Projekt-Objekt
34. `asana_update_project`
    * Aktualisiert die Details eines Projekts (Name, Beschreibung etc.)
    * Pflichtparameter:
        * project_id (string): Projekt-GID
    * Optionale Parameter:
        * name (string): Neuer Projektname
        * notes (string): Neue Klartext-Beschreibung
        * html_notes (string): Neue HTML-formatierte Beschreibung (muss gültiges Asana-XML sein)
        * color (string): Projekt-Farbe (z. B. dark-pink, dark-green, light-blue)
        * privacy_setting (string): Sichtbarkeit (public_to_workspace, private_to_team, private)
        * opt_fields (string): Kommagetrennte Liste optionaler Felder
    * Liefert: Aktualisierte Projektinformationen
35. `asana_create_section`
    * Erstellt eine neue Section in einem Projekt
    * Pflichtparameter:
        * project_id (string): Projekt-GID
        * name (string): Name der neuen Section
    * Optionale Parameter:
        * opt_fields (string): Kommagetrennte Liste optionaler Felder
    * Liefert: Informationen zur erstellten Section
36. `asana_update_section`
    * Aktualisiert eine Section (z. B. umbenennen)
    * Pflichtparameter:
        * section_id (string): Section-GID
        * name (string): Neuer Name
    * Optionale Parameter:
        * opt_fields (string): Kommagetrennte Liste optionaler Felder
    * Liefert: Aktualisierte Section-Informationen
37. `asana_delete_section`
    * Löscht eine Section aus einem Projekt
    * Pflichtparameter:
        * section_id (string): Section-GID
    * Liefert: Bestätigung der Löschung
38. `asana_add_task_to_section`
    * Verschiebt einen Task in eine Section innerhalb seines Projekts
    * Pflichtparameter:
        * section_id (string): Ziel-Section-GID
        * task_id (string): Task-GID
    * Optionale Parameter:
        * insert_before (string): Task-GID, vor die eingefügt wird
        * insert_after (string): Task-GID, hinter die eingefügt wird
    * Liefert: Erfolgsbestätigung
39. `asana_get_subtasks`
    * Liefert alle Subtasks eines Tasks in kompakter Darstellung
    * Pflichtparameter:
        * task_gid (string): GID des übergeordneten Tasks
    * Optionale Parameter:
        * opt_fields (string): Kommagetrennte Liste optionaler Felder (z. B. 'name,completed,assignee,due_on')
    * Liefert: Array von Subtask-Objekten
40. `asana_get_tasks_for_project`
    * Liefert alle Tasks eines Projekts. Diese Variante funktioniert auch in kostenlosen Asana-Plänen (search_tasks benötigt Premium). Unterstützt Pagination und optionale Feldauswahl.
    * Pflichtparameter:
        * project_id (string): Projekt-GID
    * Optionale Parameter:
        * opt_fields (string): Kommagetrennte Liste optionaler Felder
        * limit (number): Ergebnisse pro Seite (1-100)
        * offset (string): Pagination-Offset-Token aus einer vorherigen Antwort
    * Liefert: Array von Task-Objekten
41. `asana_get_my_tasks`
    * Liefert Tasks aus der „My Tasks“-Liste des angemeldeten Users in einem Workspace
    * Pflichtparameter:
        * workspace (string): Workspace-GID
    * Optionale Parameter:
        * opt_fields (string): Kommagetrennte Liste optionaler Felder
        * completed_since (string): Nur Tasks, die seit diesem Zeitpunkt erledigt wurden (ISO 8601). 'now' liefert ausschließlich offene Tasks.
    * Liefert: Liste der Tasks aus der My-Tasks-Liste des Users
42. `asana_list_custom_fields_for_workspace`
    * Listet alle Custom-Field-Definitionen eines Workspaces (Kompakt-Darstellung).
    * Pflichtparameter:
        * workspace (string): Workspace-GID
    * Optionale Parameter:
        * limit (number): Ergebnisse pro Seite (1–100)
        * offset (string): Pagination-Offset-Token
        * opt_fields (string): Kommagetrennte Liste optionaler Felder (z. B. `name,resource_subtype,enabled,is_global_to_workspace,is_formula_field,enum_options`)
    * Liefert: Array mit Custom-Field-Objekten
43. `asana_get_custom_field`
    * Lädt die vollständige Definition eines Custom Fields (inklusive Typ, Enum-Options, `is_formula_field`, Precision, Format).
    * Pflichtparameter:
        * custom_field_gid (string): GID des Custom Fields
    * Optionale Parameter:
        * opt_fields (string): Zusätzliche Felder, etwa `enum_options,enum_options.name,enum_options.color,enum_options.enabled,is_formula_field,representation_type,precision,format`
    * Liefert: Custom-Field-Objekt
44. `asana_create_custom_field`
    * Legt ein neues Custom Field in einem Workspace an. Per API erzeugte Felder sind workspace-global — die Asana-API lehnt `is_global_to_workspace: false` ab, projekt-spezifische Felder müssen über die Asana-Web-Oberfläche angelegt werden. Hinweis: `resource_subtype` kann nachträglich nicht geändert werden. Formel-Felder sind nur über die Asana-Web-Oberfläche erstellbar, nicht per API.
    * Pflichtparameter:
        * workspace (string): Workspace-GID
        * name (string): Feldname (muss im Workspace eindeutig sein)
        * resource_subtype (string): Einer von `text`, `number`, `enum`, `multi_enum`, `date`, `people`
    * Optionale Parameter:
        * description (string): Feldbeschreibung
        * precision (integer): Dezimalstellen 0–6 (nur für `number`)
        * format (string): Zahlenformat, nur für `number`: `currency`, `percentage`, `duration`, `custom`, `none`
        * enum_options (array): Anfangs-Optionen für Enum-Felder, Elemente `{ name, color?, enabled? }`
        * opt_fields (string): Kommagetrennte Liste optionaler Felder
    * Liefert: Angelegtes Custom-Field-Objekt
45. `asana_update_custom_field`
    * Aktualisiert Name, Beschreibung oder Enabled-Status eines Custom Fields. `resource_subtype` ist nicht änderbar. Enum-Optionen müssen separat über `asana_create_enum_option` / `asana_update_enum_option` gepflegt werden.
    * Pflichtparameter:
        * custom_field_gid (string): GID des Custom Fields
    * Optionale Parameter:
        * name (string): Neuer Feldname
        * description (string): Neue Feldbeschreibung
        * enabled (boolean): Feld aktivieren oder deaktivieren
        * opt_fields (string): Kommagetrennte Liste optionaler Felder
    * Liefert: Aktualisiertes Custom-Field-Objekt
46. `asana_delete_custom_field`
    * **Destruktiv.** Löscht die Custom-Field-Definition aus dem Workspace. Das Feld wird aus allen Projekten und Tasks, die es verwenden, entfernt. Erfordert `confirm: true`.
    * Pflichtparameter:
        * custom_field_gid (string): GID des Custom Fields
        * confirm (boolean): Muss `true` sein
    * Liefert: Leeres Data-Objekt bei Erfolg
47. `asana_create_enum_option`
    * Fügt einem Enum- oder Multi-Enum-Feld eine neue Option hinzu. Standardmäßig am Ende der Optionsliste. Pro Feld sind maximal 500 Optionen erlaubt (inkl. deaktivierter).
    * Pflichtparameter:
        * custom_field_gid (string): GID eines Enum-/Multi-Enum-Felds
        * name (string): Anzeigename der Option
    * Optionale Parameter:
        * color (string): Einer von `red`, `orange`, `yellow-orange`, `yellow`, `yellow-green`, `green`, `blue-green`, `aqua`, `blue`, `indigo`, `purple`, `magenta`, `hot-pink`, `pink`, `cool-gray`
        * enabled (boolean): Option aktivieren (Default `true`)
        * insert_before (string): GID einer bestehenden Option, davor einsortieren
        * insert_after (string): GID einer bestehenden Option, dahinter einsortieren
        * opt_fields (string): Kommagetrennte Liste optionaler Felder
    * Liefert: Angelegtes Enum-Option-Objekt
48. `asana_update_enum_option`
    * Aktualisiert Name, Farbe oder Enabled-Status einer Enum-Option. Enum-Optionen können per API nicht gelöscht werden — zum Entfernen `enabled: false` setzen. Ein Enum-Feld benötigt mindestens eine aktivierte Option.
    * Pflichtparameter:
        * enum_option_gid (string): GID der Enum-Option
    * Optionale Parameter:
        * name (string): Neuer Anzeigename
        * color (string): Neue Farbe (siehe `asana_create_enum_option`)
        * enabled (boolean): Option aktivieren oder deaktivieren
        * opt_fields (string): Kommagetrennte Liste optionaler Felder
    * Liefert: Aktualisiertes Enum-Option-Objekt
49. `asana_insert_enum_option`
    * Ordnet eine bestehende Enum-Option neu — bewegt sie vor oder hinter eine andere Option.
    * Pflichtparameter:
        * custom_field_gid (string): GID des Custom Fields
        * enum_option (string): GID der zu verschiebenden Option
        * before_enum_option oder after_enum_option (string): GID der Referenz-Option
    * Optionale Parameter:
        * opt_fields (string): Kommagetrennte Liste optionaler Felder
    * Liefert: Aktualisiertes Enum-Option-Objekt
50. `asana_get_custom_field_settings_for_project`
    * Listet alle Custom Fields auf, die einem Projekt zugeordnet sind, inklusive `is_important`-Flag.
    * Pflichtparameter:
        * project_gid (string): Projekt-GID
    * Optionale Parameter:
        * opt_fields (string): Kommagetrennte Liste optionaler Felder (z. B. `custom_field,custom_field.name,custom_field.resource_subtype,custom_field.enum_options,is_important`)
    * Liefert: Array von Custom-Field-Setting-Objekten
51. `asana_add_custom_field_setting_for_project`
    * Ordnet ein bestehendes Custom Field einem Projekt zu. Optional als „wichtig" markieren (wird dann in der Projekt-Headerleiste angezeigt).
    * Pflichtparameter:
        * project_gid (string): Projekt-GID
        * custom_field (string): GID des zuzuordnenden Custom Fields
    * Optionale Parameter:
        * is_important (boolean): Als wichtig markieren
        * opt_fields (string): Kommagetrennte Liste optionaler Felder
    * Liefert: Angelegtes Custom-Field-Setting-Objekt
52. `asana_remove_custom_field_setting_for_project`
    * **Destruktiv.** Entfernt die Zuordnung eines Custom Fields zu einem Projekt. Bestehende Werte auf Tasks im Projekt bleiben erhalten, das Feld ist dort aber nicht mehr editierbar. Erfordert `confirm: true`.
    * Pflichtparameter:
        * project_gid (string): Projekt-GID
        * custom_field (string): GID des Custom Fields
        * confirm (boolean): Muss `true` sein
    * Liefert: `{ gid, resource_type }` des entfernten Settings

## Prompts

1. `task-summary`
    * Zusammenfassung und Status-Update zu einem Task auf Basis von Notes, Custom Fields und Kommentaren
    * Pflichtparameter:
        * task_id (string): Task-ID
    * Liefert: Detaillierter Prompt mit Anweisungen zur Erstellung einer Task-Zusammenfassung

2. `task-completeness`
    * Analysiert, ob die Beschreibung eines Tasks alle für die Umsetzung nötigen Details enthält
    * Pflichtparameter:
        * task_id (string): Task-ID oder -URL
    * Liefert: Detaillierter Prompt mit Anweisungen zur Vollständigkeitsanalyse

3. `create-task`
    * Erstellt einen neuen Task mit vorgegebenen Details
    * Pflichtparameter:
        * project_name (string): Name des Asana-Projekts, in dem der Task angelegt werden soll
        * title (string): Titel des Tasks
    * Optionale Parameter:
        * notes (string): Notizen oder Beschreibung
        * due_date (string): Fälligkeitsdatum (YYYY-MM-DD)
    * Liefert: Detaillierter Prompt mit Anweisungen zur Erstellung eines umfassenden Tasks

## Resources

1. Workspaces — `asana://workspace/{workspace_gid}`
   * Repräsentation von Asana-Workspaces als Resources
   * Jeder Workspace wird als eigene Resource ausgeliefert
   * URI-Format: `asana://workspace/{workspace_gid}`
   * Liefert: JSON-Objekt mit Workspace-Details:
     * `name`: Name des Workspaces (string)
     * `id`: Globale Workspace-ID (string)
     * `type`: Resource-Typ (string)
     * `is_organization`: Ob der Workspace eine Organisation ist (boolean)
     * `email_domains`: Liste der zugeordneten E-Mail-Domänen (string[])
   * Mime Type: `application/json`

2. Projects — `asana://project/{project_gid}`
   * Template-Resource zum Abrufen von Projekt-Details anhand der GID
   * URI-Format: `asana://project/{project_gid}`
   * Liefert: JSON-Objekt mit Projekt-Details:
     * `name`: Projektname (string)
     * `id`: Globale Projekt-ID (string)
     * `type`: Resource-Typ (string)
     * `archived`: Ob das Projekt archiviert ist (boolean)
     * `public`: Ob das Projekt öffentlich ist (boolean)
     * `notes`: Projektbeschreibung (string)
     * `color`: Projekt-Farbe (string)
     * `default_view`: Standardansicht (string)
     * `due_date`, `due_on`, `start_on`: Projekt-Datumsangaben (string)
     * `workspace`: Objekt mit Workspace-Informationen
     * `team`: Objekt mit Team-Informationen
     * `sections`: Array von Section-Objekten des Projekts
     * `custom_fields`: Array von Custom-Field-Definitionen des Projekts
   * Mime Type: `application/json`

## Setup


1. **Asana-Konto anlegen**:

   - [Asana](https://www.asana.com) aufrufen.
   - Auf „Sign up“ klicken.

2. **Asana Access Token besorgen**:

   - Ein Personal Access Token lässt sich in der Asana-Developer-Konsole erzeugen.
     - https://app.asana.com/0/my-apps
   - Weitere Details: https://developers.asana.com/docs/personal-access-token

3. **Installation** (lokaler Build aus diesem Fork):

   Voraussetzung: Repo ist geklont und `npm ci` wurde ausgeführt (der `prepare`-Hook baut dabei automatisch `dist/index.js`).

   ### Für Claude Code:

   ```powershell
   claude mcp add asana-custom --scope user -- node "<absoluter-pfad-zum-geklonten-repo>/dist/index.js"
   ```

   `ASANA_ACCESS_TOKEN` wird aus der Windows-User-Umgebungsvariable vererbt. Alternativ den Token explizit im Befehl übergeben:

   ```powershell
   claude mcp add asana-custom --scope user -e ASANA_ACCESS_TOKEN=<TOKEN> -- node "<absoluter-pfad-zum-geklonten-repo>/dist/index.js"
   ```

   ### Für Claude Desktop:

   Folgendes in die `claude_desktop_config.json` eintragen:

   ```json
   {
     "mcpServers": {
       "asana-custom": {
         "command": "node",
         "args": ["<absoluter-pfad-zum-geklonten-repo>/dist/index.js"]
       }
     }
   }
   ```

   `ASANA_ACCESS_TOKEN` muss als Windows-User-Umgebungsvariable gesetzt sein, damit Claude Desktop sie an den MCP-Prozess vererben kann.

## Fehlerbehebung

Bei Berechtigungsfehlern:

1. Sicherstellen, dass der Asana-Plan API-Zugriff erlaubt.
2. Prüfen, dass der Access Token und die Konfiguration in `claude_desktop_config.json` korrekt gesetzt sind.


## Mitwirken

Repo klonen und loslegen.

## Lizenz

Dieser MCP-Server steht unter der MIT-Lizenz. Du darfst die Software nutzen, verändern und weitergeben, vorbehaltlich der Bedingungen der MIT-Lizenz. Details siehe LICENSE-Datei im Projekt-Repository.
