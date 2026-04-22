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
  description: "Create a new custom field definition in a workspace. Fields created via API are workspace-global (the Asana API rejects is_global_to_workspace=false). Note: resource_subtype cannot be changed after creation. Formula fields cannot be created via API (only in the Asana web UI).",
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
