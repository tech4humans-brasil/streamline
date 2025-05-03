const path = require('path');
const axios = require('axios');

const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY2Y2Y1Zjg3NzNmMjc0MTVmNGI2M2ZkNCIsIm5hbWUiOiJMdWlzIFJpY2FyZG8iLCJtYXRyaWN1bGF0aW9uIjoiMjEwMDAzIiwiZW1haWwiOiJsdWlzLnJpY2FyZG9AdGVjaDRoLmNvbS5iciIsInJvbGVzIjpbImFkbWluIl0sImluc3RpdHV0ZXMiOlt7Im5hbWUiOiJEZXZPcHMiLCJhY3JvbnltIjoiZGV2b3BzIiwiYWN0aXZlIjp0cnVlLCJfaWQiOiI2NmNmNWZhOTZiYjQzYmRiYzNkMWJmODQifSx7Im5hbWUiOiJDb21pdMOqIGRlIFNlZ3VyYW7Dp2EgZGEgSW5mb3JtYcOnw6NvIiwiYWNyb255bSI6InNnaSIsImFjdGl2ZSI6dHJ1ZSwiX2lkIjoiNjcyYmY2Y2UwNWY3M2M0MzlhNDJiZWVlIn1dLCJzbHVnIjoidGVjaDRoIiwiY2xpZW50IjoidGVjaDRoIiwidHV0b3JpYWxzIjpbImZpcnN0LXBhZ2UiLCJkYXNoYm9hcmQiLCJuYXZiYXIiXSwicGVybWlzc2lvbnMiOlsiZGFzaGJvYXJkLnZpZXciLCJhY3Rpdml0eS52aWV3IiwiYWN0aXZpdHkuY3JlYXRlIiwiYWN0aXZpdHkudXBkYXRlIiwiYWN0aXZpdHkucmVhZCIsImFjdGl2aXR5LmRlbGV0ZSIsImFjdGl2aXR5LmJvYXJkLWRlZmluaXRpb24iLCJhY3Rpdml0eS5jb21taXR0ZWQiLCJhY3Rpdml0eS5hY2NlcHQiLCJyZXNwb25zZS5jcmVhdGUiLCJyZXNwb25zZS5yZWFkIiwicmVzcG9uc2UudXBkYXRlIiwicmVzcG9uc2UuZGVsZXRlIiwiYW5zd2VyLnZpZXciLCJhbnN3ZXIuY3JlYXRlIiwiYW5zd2VyLnJlYWQiLCJjb21tZW50LnZpZXciLCJjb21tZW50LmNyZWF0ZSIsImNvbW1lbnQucmVhZCIsImNvbW1lbnQudXBkYXRlIiwiY29tbWVudC5kZWxldGUiLCJ1c2VyLnZpZXciLCJ1c2VyLnJlYWQiLCJ1c2VyLmNyZWF0ZSIsInVzZXIudXBkYXRlIiwidXNlci5kZWxldGUiLCJ3b3JrZmxvdy52aWV3Iiwid29ya2Zsb3cucmVhZCIsIndvcmtmbG93LmNyZWF0ZSIsIndvcmtmbG93LnVwZGF0ZSIsIndvcmtmbG93LmRlbGV0ZSIsIndvcmtmbG93LnNjcmlwdCIsIndvcmtmbG93RHJhZnQudmlldyIsIndvcmtmbG93RHJhZnQucmVhZCIsIndvcmtmbG93RHJhZnQuY3JlYXRlIiwid29ya2Zsb3dEcmFmdC5wdWJsaXNoIiwid29ya2Zsb3dEcmFmdC5kZWxldGUiLCJlbWFpbC52aWV3IiwiZW1haWwucmVhZCIsImVtYWlsLmNyZWF0ZSIsImVtYWlsLnVwZGF0ZSIsImVtYWlsLmRlbGV0ZSIsInN0YXR1cy52aWV3Iiwic3RhdHVzLnJlYWQiLCJzdGF0dXMuY3JlYXRlIiwic3RhdHVzLnVwZGF0ZSIsInN0YXR1cy5kZWxldGUiLCJmb3JtLnZpZXciLCJmb3JtLnJlYWQiLCJmb3JtLmNyZWF0ZSIsImZvcm0udXBkYXRlIiwiZm9ybS5kZWxldGUiLCJmb3JtRHJhZnQudmlldyIsImZvcm1EcmFmdC5yZWFkIiwiZm9ybURyYWZ0LmNyZWF0ZSIsImZvcm1EcmFmdC5wdWJsaXNoIiwiZm9ybURyYWZ0LmRlbGV0ZSIsImluc3RpdHV0ZS52aWV3IiwiaW5zdGl0dXRlLnJlYWQiLCJpbnN0aXR1dGUuY3JlYXRlIiwiaW5zdGl0dXRlLnVwZGF0ZSIsImluc3RpdHV0ZS5kZWxldGUiLCJwcm9qZWN0LnZpZXciLCJwcm9qZWN0LnJlYWQiLCJwcm9qZWN0LmNyZWF0ZSIsInByb2plY3QudXBkYXRlIiwicHJvamVjdC5kZWxldGUiLCJzY2hlZHVsZS52aWV3Iiwic2NoZWR1bGUucmVhZCIsInNjaGVkdWxlLmNyZWF0ZSIsInNjaGVkdWxlLnVwZGF0ZSIsInNjaGVkdWxlLmRlbGV0ZSIsImVxdWlwbWVudC52aWV3IiwiZXF1aXBtZW50LnJlYWQiLCJlcXVpcG1lbnQuY3JlYXRlIiwiZXF1aXBtZW50LnVwZGF0ZSIsImFsbG9jYXRpb24udmlldyIsImFsbG9jYXRpb24ucmVhZCIsImFsbG9jYXRpb24uY3JlYXRlIiwiYWxsb2NhdGlvbi51cGRhdGUiLCJhbGxvY2F0aW9uLmRlbGV0ZSIsImFsbG9jYXRpb24uZGVhbGxvY2F0ZSIsImFkbWluLnZpZXciLCJhZG1pbi5yZWFkIiwiYWRtaW4uY3JlYXRlIiwiYWRtaW4udXBkYXRlIiwiYWRtaW4uZGVsZXRlIiwicmVwb3J0LnZpZXciLCJyZXBvcnQucmVhZCIsInJlcG9ydC5jcmVhdGUiLCJyZXBvcnQudXBkYXRlIiwicmVwb3J0LmRlbGV0ZSJdLCJpYXQiOjE3NDU4NDM0MTcsImV4cCI6MTc0NTkyOTgxN30.n6N4cEta4eDJ2jtf1PYedivIxyWhBAV4DLiL8YsKRPI"
const project_id = "67d87ecf18dc32ba9051c789";

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
