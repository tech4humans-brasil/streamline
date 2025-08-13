async function get_data() {
  try {
    if (!activity || !activity.form_draft || !activity.form_draft.fields) {
      throw new Error("Activity data not available");
    }
  
    const url = vars.T4AI_URL;
    const clientKey = vars.T4AI_VISION_KEY;
  
    if (!clientKey) {
      throw new Error("Client key not found");
    }
  
    const headers = {
      "accept": "application/json",
      "x-client-key": clientKey,
      "Content-Type": "application/json"
    };
    const layoutMapped = {
      cpermanente: "48ac5eef-0881-457a-99b8-9e199e788560",
      iban: "4d17fcff-533d-4b60-8951-fcbad188b0cd"
    }
  
    const cpermanenteFileField = activity.form_draft.fields.find(field => field.id === "cpermanentefile");
    const ibanFileField = activity.form_draft.fields.find(field => field.id === "ibanfile");
  
    if (!cpermanenteFileField) {
      throw new Error("Field with id 'cpermanente' not found");
    }
  
    if (!ibanFileField) {
      throw new Error("Field with id 'iban' not found");
    }
  
    const bodyCpermanente = {
      file_url: cpermanenteFileField.value.url,
      layout_id: layoutMapped.cpermanente
    }
  
    const responseCpermanente = await axios.post(url, bodyCpermanente, { headers });
  
    if (responseCpermanente.status !== 200 || responseCpermanente.data.status !== "ok") {
      throw new Error("Error extracting data nif");
    }
  
    const extractedDataCpermanente = responseCpermanente.data.extracted_data;
  
    if (!extractedDataCpermanente) {
      throw new Error("No data extracted from cpermanente file");
    }
  
    if (!extractedDataCpermanente["nifs"]) {
      throw new Error("Field 'nifs' not found in extracted data");
    }
  
    if (!extractedDataCpermanente["socio_nomes"]) {
      throw new Error("Field 'socio_nomes' not found in extracted data");
    }
  
    const bodyIban = {
      file_url: ibanFileField.value.url,
      layout_id: layoutMapped.iban
    }
  
    const responseIban = await axios.post(url, bodyIban, { headers });
  
  
    if (responseIban.status !== 200 || responseIban.data.status !== "ok") {
      throw new Error("Error extracting data iban");
    }
  
    const extractedDataIban = responseIban.data.extracted_data;
  
    if (!extractedDataIban) {
      throw new Error("No data extracted from iban file");
    }
  
    const nifs = extractedDataCpermanente["nifs"].split(",").length > 0 ? extractedDataCpermanente["nifs"].split(",") : [extractedDataCpermanente["nifs"]];
    const socioNomes = extractedDataCpermanente["socio_nomes"].split(",").length > 0 ? extractedDataCpermanente["socio_nomes"].split(",") : [extractedDataCpermanente["socio_nomes"]];
  
    const partners = nifs.map((partner, index) => {
      return {
        nif: partner,
        name: socioNomes[index]
      }
    })
  
    for (let i = 0; i < activity.form_draft.fields.length; i++) {
      const field = activity.form_draft.fields[i];
      if (field.id === "certidaoperma") {
        activity.form_draft.fields[i].value = extractedDataCpermanente["nipc"] || "Não encontrado";
      }
  
      if (field.id === "nsocios") {
        activity.form_draft.fields[i].value = extractedDataCpermanente["quant"] || "Não encontrado";
      }
  
      if (field.id === "validatecertidaoperma") {
        activity.form_draft.fields[i].value = extractedDataCpermanente["validade"] || "Não encontrado";
      }
  
      if (field.id === "namerep1") {
        activity.form_draft.fields[i].value = partners[0].name || "Não encontrado";
      }
  
      if (field.id === "nifrep1") {
        activity.form_draft.fields[i].value = partners[0].nif || "Não encontrado";
      }
  
      if (field.id === "namerep2") {
        if (partners.length > 1) {
          activity.form_draft.fields[i].value = partners[1].name || "Não encontrado";
        }
      }
  
      if (field.id === "nifrep2") {
        if (partners.length > 1) {
          activity.form_draft.fields[i].value = partners[1].nif || "Não encontrado";
        }
      }
  
      if (field.id === "namerep3") {
        if (partners.length > 2) {
          activity.form_draft.fields[i].value = partners[2].name || "Não encontrado";
        }
      }
  
      if (field.id === "nifrep3") {
        if (partners.length > 2) {
          activity.form_draft.fields[i].value = partners[2].nif || "Não encontrado";
        }
      }
  
      if (field.id === "iban") {
        activity.form_draft.fields[i].value = extractedDataIban["iban"] || "Não encontrado";
      }
  
      if (field.id === "swift") {
        activity.form_draft.fields[i].value = extractedDataIban["swift"] || "Não encontrado";
      }
  
      if (field.id === "emissiondate") {
        activity.form_draft.fields[i].value = extractedDataIban["data_emissao"] || "Não encontrado";
      }
    }
  } catch (error) {
    throw error;
  }
}
