const path = require('path');
const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

const token = process.env.STREAMLINE_TOKEN;
const project_id = process.env.STREAMLINE_PROJECT_ID;

const api = axios.create({
  baseURL: 'https://prod-streamline-services.azurewebsites.net/api',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

const createWorkflowData = (interaction_form_id) => ({
  "viewport": {
    "x": 658.9555151125857,
    "y": 436.81486429263134,
    "zoom": 1.515716566510398
  },
  steps: [
    {
      "id": "start",
      "position": {
        "x": -206.5,
        "y": -8
      },
      "data": {
        "label": "Inicio",
        "hasHandleRight": true,
        "hasMenu": true,
        "visible": false
      },
      "type": "circle",
      "deletable": false,
      "next": {
        "default-source": "e37753cd-9bee-4ba0-be03-31bcda1f6923"
      }
    },
    {
      "id": "e37753cd-9bee-4ba0-be03-31bcda1f6923",
      "position": {
        "x": -58,
        "y": -7.5
      },
      "data": {
        "name": "Autoavaliação",
        "to": [
          "${{activity.#users.email}}"
        ],
        "canAddParticipants": false,
        "permissionAddParticipants": [],
        "form_id": interaction_form_id,
        "visible": true,
        "waitType": "all",
        "conditional": []
      },
      "type": "interaction",
      "next": {
        "default-source": "85aa0ce0-63ba-489c-914d-2afb77e497f3"
      }
    },
    {
      "id": "85aa0ce0-63ba-489c-914d-2afb77e497f3",
      "position": {
        "x": 112,
        "y": -8
      },
      "data": {
        "name": "Autoavaliação Concluida",
        "status_id": "67d9719bb4a00cde2c5c9bce",
        "visible": true
      },
      "type": "change_status",
      "next": {
        "default-source": "772ffb75-097a-4b9f-a56e-0ce5f03414f3"
      }
    },
    {
      "id": "772ffb75-097a-4b9f-a56e-0ce5f03414f3",
      "position": {
        "x": 286,
        "y": -7.5
      },
      "data": {
        "name": "Avaliação do time",
        "to": [],
        "canAddParticipants": true,
        "permissionAddParticipants": [
          "${{activity.#users.email}}"
        ],
        "form_id": interaction_form_id,
        "visible": true,
        "waitType": "all",
        "conditional": []
      },
      "type": "interaction",
      "next": {
        "default-source": "e518dbc0-9fa9-4f09-85d0-218f587b0d9e"
      }
    },
    {
      "id": "e518dbc0-9fa9-4f09-85d0-218f587b0d9e",
      "position": {
        "x": 478.35096673560054,
        "y": -5.1558876278718415
      },
      "data": {
        "name": "Concluido",
        "status_id": "66cf622d6bb43bdbc3d1bfc0",
        "visible": true
      },
      "type": "change_status",
      "next": {
        "default-source": null
      }
    }
  ]
})

const getForms = async () => {
  const response = await api.get(`/forms`, {
    params: {
      project: project_id,
      limit: 1000
    }
  });
  return response.data.data;
};

const getForm = async (form_id) => {
  const response = await api.get(`/form/${form_id}`);
  return response.data.data;
};

const updateForm = async (form_id, data) => {
  const response = await api.put(`/form/${form_id}`, data);
  return response.data.data;
};

const createWorkflow = async (form) => {
  const response = await api.post(`/workflow`, {
    name: `Fluxo de ${form.name.split(" - ")[1]}`,
    project: project_id,
    active: true,
  });
  return response.data.data;
};

const createWorkflowDraft = async (workflow_id, data) => {
  const response = await api.post(`/workflow-draft/${workflow_id}`, data);
  return response.data.data;
};

const publishWorkflowDraft = async (workflow_draft_id) => {
  const response = await api.patch(`/workflow-draft/${workflow_draft_id}`, {
    status: "published",
    _id: workflow_draft_id
  });
  return response.data.data;
};

const getFormDrafts = async (form_id) => {
  const response = await api.get(`/form-drafts/${form_id}`);
  return response.data.data;
};

const getFormDraft = async (form_draft_id) => {
  const response = await api.get(`/form-draft/${form_draft_id}`);
  return response.data.data;
};

const publishFormDraft = async (form_draft_id) => {
  const response = await api.patch(`/form-draft/${form_draft_id}`, {
    status: "published",
    _id: form_draft_id
  });
  return response.data.data;
};

const createFormDraft = async (form_id, type, fields) => {
  const response = await api.post(`/form-draft/${form_id}`, {
    parent: form_id,
    type,
    fields
  });
  return response.data.data;
};

const createForm = async (data) => {
  const response = await api.post(`/form`, data);
  return response.data.data;
};

async function main() {
  console.log('Fetching all forms...');
  const { forms } = await getForms();
  console.log(`Found ${forms.length} forms total`);

  const createdForms = forms.filter(form => form.type === "created");
  const interactionForms = forms.filter(form => form.type === "interaction" && !form.name.includes("[Time]"));

  console.log(`Found ${createdForms.length} created forms`);
  console.log(`Found ${interactionForms.length} interaction forms`);
  for (const form of createdForms) {
    console.log(`Processing form ${form.name}`);
    const formData = await getForm(form._id);

    const formDraft = await getFormDraft(formData.published);

    // console.log(formDraft);

    const count = formDraft.fields.length;

    if (count > 1) {
      continue;
    }

    console.log(`> Form ${form.name} has ${count} fields`);

    if (!formData.active || !formData.published) {
      console.log(`> Form ${form.name} is not active, skipping`);
      continue;
    }

    const interactionFormId = interactionForms.find(interactionForm => interactionForm.name.includes(form.name.split(" - ")[1]))?._id;

    console.log(`> Interaction form id: ${interactionFormId}`);

    const interactionForm = await getForm(interactionFormId);

    if (!interactionForm.active || !interactionForm.published) {
      console.log(`> Interaction form ${interactionForm.name} is not active, skipping`);
      continue;
    }

    const interactionFormDraft = await getFormDraft(interactionForm.published);

    formDraft.fields.push(...interactionFormDraft.fields.map(field => ({
      ...field,
      required: false,
      type: "placeholder",
    })));

    const newFormDraft = await createFormDraft(form._id, "created", formDraft.fields);

    console.log(`> New form draft id: ${newFormDraft._id}`);

    await publishFormDraft(newFormDraft._id);

    console.log(`> Form ${form.name} published`);

  }

  console.log('\nAll forms processed successfully!');
}

main().catch(error => {
  console.error('Error in main:', error);
  process.exit(1);
});
