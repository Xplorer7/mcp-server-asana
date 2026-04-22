# Asana Custom-Field-Definitionen — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 11 neue MCP-Tools für Asana-Custom-Field-Definitionen (Anlegen/Ändern/Löschen von Feldern, Verwalten von Enum-Optionen, Zuordnung zu Projekten) gemäß Spec `docs/superpowers/specs/2026-04-22-asana-custom-field-definitions-design.md`.

**Architecture:** Erweitert die bestehende Struktur ohne neue Abstraktionen. `AsanaClientWrapper` bekommt neue Methoden rund um `CustomFieldsApi`; ein neues Tool-File `custom-field-tools.ts` liefert 8 der Tool-Definitionen, `project-tools.ts` die übrigen 3. Der Tool-Handler routet die Aufrufe und erzwingt bei destruktiven Operationen einen `confirm: true`-Parameter.

**Tech Stack:** TypeScript, esbuild, `asana` npm v3.1.11, MCP SDK (`@modelcontextprotocol/sdk`), manuelles Testing via `scripts/test-mcp.sh`.

---

## Hinweis zum Testing

Die Codebase hat **kein** automatisiertes Test-Framework. TDD im klassischen Sinn (failing unit test → implementation → passing test) ist hier nicht anwendbar. Stattdessen gilt pro Task:

1. **Build-Verifikation** (`npm run build`) — TypeScript-Fehler-frei
2. **Acceptance-Test** per manuellem `mcp_call` gegen das Projekt `Claude/API Test-Projekt` (siehe Test-Constraints im Spec)

Vor dem ersten Acceptance-Test muss einmalig ermittelt werden:
```bash
# Workspace-GID ermitteln (einmalig)
source scripts/test-mcp.sh
mcp_call asana_list_workspaces '{}'
# → WORKSPACE_GID aus Antwort notieren
export WORKSPACE_GID=<gid>

# Projekt-GID "Claude/API Test-Projekt" ermitteln (einmalig)
mcp_call asana_search_projects '{"workspace":"'$WORKSPACE_GID'","name_pattern":"Claude/API Test-Projekt"}'
# → PROJ_GID aus Antwort notieren
export PROJ_GID=<gid>
```

**Wichtige Test-Constraints (aus Spec):**
- Nur gegen das Test-Projekt `Claude/API Test-Projekt` — niemals gegen produktive Projekte
- `is_global_to_workspace` muss in allen Payloads `false` sein oder weggelassen werden
- Test-Feldnamen mit Präfix `MCP-Test-` für Wiedererkennung
- Cleanup-Pflicht am Ende jeder Test-Sequenz (`asana_delete_custom_field` mit `confirm:true`)

---

## Task 1: Foundation — CustomFieldsApi-Instanz im Wrapper

**Files:**
- Modify: `src/asana-client-wrapper.ts:1-28`

- [ ] **Step 1: Feld deklarieren und Instanz im Konstruktor anlegen**

Öffne `src/asana-client-wrapper.ts` und ergänze die Klassen-Felder und den Konstruktor:

```typescript
export class AsanaClientWrapper {
  private workspaces: any;
  private projects: any;
  private tasks: any;
  private stories: any;
  private projectStatuses: any;
  private tags: any;
  private customFieldSettings: any;
  private customFields: any;        // NEU
  private sections: any;
  private userTaskLists: any;

  constructor(token: string) {
    const client = Asana.ApiClient.instance;
    client.authentications['token'].accessToken = token;

    // Initialize API instances
    this.workspaces = new Asana.WorkspacesApi();
    this.projects = new Asana.ProjectsApi();
    this.tasks = new Asana.TasksApi();
    this.stories = new Asana.StoriesApi();
    this.projectStatuses = new Asana.ProjectStatusesApi();
    this.tags = new Asana.TagsApi();
    this.customFieldSettings = new Asana.CustomFieldSettingsApi();
    this.customFields = new Asana.CustomFieldsApi();        // NEU
    this.sections = new Asana.SectionsApi();
    this.userTaskLists = new Asana.UserTaskListsApi();
  }
  // ...
}
```

- [ ] **Step 2: Build verifizieren**

Run: `npm run build`
Expected: kein TypeScript-Fehler, `dist/index.js` wurde erzeugt.

- [ ] **Step 3: Commit**

```bash
git add src/asana-client-wrapper.ts
git commit -m "feat(custom-fields): add CustomFieldsApi instance to wrapper"
```

---

## Task 2: Wrapper-Methoden für Custom-Field-CRUD (A)

**Files:**
- Modify: `src/asana-client-wrapper.ts` (ans Ende der Klasse, vor der schließenden `}`)

- [ ] **Step 1: Fünf Wrapper-Methoden hinzufügen**

Füge unmittelbar vor dem schließenden `}` der Klasse `AsanaClientWrapper` folgende Methoden ein:

```typescript
  // ===== Custom-Field-Definitions =====

  async listCustomFieldsForWorkspace(workspace: string, opts: any = {}) {
    // opts kann limit, offset, opt_fields enthalten — alle direkt an das SDK durchreichen
    const response = await this.customFields.getCustomFieldsForWorkspace(workspace, opts);
    return response.data;
  }

  async getCustomField(customFieldGid: string, opts: any = {}) {
    const options = opts.opt_fields ? opts : {};
    const response = await this.customFields.getCustomField(customFieldGid, options);
    return response.data;
  }

  async createCustomField(data: any, opts: any = {}) {
    const options = opts.opt_fields ? opts : {};
    const body = { data };
    const response = await this.customFields.createCustomField(body, options);
    return response.data;
  }

  async updateCustomField(customFieldGid: string, data: any, opts: any = {}) {
    const options = opts.opt_fields ? opts : {};
    const body = { data };
    const response = await this.customFields.updateCustomField(customFieldGid, { body, ...options });
    return response.data;
  }

  async deleteCustomField(customFieldGid: string) {
    const response = await this.customFields.deleteCustomField(customFieldGid);
    return response.data;
  }
```

- [ ] **Step 2: Build verifizieren**

Run: `npm run build`
Expected: kein TypeScript-Fehler.

- [ ] **Step 3: Commit**

```bash
git add src/asana-client-wrapper.ts
git commit -m "feat(custom-fields): add wrapper methods for custom field CRUD"
```

---

## Task 3: Wrapper-Methoden für Enum-Optionen (B)

**Files:**
- Modify: `src/asana-client-wrapper.ts` (im gleichen Bereich wie Task 2, dahinter)

- [ ] **Step 1: Drei Wrapper-Methoden hinzufügen**

Füge direkt nach den Methoden aus Task 2 (vor dem schließenden `}`) ein:

```typescript
  // ===== Enum-Optionen =====

  async createEnumOption(customFieldGid: string, data: any, opts: any = {}) {
    const options = opts.opt_fields ? opts : {};
    const response = await this.customFields.createEnumOptionForCustomField(
      customFieldGid,
      { body: { data }, ...options }
    );
    return response.data;
  }

  async updateEnumOption(enumOptionGid: string, data: any, opts: any = {}) {
    const options = opts.opt_fields ? opts : {};
    const response = await this.customFields.updateEnumOption(
      enumOptionGid,
      { body: { data }, ...options }
    );
    return response.data;
  }

  async insertEnumOption(customFieldGid: string, data: any, opts: any = {}) {
    const options = opts.opt_fields ? opts : {};
    const response = await this.customFields.insertEnumOptionForCustomField(
      customFieldGid,
      { body: { data }, ...options }
    );
    return response.data;
  }
```

- [ ] **Step 2: Build verifizieren**

Run: `npm run build`
Expected: kein TypeScript-Fehler.

- [ ] **Step 3: Commit**

```bash
git add src/asana-client-wrapper.ts
git commit -m "feat(custom-fields): add wrapper methods for enum options"
```

---

## Task 4: Wrapper-Methoden für Projekt-Settings (C)

**Files:**
- Modify: `src/asana-client-wrapper.ts` (im gleichen Bereich, dahinter)

Wichtig: Für `get_custom_field_settings_for_project` existiert bereits die Wrapper-Methode `getProjectCustomFieldSettings` (Zeile 245). Wir verwenden diese wieder — kein neuer Wrapper.

- [ ] **Step 1: Zwei Wrapper-Methoden für add/remove hinzufügen**

Füge nach den Enum-Methoden (vor dem schließenden `}`) ein:

```typescript
  // ===== Projekt-Settings (Feld ↔ Projekt) =====

  async addCustomFieldSettingForProject(projectGid: string, data: any, opts: any = {}) {
    const options = opts.opt_fields ? opts : {};
    const body = { data };
    const response = await this.projects.addCustomFieldSettingForProject(
      body,
      projectGid,
      options
    );
    return response.data;
  }

  async removeCustomFieldSettingForProject(projectGid: string, data: any) {
    const body = { data };
    const response = await this.projects.removeCustomFieldSettingForProject(
      body,
      projectGid
    );
    return response.data;
  }
```

- [ ] **Step 2: Build verifizieren**

Run: `npm run build`
Expected: kein TypeScript-Fehler.

- [ ] **Step 3: Commit**

```bash
git add src/asana-client-wrapper.ts
git commit -m "feat(custom-fields): add wrapper methods for project field settings"
```

---

## Task 5: Tool-Definitionen in `custom-field-tools.ts` (A + B)

**Files:**
- Create: `src/tools/custom-field-tools.ts`

- [ ] **Step 1: Komplette Tool-Datei schreiben**

Lege die Datei `src/tools/custom-field-tools.ts` mit folgendem Inhalt an:

```typescript
import { Tool } from "@modelcontextprotocol/sdk/types.js";

// ===== A) Custom-Field-Definitionen =====

export const listCustomFieldsForWorkspaceTool: Tool = {
  name: "asana_list_custom_fields_for_workspace",
  description: "List all custom field definitions in an Asana workspace. Returns compact representations.",
  inputSchema: {
    type: "object",
    properties: {
      workspace: {
        type: "string",
        description: "The workspace GID"
      },
      limit: {
        type: "integer",
        description: "Results per page (1-100)"
      },
      offset: {
        type: "string",
        description: "Offset token for pagination"
      },
      opt_fields: {
        type: "string",
        description: "Comma-separated list of optional fields to include (e.g. 'name,resource_subtype,enabled,is_global_to_workspace,is_formula_field,enum_options')"
      }
    },
    required: ["workspace"]
  }
};

export const getCustomFieldTool: Tool = {
  name: "asana_get_custom_field",
  description: "Get the complete definition of a custom field, including type, enum_options (if applicable), precision, format, and is_formula_field flag.",
  inputSchema: {
    type: "object",
    properties: {
      custom_field_gid: {
        type: "string",
        description: "The custom field GID"
      },
      opt_fields: {
        type: "string",
        description: "Comma-separated list of optional fields. Useful: 'enum_options,enum_options.name,enum_options.color,enum_options.enabled,is_formula_field,representation_type,precision,format'"
      }
    },
    required: ["custom_field_gid"]
  }
};

export const createCustomFieldTool: Tool = {
  name: "asana_create_custom_field",
  description: "Create a new custom field definition in a workspace. Note: resource_subtype cannot be changed after creation. Formula fields cannot be created via API (only in the Asana web UI).",
  inputSchema: {
    type: "object",
    properties: {
      workspace: {
        type: "string",
        description: "The workspace GID where the custom field will be created"
      },
      name: {
        type: "string",
        description: "Name of the custom field. Must be unique in the workspace and must not collide with built-in task properties."
      },
      resource_subtype: {
        type: "string",
        description: "Type of the custom field. One of: text, number, enum, multi_enum, date, people",
        enum: ["text", "number", "enum", "multi_enum", "date", "people"]
      },
      description: {
        type: "string",
        description: "Optional description"
      },
      precision: {
        type: "integer",
        description: "Decimal precision for number fields (0-6)"
      },
      format: {
        type: "string",
        description: "For number fields: currency, percentage, duration, custom, none"
      },
      enum_options: {
        type: "array",
        description: "Initial enum options for enum/multi_enum fields. Each item: { name: string, color?: string, enabled?: boolean }",
        items: {
          type: "object",
          properties: {
            name: { type: "string" },
            color: { type: "string" },
            enabled: { type: "boolean" }
          },
          required: ["name"]
        }
      },
      is_global_to_workspace: {
        type: "boolean",
        description: "If true, the field is visible workspace-wide (requires admin permissions). Default: false."
      },
      opt_fields: {
        type: "string",
        description: "Comma-separated list of optional fields to include in the response"
      }
    },
    required: ["workspace", "name", "resource_subtype"]
  }
};

export const updateCustomFieldTool: Tool = {
  name: "asana_update_custom_field",
  description: "Update an existing custom field definition. Note: resource_subtype cannot be changed. Enum options must be managed via asana_create_enum_option / asana_update_enum_option — they are ignored here.",
  inputSchema: {
    type: "object",
    properties: {
      custom_field_gid: {
        type: "string",
        description: "The custom field GID"
      },
      name: {
        type: "string",
        description: "New name"
      },
      description: {
        type: "string",
        description: "New description"
      },
      enabled: {
        type: "boolean",
        description: "Enable or disable the field"
      },
      opt_fields: {
        type: "string",
        description: "Comma-separated list of optional fields to include in the response"
      }
    },
    required: ["custom_field_gid"]
  }
};

export const deleteCustomFieldTool: Tool = {
  name: "asana_delete_custom_field",
  description: "DESTRUCTIVE: Delete a custom field definition. This removes the field from ALL projects and tasks in the workspace that use it. Requires confirm=true.",
  inputSchema: {
    type: "object",
    properties: {
      custom_field_gid: {
        type: "string",
        description: "The custom field GID to delete"
      },
      confirm: {
        type: "boolean",
        description: "Must be explicitly true. Without this flag, the call is rejected with an explanation."
      }
    },
    required: ["custom_field_gid", "confirm"]
  },
  annotations: {
    destructiveHint: true
  }
};

// ===== B) Enum-Optionen =====

export const createEnumOptionTool: Tool = {
  name: "asana_create_enum_option",
  description: "Add a new enum option to an enum or multi_enum custom field. By default appended at the end of the option list. Max 500 options per field (including disabled).",
  inputSchema: {
    type: "object",
    properties: {
      custom_field_gid: {
        type: "string",
        description: "The custom field GID (must be of type enum or multi_enum)"
      },
      name: {
        type: "string",
        description: "Display name of the enum option"
      },
      color: {
        type: "string",
        description: "Color name. One of: red, orange, yellow-orange, yellow, yellow-green, green, blue-green, aqua, blue, indigo, purple, magenta, hot-pink, pink, cool-gray"
      },
      enabled: {
        type: "boolean",
        description: "Whether the option is enabled (selectable). Default: true."
      },
      insert_before: {
        type: "string",
        description: "GID of an existing enum option. Inserts the new option before this one."
      },
      insert_after: {
        type: "string",
        description: "GID of an existing enum option. Inserts the new option after this one."
      },
      opt_fields: {
        type: "string",
        description: "Comma-separated list of optional fields to include in the response"
      }
    },
    required: ["custom_field_gid", "name"]
  }
};

export const updateEnumOptionTool: Tool = {
  name: "asana_update_enum_option",
  description: "Update an existing enum option's name, color, or enabled state. Note: enum options cannot be deleted via API — disable them with enabled=false instead.",
  inputSchema: {
    type: "object",
    properties: {
      enum_option_gid: {
        type: "string",
        description: "The enum option GID"
      },
      name: {
        type: "string",
        description: "New display name"
      },
      color: {
        type: "string",
        description: "New color (see asana_create_enum_option for allowed values)"
      },
      enabled: {
        type: "boolean",
        description: "Enable or disable. Enum fields require at least one enabled option."
      },
      opt_fields: {
        type: "string",
        description: "Comma-separated list of optional fields to include in the response"
      }
    },
    required: ["enum_option_gid"]
  }
};

export const insertEnumOptionTool: Tool = {
  name: "asana_insert_enum_option",
  description: "Reorder an existing enum option: move it before or after another option in the custom field's option list.",
  inputSchema: {
    type: "object",
    properties: {
      custom_field_gid: {
        type: "string",
        description: "The custom field GID"
      },
      enum_option: {
        type: "string",
        description: "GID of the enum option to move"
      },
      before_enum_option: {
        type: "string",
        description: "GID of the enum option to insert before (provide either this or after_enum_option)"
      },
      after_enum_option: {
        type: "string",
        description: "GID of the enum option to insert after (provide either this or before_enum_option)"
      },
      opt_fields: {
        type: "string",
        description: "Comma-separated list of optional fields to include in the response"
      }
    },
    required: ["custom_field_gid", "enum_option"]
  }
};
```

- [ ] **Step 2: Build verifizieren**

Run: `npm run build`
Expected: kein TypeScript-Fehler.

- [ ] **Step 3: Commit**

```bash
git add src/tools/custom-field-tools.ts
git commit -m "feat(custom-fields): add tool definitions for custom fields and enum options"
```

---

## Task 6: Tool-Definitionen in `project-tools.ts` (C)

**Files:**
- Modify: `src/tools/project-tools.ts` (am Ende der Datei)

- [ ] **Step 1: Drei Tool-Objekte anhängen**

Öffne `src/tools/project-tools.ts` und füge am Ende der Datei (nach dem letzten `export const`) folgende drei Tool-Definitionen an:

```typescript
export const getCustomFieldSettingsForProjectTool: Tool = {
  name: "asana_get_custom_field_settings_for_project",
  description: "Get all custom field settings for a project — i.e. which custom fields are attached to the project and whether they are marked as important.",
  inputSchema: {
    type: "object",
    properties: {
      project_gid: {
        type: "string",
        description: "The project GID"
      },
      opt_fields: {
        type: "string",
        description: "Comma-separated list of optional fields. Useful: 'custom_field,custom_field.name,custom_field.resource_subtype,custom_field.enum_options,is_important'"
      }
    },
    required: ["project_gid"]
  }
};

export const addCustomFieldSettingForProjectTool: Tool = {
  name: "asana_add_custom_field_setting_for_project",
  description: "Attach an existing custom field to a project. Optionally mark it as important (shown in the project header).",
  inputSchema: {
    type: "object",
    properties: {
      project_gid: {
        type: "string",
        description: "The project GID"
      },
      custom_field: {
        type: "string",
        description: "GID of the custom field to attach"
      },
      is_important: {
        type: "boolean",
        description: "If true, the field is highlighted in the project view"
      },
      opt_fields: {
        type: "string",
        description: "Comma-separated list of optional fields to include in the response"
      }
    },
    required: ["project_gid", "custom_field"]
  }
};

export const removeCustomFieldSettingForProjectTool: Tool = {
  name: "asana_remove_custom_field_setting_for_project",
  description: "DESTRUCTIVE: Detach a custom field from a project. Values that were already set on tasks in the project remain, but the field is no longer editable there. Requires confirm=true.",
  inputSchema: {
    type: "object",
    properties: {
      project_gid: {
        type: "string",
        description: "The project GID"
      },
      custom_field: {
        type: "string",
        description: "GID of the custom field to detach"
      },
      confirm: {
        type: "boolean",
        description: "Must be explicitly true. Without this flag, the call is rejected with an explanation."
      }
    },
    required: ["project_gid", "custom_field", "confirm"]
  },
  annotations: {
    destructiveHint: true
  }
};
```

- [ ] **Step 2: Build verifizieren**

Run: `npm run build`
Expected: kein TypeScript-Fehler.

- [ ] **Step 3: Commit**

```bash
git add src/tools/project-tools.ts
git commit -m "feat(custom-fields): add project custom field settings tools"
```

---

## Task 7: Tool-Handler — Imports, all_tools, READ_ONLY_TOOLS

**Files:**
- Modify: `src/tool-handler.ts:6-14` (project-tools Import)
- Modify: `src/tool-handler.ts:60-104` (all_tools-Array)
- Modify: `src/tool-handler.ts:107-126` (READ_ONLY_TOOLS-Array)

- [ ] **Step 1: Import für neues custom-field-tools.ts hinzufügen**

Öffne `src/tool-handler.ts`. Füge direkt nach dem vorhandenen `story-tools.js`-Import (Zeile 59) ein:

```typescript
import {
  listCustomFieldsForWorkspaceTool,
  getCustomFieldTool,
  createCustomFieldTool,
  updateCustomFieldTool,
  deleteCustomFieldTool,
  createEnumOptionTool,
  updateEnumOptionTool,
  insertEnumOptionTool
} from './tools/custom-field-tools.js';
```

- [ ] **Step 2: project-tools Import um die 3 neuen Tools erweitern**

Ändere den bestehenden Import-Block `from './tools/project-tools.js'` (Zeilen 6-14). Alter Zustand:

```typescript
import {
  searchProjectsTool,
  getProjectTool,
  getProjectTaskCountsTool,
  getProjectSectionsTool,
  getTasksForProjectTool,
  createProjectTool,
  updateProjectTool
} from './tools/project-tools.js';
```

Neuer Zustand:

```typescript
import {
  searchProjectsTool,
  getProjectTool,
  getProjectTaskCountsTool,
  getProjectSectionsTool,
  getTasksForProjectTool,
  createProjectTool,
  updateProjectTool,
  getCustomFieldSettingsForProjectTool,
  addCustomFieldSettingForProjectTool,
  removeCustomFieldSettingForProjectTool
} from './tools/project-tools.js';
```

- [ ] **Step 3: all_tools-Array um 11 Einträge erweitern**

Im `all_tools`-Array (Zeilen 62-104), direkt vor dem schließenden `]`, nach `updateProjectTool,` ergänzen:

```typescript
  updateProjectTool,
  // Custom-Field-Definitionen
  listCustomFieldsForWorkspaceTool,
  getCustomFieldTool,
  createCustomFieldTool,
  updateCustomFieldTool,
  deleteCustomFieldTool,
  createEnumOptionTool,
  updateEnumOptionTool,
  insertEnumOptionTool,
  // Custom-Field ↔ Projekt
  getCustomFieldSettingsForProjectTool,
  addCustomFieldSettingForProjectTool,
  removeCustomFieldSettingForProjectTool,
];
```

- [ ] **Step 4: READ_ONLY_TOOLS-Array um 3 GET-Tools erweitern**

Im `READ_ONLY_TOOLS`-Array (Zeilen 107-126), vor dem schließenden `]`, ergänzen:

```typescript
  'asana_get_subtasks',
  'asana_list_custom_fields_for_workspace',
  'asana_get_custom_field',
  'asana_get_custom_field_settings_for_project'
];
```

- [ ] **Step 5: Build verifizieren**

Run: `npm run build`
Expected: kein TypeScript-Fehler. Achtung: Es sind noch keine switch/case-Handler für die neuen Tools registriert — dadurch wirft ein Aufruf zur Laufzeit einen "Unknown tool"-Fehler. Das ist in Task 8–10 der nächste Schritt.

- [ ] **Step 6: Commit**

```bash
git add src/tool-handler.ts
git commit -m "feat(custom-fields): register 11 new tools in tool-handler"
```

---

## Task 8: Handler-Cases für Custom-Field-CRUD (A) + Delete-Confirm-Guard

**Files:**
- Modify: `src/tool-handler.ts` (innerhalb des `switch`-Blocks in `tool_handler`)

- [ ] **Step 1: Fünf `case`-Zweige hinzufügen**

Füge **am Ende** des `switch`-Blocks in `tool_handler` (vor dem abschließenden `default:` oder vor der schließenden `}` des `switch`) folgende Cases ein:

```typescript
        // ===== Custom-Field-Definitionen =====

        case "asana_list_custom_fields_for_workspace": {
          const { workspace, ...opts } = args;
          const response = await asanaClient.listCustomFieldsForWorkspace(workspace, opts);
          return {
            content: [{ type: "text", text: JSON.stringify(response) }],
          };
        }

        case "asana_get_custom_field": {
          const { custom_field_gid, ...opts } = args;
          const response = await asanaClient.getCustomField(custom_field_gid, opts);
          return {
            content: [{ type: "text", text: JSON.stringify(response) }],
          };
        }

        case "asana_create_custom_field": {
          const { opt_fields, ...data } = args;
          const allowed = ["text", "number", "enum", "multi_enum", "date", "people"];
          if (!allowed.includes(data.resource_subtype)) {
            throw new Error(
              `resource_subtype must be one of: ${allowed.join(", ")}`
            );
          }
          const response = await asanaClient.createCustomField(data, opt_fields ? { opt_fields } : {});
          return {
            content: [{ type: "text", text: JSON.stringify(response) }],
          };
        }

        case "asana_update_custom_field": {
          const { custom_field_gid, opt_fields, ...data } = args;
          const response = await asanaClient.updateCustomField(
            custom_field_gid,
            data,
            opt_fields ? { opt_fields } : {}
          );
          return {
            content: [{ type: "text", text: JSON.stringify(response) }],
          };
        }

        case "asana_delete_custom_field": {
          const { custom_field_gid, confirm } = args;
          if (confirm !== true) {
            throw new Error(
              "Destructive operation. Deleting a custom field removes it from ALL projects and tasks in the workspace. Re-invoke with confirm=true to proceed."
            );
          }
          const response = await asanaClient.deleteCustomField(custom_field_gid);
          return {
            content: [{ type: "text", text: JSON.stringify(response) }],
          };
        }
```

- [ ] **Step 2: Build verifizieren**

Run: `npm run build`
Expected: kein TypeScript-Fehler.

- [ ] **Step 3: Commit**

```bash
git add src/tool-handler.ts
git commit -m "feat(custom-fields): add handler cases for custom field CRUD"
```

---

## Task 9: Handler-Cases für Enum-Optionen (B)

**Files:**
- Modify: `src/tool-handler.ts` (an die Cases aus Task 8 anschließen)

- [ ] **Step 1: Drei `case`-Zweige hinzufügen**

Direkt nach dem `asana_delete_custom_field`-Case aus Task 8 ergänzen:

```typescript
        // ===== Enum-Optionen =====

        case "asana_create_enum_option": {
          const { custom_field_gid, opt_fields, ...data } = args;
          const response = await asanaClient.createEnumOption(
            custom_field_gid,
            data,
            opt_fields ? { opt_fields } : {}
          );
          return {
            content: [{ type: "text", text: JSON.stringify(response) }],
          };
        }

        case "asana_update_enum_option": {
          const { enum_option_gid, opt_fields, ...data } = args;
          const response = await asanaClient.updateEnumOption(
            enum_option_gid,
            data,
            opt_fields ? { opt_fields } : {}
          );
          return {
            content: [{ type: "text", text: JSON.stringify(response) }],
          };
        }

        case "asana_insert_enum_option": {
          const { custom_field_gid, opt_fields, ...data } = args;
          if (!data.before_enum_option && !data.after_enum_option) {
            throw new Error(
              "asana_insert_enum_option requires either before_enum_option or after_enum_option."
            );
          }
          const response = await asanaClient.insertEnumOption(
            custom_field_gid,
            data,
            opt_fields ? { opt_fields } : {}
          );
          return {
            content: [{ type: "text", text: JSON.stringify(response) }],
          };
        }
```

- [ ] **Step 2: Build verifizieren**

Run: `npm run build`
Expected: kein TypeScript-Fehler.

- [ ] **Step 3: Commit**

```bash
git add src/tool-handler.ts
git commit -m "feat(custom-fields): add handler cases for enum options"
```

---

## Task 10: Handler-Cases für Projekt-Settings (C) + Remove-Confirm-Guard

**Files:**
- Modify: `src/tool-handler.ts` (an die Cases aus Task 9 anschließen)

- [ ] **Step 1: Drei `case`-Zweige hinzufügen**

Direkt nach dem `asana_insert_enum_option`-Case aus Task 9 ergänzen. `asana_get_custom_field_settings_for_project` nutzt die bereits bestehende Wrapper-Methode `getProjectCustomFieldSettings`:

```typescript
        // ===== Custom-Field ↔ Projekt =====

        case "asana_get_custom_field_settings_for_project": {
          const { project_gid, ...opts } = args;
          const response = await asanaClient.getProjectCustomFieldSettings(project_gid, opts);
          return {
            content: [{ type: "text", text: JSON.stringify(response) }],
          };
        }

        case "asana_add_custom_field_setting_for_project": {
          const { project_gid, opt_fields, ...data } = args;
          const response = await asanaClient.addCustomFieldSettingForProject(
            project_gid,
            data,
            opt_fields ? { opt_fields } : {}
          );
          return {
            content: [{ type: "text", text: JSON.stringify(response) }],
          };
        }

        case "asana_remove_custom_field_setting_for_project": {
          const { project_gid, custom_field, confirm } = args;
          if (confirm !== true) {
            throw new Error(
              "Destructive operation. Removing a custom field setting from a project detaches the field. Re-invoke with confirm=true to proceed."
            );
          }
          const response = await asanaClient.removeCustomFieldSettingForProject(
            project_gid,
            { custom_field }
          );
          return {
            content: [{ type: "text", text: JSON.stringify(response) }],
          };
        }
```

- [ ] **Step 2: Build verifizieren**

Run: `npm run build`
Expected: kein TypeScript-Fehler.

- [ ] **Step 3: Commit**

```bash
git add src/tool-handler.ts
git commit -m "feat(custom-fields): add handler cases for project field settings"
```

---

## Task 11: Verifikation — list_tools & Read-Only-Mode

**Files:**
- keine Änderungen

- [ ] **Step 1: Build und Full-Mode list_tools prüfen**

```bash
npm run build
echo '{"jsonrpc":"2.0","method":"initialize","id":0,"params":{"capabilities":{},"clientInfo":{"name":"test","version":"1.0"},"protocolVersion":"2024-11-05"}}
{"jsonrpc":"2.0","method":"tools/list","id":1,"params":{}}' | node dist/index.js 2>/dev/null | grep -o '"asana_[a-z_]*"' | sort -u
```

Expected: Unter den Ausgaben tauchen alle 11 neuen Tools auf:
- `asana_add_custom_field_setting_for_project`
- `asana_create_custom_field`
- `asana_create_enum_option`
- `asana_delete_custom_field`
- `asana_get_custom_field`
- `asana_get_custom_field_settings_for_project`
- `asana_insert_enum_option`
- `asana_list_custom_fields_for_workspace`
- `asana_remove_custom_field_setting_for_project`
- `asana_update_custom_field`
- `asana_update_enum_option`

- [ ] **Step 2: Read-Only-Mode prüfen**

```bash
echo '{"jsonrpc":"2.0","method":"initialize","id":0,"params":{"capabilities":{},"clientInfo":{"name":"test","version":"1.0"},"protocolVersion":"2024-11-05"}}
{"jsonrpc":"2.0","method":"tools/list","id":1,"params":{}}' | READ_ONLY_MODE=true node dist/index.js 2>/dev/null | grep -o '"asana_[a-z_]*"' | sort -u | grep -E "custom_field"
```

Expected: **Nur** folgende drei Einträge erscheinen:
- `asana_get_custom_field`
- `asana_get_custom_field_settings_for_project`
- `asana_list_custom_fields_for_workspace`

Die acht Write-/Delete-Tools sind nicht in der Liste.

- [ ] **Step 3: Ergebnis festhalten (optional)**

Kein Commit nötig — reine Verifikation ohne Codeänderungen.

---

## Task 12: Acceptance Tests — vollständige Test-Sequenz

**Files:**
- keine Code-Änderungen — nur manuelle Verifikation gegen die echte Asana-API

Alle Aufrufe in diesem Task laufen gegen das Projekt `Claude/API Test-Projekt`. `$WORKSPACE_GID` und `$PROJ_GID` müssen exportiert sein (siehe Hinweis-Abschnitt am Anfang des Plans).

- [ ] **Step 1: Test-Enum-Feld anlegen (nicht global)**

```bash
source scripts/test-mcp.sh

mcp_call_json asana_create_custom_field '{
  "workspace":"'$WORKSPACE_GID'",
  "name":"MCP-Test-Prio",
  "resource_subtype":"enum",
  "is_global_to_workspace":false,
  "enum_options":[
    {"name":"Hoch","color":"red"},
    {"name":"Niedrig","color":"green"}
  ]
}'
```

Expected: JSON-Antwort mit `gid`, `resource_subtype: "enum"`, zwei Enum-Options-Einträgen. **GID notieren** → `export FIELD_GID=<gid>` und die GID von "Hoch" → `export HOCH_GID=<gid>`.

- [ ] **Step 2: Feld lesen (einzeln + in Liste)**

```bash
mcp_call asana_get_custom_field '{"custom_field_gid":"'$FIELD_GID'"}'
mcp_call asana_list_custom_fields_for_workspace '{"workspace":"'$WORKSPACE_GID'"}'
```

Expected: Beide Calls liefern das angelegte Feld zurück.

- [ ] **Step 3: Feld aktualisieren**

```bash
mcp_call asana_update_custom_field '{
  "custom_field_gid":"'$FIELD_GID'",
  "name":"MCP-Test-Priorität",
  "description":"Geändert via MCP"
}'
```

Expected: Antwort zeigt den neuen Namen und die Beschreibung.

- [ ] **Step 4: Enum-Option hinzufügen, updaten, umsortieren**

```bash
mcp_call_json asana_create_enum_option '{
  "custom_field_gid":"'$FIELD_GID'",
  "name":"Mittel",
  "color":"yellow"
}'
# GID notieren → export OPT_GID=<gid>

mcp_call asana_update_enum_option '{
  "enum_option_gid":"'$OPT_GID'",
  "name":"Mittelhoch"
}'

mcp_call asana_insert_enum_option '{
  "custom_field_gid":"'$FIELD_GID'",
  "enum_option":"'$OPT_GID'",
  "before_enum_option":"'$HOCH_GID'"
}'
```

Expected: Erfolgreiche Antworten; in der Feldansicht steht "Mittelhoch" nun vor "Hoch".

- [ ] **Step 5: Settings-Zyklus gegen Test-Projekt**

```bash
mcp_call asana_add_custom_field_setting_for_project '{
  "project_gid":"'$PROJ_GID'",
  "custom_field":"'$FIELD_GID'",
  "is_important":true
}'

mcp_call asana_get_custom_field_settings_for_project '{
  "project_gid":"'$PROJ_GID'"
}'
```

Expected: Feld erscheint in der Settings-Liste des Projekts mit `is_important: true`.

- [ ] **Step 6: Confirm-Gate für remove prüfen (negativ + positiv)**

```bash
mcp_call asana_remove_custom_field_setting_for_project '{
  "project_gid":"'$PROJ_GID'",
  "custom_field":"'$FIELD_GID'"
}'
```
Expected: Fehler mit Text enthält `"Destructive operation"` und `"confirm=true"`.

```bash
mcp_call asana_remove_custom_field_setting_for_project '{
  "project_gid":"'$PROJ_GID'",
  "custom_field":"'$FIELD_GID'",
  "confirm":true
}'
```
Expected: Erfolg — Feld ist aus dem Projekt entfernt. Verifiziere mit:

```bash
mcp_call asana_get_custom_field_settings_for_project '{"project_gid":"'$PROJ_GID'"}'
```
Expected: Feld `MCP-Test-Priorität` taucht nicht mehr auf.

- [ ] **Step 7: Confirm-Gate für delete prüfen + Cleanup**

```bash
mcp_call asana_delete_custom_field '{"custom_field_gid":"'$FIELD_GID'"}'
```
Expected: Fehler mit Text enthält `"Destructive operation"` und `"confirm=true"`.

```bash
mcp_call asana_delete_custom_field '{"custom_field_gid":"'$FIELD_GID'","confirm":true}'
```
Expected: Erfolg — leere `data`-Response.

- [ ] **Step 8: Cleanup-Verifikation**

```bash
mcp_call asana_list_custom_fields_for_workspace '{"workspace":"'$WORKSPACE_GID'"}' \
  | grep -i "MCP-Test-Priorität"
```
Expected: keine Treffer. Kein Test-Feld bleibt zurück.

- [ ] **Step 9: Acceptance festhalten (optional)**

Kein Commit nötig — reine Acceptance ohne Codeänderungen.

---

## Task 13: README aktualisieren

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Tool-Liste im README ergänzen**

Öffne `README.md` und suche die bestehende nummerierte Liste der verfügbaren Tools. Füge die 11 neuen Tools in einem eigenen Block an (Nummerierung fortführen). Bei jedem Tool: Name, Kurzbeschreibung, Pflicht- und optionale Parameter.

Beispielformat (dem bestehenden README-Stil angepasst):

```markdown
### Custom Field Definitions

**N. `asana_list_custom_fields_for_workspace`** — Listet alle Custom-Field-Definitionen im Workspace.
- Pflicht: `workspace`
- Optional: `limit`, `offset`, `opt_fields`

**N+1. `asana_get_custom_field`** — Lädt die vollständige Definition eines Felds.
- Pflicht: `custom_field_gid`
- Optional: `opt_fields`

**N+2. `asana_create_custom_field`** — Legt ein neues Custom Field im Workspace an. Typen: text, number, enum, multi_enum, date, people. Formel-Felder sind per API nicht erstellbar.
- Pflicht: `workspace`, `name`, `resource_subtype`
- Optional: `description`, `precision`, `format`, `enum_options`, `is_global_to_workspace`, `opt_fields`

**N+3. `asana_update_custom_field`** — Ändert Name/Beschreibung/enabled. Typ unveränderbar; Enum-Optionen separat.
- Pflicht: `custom_field_gid`
- Optional: `name`, `description`, `enabled`, `opt_fields`

**N+4. `asana_delete_custom_field`** — **Destruktiv.** Entfernt das Feld aus allen Projekten/Tasks. Confirm-Pflicht.
- Pflicht: `custom_field_gid`, `confirm: true`

**N+5. `asana_create_enum_option`** — Fügt einem Enum-Feld eine neue Option hinzu.
- Pflicht: `custom_field_gid`, `name`
- Optional: `color`, `enabled`, `insert_before`, `insert_after`, `opt_fields`

**N+6. `asana_update_enum_option`** — Ändert Name/Farbe/enabled einer Enum-Option. Löschen nicht möglich → `enabled: false`.
- Pflicht: `enum_option_gid`
- Optional: `name`, `color`, `enabled`, `opt_fields`

**N+7. `asana_insert_enum_option`** — Positioniert eine Enum-Option vor/hinter einer anderen.
- Pflicht: `custom_field_gid`, `enum_option`, `before_enum_option` **oder** `after_enum_option`
- Optional: `opt_fields`

### Custom Field ↔ Projekt

**N+8. `asana_get_custom_field_settings_for_project`** — Listet die einem Projekt zugeordneten Felder.
- Pflicht: `project_gid`
- Optional: `opt_fields`

**N+9. `asana_add_custom_field_setting_for_project`** — Ordnet ein Custom Field einem Projekt zu.
- Pflicht: `project_gid`, `custom_field`
- Optional: `is_important`, `opt_fields`

**N+10. `asana_remove_custom_field_setting_for_project`** — **Destruktiv.** Löst die Feld-Projekt-Zuordnung. Confirm-Pflicht.
- Pflicht: `project_gid`, `custom_field`, `confirm: true`
```

(Konkrete Nummern entsprechend dem bestehenden README ersetzen.)

- [ ] **Step 2: Build nicht nötig — README ist nicht Teil des Builds**

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs: add custom field definition tools to README"
```

---

## Post-Implementation — Akzeptanzkriterien (aus Spec)

Nach Task 13 folgende Kriterien final prüfen:

- [ ] 11 Tools sind in `list_of_tools` registriert und via `tools/list` sichtbar (bestätigt in Task 11 Step 1)
- [ ] Alle drei READ-Tools erscheinen in `list_of_tools` bei `READ_ONLY_MODE=true`, die 8 Write-Tools nicht (bestätigt in Task 11 Step 2)
- [ ] Test-Sequenz aus Task 12 läuft erfolgreich durch und hinterlässt keine Spuren im Workspace (bestätigt in Task 12 Step 8)
- [ ] Destruktive Tools verweigern ohne `confirm: true` die Ausführung mit aussagekräftiger Fehlermeldung (bestätigt in Task 12 Steps 6 und 7)
- [ ] `npm run build` läuft ohne TypeScript-Fehler (mehrfach bestätigt, zuletzt in Task 11)
- [ ] `README.md` listet die 11 neuen Tools (Task 13)

Wenn alle Kriterien erfüllt sind, ist das Feature fertig.
