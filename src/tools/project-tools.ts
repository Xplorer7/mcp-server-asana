import { Tool } from "@modelcontextprotocol/sdk/types.js";

export const searchProjectsTool: Tool = {
  name: "asana_search_projects",
  description: "Search for projects in Asana using name pattern matching",
  inputSchema: {
    type: "object",
    properties: {
      workspace: {
        type: "string",
        description: "The workspace to search in"
      },
      name_pattern: {
        type: "string",
        description: "Regular expression pattern to match project names"
      },
      archived: {
        type: "boolean",
        description: "Only return archived projects",
        default: false
      },
      opt_fields: {
        type: "string",
        description: "Comma-separated list of optional fields to include"
      }
    },
    required: ["workspace", "name_pattern"]
  }
};

export const getProjectTool: Tool = {
  name: "asana_get_project",
  description: "Get detailed information about a specific project",
  inputSchema: {
    type: "object",
    properties: {
      project_id: {
        type: "string",
        description: "The project ID to retrieve"
      },
      opt_fields: {
        type: "string",
        description: "Comma-separated list of optional fields to include"
      }
    },
    required: ["project_id"]
  }
};

export const getProjectTaskCountsTool: Tool = {
  name: "asana_get_project_task_counts",
  description: "Get the number of tasks in a project",
  inputSchema: {
    type: "object",
    properties: {
      project_id: {
        type: "string",
        description: "The project ID to get task counts for"
      },
      opt_fields: {
        type: "string",
        description: "Comma-separated list of optional fields to include"
      }
    },
    required: ["project_id"]
  }
};

export const getProjectSectionsTool: Tool = {
  name: "asana_get_project_sections",
  description: "Get sections in a project",
  inputSchema: {
    type: "object",
    properties: {
      project_id: {
        type: "string",
        description: "The project ID to get sections for"
      },
      opt_fields: {
        type: "string",
        description: "Comma-separated list of optional fields to include"
      }
    },
    required: ["project_id"]
  }
};

export const getTasksForProjectTool: Tool = {
  name: "asana_get_tasks_for_project",
  description: "Get all tasks in a project. Use this instead of search_tasks when you need to list tasks in a specific project. Supports pagination and optional field selection.",
  inputSchema: {
    type: "object",
    properties: {
      project_id: {
        type: "string",
        description: "The project GID to get tasks for"
      },
      opt_fields: {
        type: "string",
        description: "Comma-separated list of optional fields to include (e.g. 'name,completed,assignee,due_on,memberships.section.name')"
      },
      limit: {
        type: "integer",
        description: "The number of objects to return per page. The value must be between 1 and 100."
      },
      offset: {
        type: "string",
        description: "An offset token from a previous response for pagination"
      }
    },
    required: ["project_id"]
  }
};

export const createProjectTool: Tool = {
  name: "asana_create_project",
  description: "Create a new project in a workspace or team",
  inputSchema: {
    type: "object",
    properties: {
      workspace: {
        type: "string",
        description: "The workspace GID to create the project in"
      },
      name: {
        type: "string",
        description: "Name of the project"
      },
      team: {
        type: "string",
        description: "The team GID to create the project in (required for organization workspaces)"
      },
      notes: {
        type: "string",
        description: "Description or notes for the project"
      },
      color: {
        type: "string",
        description: "Color of the project. Can be one of: dark-pink, dark-green, dark-blue, dark-red, dark-teal, dark-brown, dark-orange, dark-purple, dark-warm-gray, light-pink, light-green, light-blue, light-red, light-teal, light-brown, light-orange, light-purple, light-warm-gray"
      },
      privacy_setting: {
        type: "string",
        description: "Privacy setting of the project. Can be: public_to_workspace, private_to_team, private"
      },
      default_view: {
        type: "string",
        description: "The default view of the project. Can be: list, board, calendar, timeline"
      },
      opt_fields: {
        type: "string",
        description: "Comma-separated list of optional fields to include in the response"
      }
    },
    required: ["workspace", "name"]
  }
};

export const updateProjectTool: Tool = {
  name: "asana_update_project",
  description: "Update a project's details (name, description, etc.)",
  inputSchema: {
    type: "object",
    properties: {
      project_id: {
        type: "string",
        description: "The project GID to update"
      },
      name: {
        type: "string",
        description: "New name for the project"
      },
      notes: {
        type: "string",
        description: "New plain text description for the project"
      },
      html_notes: {
        type: "string",
        description: "New HTML formatted description (must be valid Asana XML)"
      },
      color: {
        type: "string",
        description: "Color of the project. Can be one of: dark-pink, dark-green, dark-blue, dark-red, dark-teal, dark-brown, dark-orange, dark-purple, dark-warm-gray, light-pink, light-green, light-blue, light-red, light-teal, light-brown, light-orange, light-purple, light-warm-gray"
      },
      privacy_setting: {
        type: "string",
        description: "Privacy setting: public_to_workspace, private_to_team, private"
      },
      custom_fields: {
        type: "object",
        description: "Object mapping custom field GID strings to their values. For text fields use a string, for number fields a number, for enum fields the enum option GID. Example: { \"1212279036144756\": \"[ELDIMKO-F01]\" }"
      },
      opt_fields: {
        type: "string",
        description: "Comma-separated list of optional fields to include"
      }
    },
    required: ["project_id"]
  }
};

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
