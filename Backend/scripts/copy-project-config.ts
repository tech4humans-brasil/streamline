/**
 * Copia a configuração de um projeto entre duas bases MongoDB (ex.: prod → dev).
 *
 * Coleções copiadas (por omissão):
 *   status, forms, formdrafts, workflows, workflowdrafts, emails, projects
 *
 * Coleções opcionais:
 *   schedules  — COPY_SCHEDULES=true (sem histórico scheduled[])
 *   institutes — COPY_INSTITUTES=true (referenciados em forms institute/visibilities)
 *
 * Não copia: activities, users, respostas, blobs de ficheiros.
 *
 * Mantém os mesmos _id da origem para preservar referências (form_id, status_id,
 * email_id, workflow_id, institute, initial_status, etc.).
 *
 * ── Variáveis obrigatórias ──────────────────────────────────────────────────
 *
 *   SOURCE_MONGO_URI        URI MongoDB/Cosmos da origem (sem nome da base)
 *   SOURCE_MONGO_CLIENT_DB  Nome da base do cliente na origem (acronym/slug)
 *   TARGET_MONGO_URI        URI MongoDB/Cosmos do destino
 *   TARGET_MONGO_CLIENT_DB  Nome da base do cliente no destino
 *   PROJECT_ID              ObjectId do projeto na origem
 *
 * ── Variáveis opcionais ─────────────────────────────────────────────────────
 *
 *   SOURCE_MONGO_PARAMS     Query string de conexão da origem (ssl, replicaSet, …)
 *   TARGET_MONGO_PARAMS     Query string de conexão do destino
 *
 *   TARGET_OWNER_USER_ID    ObjectId de um user existente no destino; substitui
 *                           owner em formdrafts/workflowdrafts e redefine as
 *                           permissões do projeto copiado
 *
 *   COPY_SCHEDULES          "true" — copia agendamentos do projeto (scheduled: [])
 *   COPY_INSTITUTES         "true" — copia institutes referenciados nos forms
 *   SKIP_EXISTING           "true" — não sobrescreve _id já presentes no destino;
 *                           pula conflitos de unicidade (name, slug, acronym)
 *                           em vez de abortar (ver nota abaixo)
 *   DRY_RUN                 "true" — simula; lista o que seria escrito sem alterar
 *
 * ── Comportamento de escrita ────────────────────────────────────────────────
 *
 *   Padrão: replaceOne({ _id }, doc, { upsert: true }) — insere ou substitui
 *           documento inteiro com o _id da origem. Aborta se houver conflito de
 *           unicidade (ex.: status "Sucesso" em dev com _id diferente de prod).
 *
 *   SKIP_EXISTING=true: ignora documentos cujo _id já existe no destino e ignora
 *           inserts bloqueados por name/slug/acronym duplicado (log [skip]).
 *           Atenção: referências copiadas podem apontar para _id ausentes no destino.
 *
 * ── Relatório final ─────────────────────────────────────────────────────────
 *
 *   Lista institutes referenciados em forms (IDs, sigla/nome, estado no destino,
 *   conflitos de acronym). Copiar institutes requer COPY_INSTITUTES=true.
 *
 * ── Exemplo ─────────────────────────────────────────────────────────────────
 *
 *   export SOURCE_MONGO_URI="mongodb://..."
 *   export SOURCE_MONGO_PARAMS="ssl=true&replicaSet=globaldb&retrywrites=false&..."
 *   export SOURCE_MONGO_CLIENT_DB="sigla-cliente"
 *   export TARGET_MONGO_URI="mongodb://..."
 *   export TARGET_MONGO_PARAMS="ssl=true&replicaSet=globaldb&retrywrites=false&..."
 *   export TARGET_MONGO_CLIENT_DB="sigla-cliente"
 *   export PROJECT_ID="697c1ccbe231cd0d8367698b"
 *   export TARGET_OWNER_USER_ID="507f191e810c19729de860ea"
 *   export COPY_INSTITUTES=true
 *   export COPY_SCHEDULES=false
 *   export SKIP_EXISTING=false
 *   export DRY_RUN=true
 *   pnpm run copy-project-config
 */

import mongoose from "mongoose";

type MongoDb = NonNullable<mongoose.Connection["db"]>;
type MongoDoc = Record<string, unknown> & {
  _id: mongoose.Types.ObjectId;
};

const COLLECTIONS = {
  projects: "projects",
  status: "status",
  forms: "forms",
  formDrafts: "formdrafts",
  workflows: "workflows",
  workflowDrafts: "workflowdrafts",
  emails: "emails",
  schedules: "schedules",
  institutes: "institutes",
} as const;

type WorkflowStep = {
  data?: Record<string, unknown>;
};

type CopyStats = Record<string, number>;

type UpsertResult = {
  written: number;
  skipped: number;
};

type UpsertOptions = {
  dryRun: boolean;
  skipExisting?: boolean;
  uniqueFields?: string[];
  transform?: (doc: MongoDoc) => MongoDoc;
};

function env(name: string, required = false): string | undefined {
  const value = process.env[name]?.trim();
  if (required && !value) {
    console.error(`Variável obrigatória ausente: ${name}`);
    process.exit(1);
  }
  return value;
}

function envFlag(name: string): boolean {
  return process.env[name]?.trim().toLowerCase() === "true";
}

function buildMongoUrl(base: string, dbName: string, params?: string): string {
  const normalizedBase = base.replace(/\/+$/, "");
  return params
    ? `${normalizedBase}/${dbName}?${params}`
    : `${normalizedBase}/${dbName}`;
}

function extractWorkflowDraftRefs(steps: WorkflowStep[] = []) {
  const refs = {
    formIds: new Set<string>(),
    statusIds: new Set<string>(),
    emailIds: new Set<string>(),
    workflowIds: new Set<string>(),
  };

  for (const step of steps) {
    const data = step.data ?? {};
    for (const key of ["form_id", "status_id", "email_id", "workflow_id"] as const) {
      const value = data[key];
      if (typeof value === "string" && value.length > 0) {
        if (key === "form_id") {
          refs.formIds.add(value);
        } else if (key === "status_id") {
          refs.statusIds.add(value);
        } else if (key === "email_id") {
          refs.emailIds.add(value);
        } else if (key === "workflow_id") {
          refs.workflowIds.add(value);
        }
      }
    }
  }

  return refs;
}

function projectFilter(projectObjectId: mongoose.Types.ObjectId, projectId: string) {
  return {
    $or: [{ project: projectObjectId }, { project: projectId }],
  };
}

function toObjectIds(ids: Iterable<string>) {
  return [...ids]
    .filter((id) => mongoose.Types.ObjectId.isValid(id))
    .map((id) => new mongoose.Types.ObjectId(id));
}

async function resolveStatuses(
  sourceDb: MongoDb,
  projectObjectId: mongoose.Types.ObjectId,
  projectId: string,
  forms: MongoDoc[],
  workflowDrafts: MongoDoc[]
): Promise<MongoDoc[]> {
  const byProject = await sourceDb
    .collection(COLLECTIONS.status)
    .find(projectFilter(projectObjectId, projectId))
    .toArray();

  const referencedIds = new Set<string>();

  for (const form of forms) {
    if (form.initial_status) {
      referencedIds.add(_idLabel(form.initial_status));
    }
  }

  for (const draft of workflowDrafts) {
    for (const statusId of extractWorkflowDraftRefs(
      (draft.steps as WorkflowStep[]) ?? []
    ).statusIds) {
      referencedIds.add(statusId);
    }
  }

  const referencedObjectIds = toObjectIds(referencedIds);
  const byReference =
    referencedObjectIds.length > 0
      ? await sourceDb
          .collection(COLLECTIONS.status)
          .find({ _id: { $in: referencedObjectIds } })
          .toArray()
      : [];

  const statusesById = new Map<string, MongoDoc>();
  for (const status of [...byProject, ...byReference]) {
    statusesById.set(_idLabel(status._id), status);
  }

  return [...statusesById.values()];
}

async function checkUniqueConflicts(
  targetDb: MongoDb,
  collection: string,
  docs: MongoDoc[],
  field: string,
  projectId: string
): Promise<void> {
  for (const doc of docs) {
    const value = doc[field];
    if (value == null || value === "") {
      continue;
    }

    const existing = await targetDb.collection(collection).findOne({
      [field]: value,
      _id: { $ne: doc._id },
    });

    if (existing) {
      throw new Error(
        `Conflito em ${collection}: ${field}="${value}" já existe no destino ` +
          `( _id destino=${existing._id}, origem projeto=${projectId}, origem _id=${doc._id} ). ` +
          "Renomeie ou remova o documento conflitante no destino antes de copiar."
      );
    }
  }
}

function transformProject(
  doc: MongoDoc,
  targetOwnerUserId?: string
): MongoDoc {
  if (!targetOwnerUserId) {
    return doc;
  }

  return {
    ...doc,
    permissions: [
      {
        type: "user",
        user: new mongoose.Types.ObjectId(targetOwnerUserId),
        institute: null,
        role: ["view", "update", "delete"],
        isOwner: true,
      },
    ],
  };
}

function transformDraft(doc: MongoDoc, targetOwnerUserId?: string): MongoDoc {
  if (!targetOwnerUserId) {
    return doc;
  }

  return {
    ...doc,
    owner: new mongoose.Types.ObjectId(targetOwnerUserId),
  };
}

function transformSchedule(doc: MongoDoc): MongoDoc {
  return {
    ...doc,
    scheduled: [],
  };
}

async function upsertMany(
  targetDb: MongoDb,
  collection: string,
  docs: MongoDoc[],
  options: UpsertOptions
): Promise<UpsertResult> {
  const { dryRun, skipExisting = false, uniqueFields = [], transform } = options;

  if (docs.length === 0) {
    return { written: 0, skipped: 0 };
  }

  let written = 0;
  let skipped = 0;

  for (const doc of docs) {
    const payload = transform ? transform(doc) : doc;
    const idLabel = _idLabel(payload._id);

    if (dryRun) {
      console.log(`  [dry-run] upsert ${collection} ${idLabel}`);
      written++;
      continue;
    }

    if (skipExisting) {
      const existingById = await targetDb
        .collection(collection)
        .findOne({ _id: payload._id });

      if (existingById) {
        console.log(
          `  [skip] ${collection} ${idLabel} já existe no destino (não sobrescreve)`
        );
        skipped++;
        continue;
      }

      let hasUniqueConflict = false;
      for (const field of uniqueFields) {
        const value = payload[field];
        if (value == null || value === "") {
          continue;
        }

        const conflict = await targetDb.collection(collection).findOne({
          [field]: value,
          _id: { $ne: payload._id },
        });

        if (conflict) {
          console.log(
            `  [skip] ${collection} ${idLabel} conflito ${field}="${value}" ` +
              `(destino _id=${conflict._id}) — remova o duplicado em dev para copiar com _id da origem`
          );
          hasUniqueConflict = true;
          break;
        }
      }

      if (hasUniqueConflict) {
        skipped++;
        continue;
      }
    }

    await targetDb.collection(collection).replaceOne(
      { _id: payload._id },
      payload,
      { upsert: true }
    );
    written++;
  }

  return { written, skipped };
}

async function recordUpsert(
  targetDb: MongoDb,
  collection: string,
  docs: MongoDoc[],
  stats: CopyStats,
  skippedStats: CopyStats,
  options: UpsertOptions
): Promise<void> {
  const result = await upsertMany(targetDb, collection, docs, options);
  stats[collection] = result.written;
  if (result.skipped > 0) {
    skippedStats[collection] = result.skipped;
  }
}

function _idLabel(id: unknown): string {
  if (id && typeof id === "object" && "toString" in id) {
    return String((id as { toString: () => string }).toString());
  }
  return String(id);
}

function collectInstituteRefs(forms: MongoDoc[]) {
  const refs = new Map<
    string,
    { formName: string; fields: ("institute" | "visibilities")[] }[]
  >();
  const ids = new Set<string>();

  const addUsage = (
    instituteId: string,
    formName: string,
    field: "institute" | "visibilities"
  ) => {
    ids.add(instituteId);
    const usages = refs.get(instituteId) ?? [];
    const existing = usages.find((usage) => usage.formName === formName);

    if (existing) {
      if (!existing.fields.includes(field)) {
        existing.fields.push(field);
      }
    } else {
      usages.push({ formName, fields: [field] });
    }

    refs.set(instituteId, usages);
  };

  for (const form of forms) {
    const formName = String(form.name ?? form._id);

    if (Array.isArray(form.institute)) {
      for (const ref of form.institute) {
        addUsage(_idLabel(ref), formName, "institute");
      }
    }

    if (Array.isArray(form.visibilities)) {
      for (const ref of form.visibilities) {
        addUsage(_idLabel(ref), formName, "visibilities");
      }
    }
  }

  return { ids, refs };
}

async function resolveInstitutes(
  sourceDb: MongoDb,
  forms: MongoDoc[]
): Promise<MongoDoc[]> {
  const { ids } = collectInstituteRefs(forms);
  const instituteObjectIds = toObjectIds(ids);

  if (instituteObjectIds.length === 0) {
    return [];
  }

  return sourceDb
    .collection(COLLECTIONS.institutes)
    .find({ _id: { $in: instituteObjectIds } })
    .toArray();
}

async function printInstituteReport(
  targetDb: MongoDb,
  institutes: MongoDoc[],
  forms: MongoDoc[]
): Promise<void> {
  const { ids, refs } = collectInstituteRefs(forms);

  if (ids.size === 0) {
    return;
  }

  const institutesById = new Map(
    institutes.map((institute) => [_idLabel(institute._id), institute])
  );

  console.log(
    "\nInstitutes referenciados em forms (use COPY_INSTITUTES=true para copiar mantendo _id):"
  );
  console.log(`  Total de IDs: ${ids.size}\n`);

  console.log("IDs:");
  for (const id of [...ids].sort()) {
    console.log(`  ${id}`);
  }

  console.log("\nDetalhes:");
  for (const id of [...ids].sort()) {
    const institute = institutesById.get(id);
    const label = institute
      ? `${institute.acronym ?? "?"} — ${institute.name ?? "?"}`
      : "documento não encontrado na origem";

    const targetExists = mongoose.Types.ObjectId.isValid(id)
      ? await targetDb
          .collection(COLLECTIONS.institutes)
          .findOne({ _id: new mongoose.Types.ObjectId(id) })
      : null;

    const instituteAcronym =
      typeof institute?.acronym === "string" ? institute.acronym : null;
    const acronymConflict =
      !targetExists && instituteAcronym
        ? await targetDb
            .collection(COLLECTIONS.institutes)
            .findOne({ acronym: instituteAcronym, _id: { $ne: new mongoose.Types.ObjectId(id) } })
        : null;

    console.log(`  ${id}`);
    console.log(`    origem:  ${label}`);
    if (targetExists) {
      console.log(`    destino: já existe (mesmo _id)`);
    } else if (acronymConflict) {
      console.log(
        `    destino: AUSENTE — conflito de acronym "${instituteAcronym}" ` +
          `(destino _id=${acronymConflict._id}). Remova ou renomeie no destino antes de copiar.`
      );
    } else {
      console.log(`    destino: AUSENTE — copiar (COPY_INSTITUTES=true)`);
    }

    for (const usage of refs.get(id) ?? []) {
      console.log(
        `    usado em: form "${usage.formName}" (${usage.fields.join(", ")})`
      );
    }
  }
}

async function copyProjectConfig(): Promise<void> {
  const sourceUri = env("SOURCE_MONGO_URI", true)!;
  const sourceDbName = env("SOURCE_MONGO_CLIENT_DB", true)!;
  const sourceParams = env("SOURCE_MONGO_PARAMS");

  const targetUri = env("TARGET_MONGO_URI", true)!;
  const targetDbName = env("TARGET_MONGO_CLIENT_DB", true)!;
  const targetParams = env("TARGET_MONGO_PARAMS");

  const projectId = env("PROJECT_ID", true)!;
  const targetOwnerUserId = env("TARGET_OWNER_USER_ID");
  const copySchedules = envFlag("COPY_SCHEDULES");
  const copyInstitutes = envFlag("COPY_INSTITUTES");
  const skipExisting = envFlag("SKIP_EXISTING");
  const dryRun = envFlag("DRY_RUN");

  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    console.error(`PROJECT_ID inválido: ${projectId}`);
    process.exit(1);
  }

  if (targetOwnerUserId && !mongoose.Types.ObjectId.isValid(targetOwnerUserId)) {
    console.error(`TARGET_OWNER_USER_ID inválido: ${targetOwnerUserId}`);
    process.exit(1);
  }

  const sourceConn = mongoose.createConnection(
    buildMongoUrl(sourceUri, sourceDbName, sourceParams)
  );
  const targetConn = mongoose.createConnection(
    buildMongoUrl(targetUri, targetDbName, targetParams)
  );

  await Promise.all([sourceConn.asPromise(), targetConn.asPromise()]);

  const sourceDb = sourceConn.db;
  const targetDb = targetConn.db;

  if (!sourceDb || !targetDb) {
    throw new Error("Falha ao obter conexão com a base de dados.");
  }
  const projectObjectId = new mongoose.Types.ObjectId(projectId);
  const stats: CopyStats = {};
  const skippedStats: CopyStats = {};

  try {
    console.log(`Origem:  ${sourceDbName} @ ${sourceUri}`);
    console.log(`Destino: ${targetDbName} @ ${targetUri}`);
    console.log(`Projeto: ${projectId}`);
    if (targetOwnerUserId) {
      console.log(`Owner destino: ${targetOwnerUserId}`);
    }
    if (dryRun) {
      console.log("Modo DRY_RUN — nenhuma escrita será feita.\n");
    }
    if (skipExisting) {
      console.log(
        "Modo SKIP_EXISTING — não sobrescreve _id existentes; pula conflitos de unicidade.\n"
      );
    }

    const project = await sourceDb
      .collection(COLLECTIONS.projects)
      .findOne({ _id: projectObjectId });

    if (!project) {
      throw new Error(`Projeto ${projectId} não encontrado na origem.`);
    }

    console.log(`Projeto encontrado: "${project.name}"\n`);

    const forms = await sourceDb
      .collection(COLLECTIONS.forms)
      .find(projectFilter(projectObjectId, projectId))
      .toArray();

    const formIds = forms.map((form) => form._id);

    const formDrafts =
      formIds.length > 0
        ? await sourceDb
            .collection(COLLECTIONS.formDrafts)
            .find({ parent: { $in: formIds } })
            .toArray()
        : [];

    const workflows = await sourceDb
      .collection(COLLECTIONS.workflows)
      .find(projectFilter(projectObjectId, projectId))
      .toArray();

    const workflowIds = workflows.map((workflow) => workflow._id);

    const workflowDrafts =
      workflowIds.length > 0
        ? await sourceDb
            .collection(COLLECTIONS.workflowDrafts)
            .find({ parent: { $in: workflowIds } })
            .toArray()
        : [];

    const statuses = await resolveStatuses(
      sourceDb,
      projectObjectId,
      projectId,
      forms,
      workflowDrafts
    );

    const referencedEmailIds = new Set<string>();
    for (const draft of workflowDrafts) {
      for (const emailId of extractWorkflowDraftRefs(
        (draft.steps as WorkflowStep[]) ?? []
      ).emailIds) {
        referencedEmailIds.add(emailId);
      }
    }

    const projectEmails = await sourceDb
      .collection(COLLECTIONS.emails)
      .find(projectFilter(projectObjectId, projectId))
      .toArray();

    const globalEmailObjectIds = toObjectIds(referencedEmailIds);

    const globalEmails =
      globalEmailObjectIds.length > 0
        ? await sourceDb
            .collection(COLLECTIONS.emails)
            .find({
              _id: { $in: globalEmailObjectIds },
              $or: [{ project: null }, { project: { $exists: false } }],
            })
            .toArray()
        : [];

    const emailsById = new Map<string, MongoDoc>();
    for (const email of [...projectEmails, ...globalEmails]) {
      emailsById.set(String(email._id), email);
    }
    const emails = [...emailsById.values()];

    const institutes = await resolveInstitutes(sourceDb, forms);

    const schedules = copySchedules
      ? await sourceDb
          .collection(COLLECTIONS.schedules)
          .find(projectFilter(projectObjectId, projectId))
          .toArray()
      : [];

    console.log("Documentos a copiar:");
    console.log(`  status:          ${statuses.length}`);
    console.log(`  institutes:      ${copyInstitutes ? institutes.length : 0}${copyInstitutes ? "" : " (use COPY_INSTITUTES=true)"}`);
    console.log(`  emails:          ${emails.length}`);
    console.log(`  forms:           ${forms.length}`);
    console.log(`  formdrafts:      ${formDrafts.length}`);
    console.log(`  workflows:       ${workflows.length}`);
    console.log(`  workflowdrafts:  ${workflowDrafts.length}`);
    console.log(`  project:         1`);
    console.log(`  schedules:       ${schedules.length}`);
    console.log("");

    if (!dryRun && !skipExisting) {
      console.log("Verificando conflitos de unicidade no destino...");
      await checkUniqueConflicts(
        targetDb,
        COLLECTIONS.projects,
        [project],
        "name",
        projectId
      );
      await checkUniqueConflicts(
        targetDb,
        COLLECTIONS.status,
        statuses,
        "name",
        projectId
      );
      await checkUniqueConflicts(
        targetDb,
        COLLECTIONS.forms,
        forms,
        "name",
        projectId
      );
      const formsWithSlug = forms.filter((form) => form.slug);
      if (formsWithSlug.length > 0) {
        await checkUniqueConflicts(
          targetDb,
          COLLECTIONS.forms,
          formsWithSlug,
          "slug",
          projectId
        );
      }
      await checkUniqueConflicts(
        targetDb,
        COLLECTIONS.emails,
        emails,
        "slug",
        projectId
      );
      if (copyInstitutes && institutes.length > 0) {
        await checkUniqueConflicts(
          targetDb,
          COLLECTIONS.institutes,
          institutes,
          "acronym",
          projectId
        );
      }
      console.log("Sem conflitos.\n");
    }

    console.log("Copiando...");

    const upsertBase = { dryRun, skipExisting };

    if (copyInstitutes) {
      await recordUpsert(
        targetDb,
        COLLECTIONS.institutes,
        institutes,
        stats,
        skippedStats,
        { ...upsertBase, uniqueFields: ["acronym"] }
      );
    }

    await recordUpsert(
      targetDb,
      COLLECTIONS.status,
      statuses,
      stats,
      skippedStats,
      { ...upsertBase, uniqueFields: ["name"] }
    );

    await recordUpsert(
      targetDb,
      COLLECTIONS.emails,
      emails,
      stats,
      skippedStats,
      { ...upsertBase, uniqueFields: ["slug"] }
    );

    await recordUpsert(
      targetDb,
      COLLECTIONS.forms,
      forms,
      stats,
      skippedStats,
      { ...upsertBase, uniqueFields: ["name", "slug"] }
    );

    await recordUpsert(
      targetDb,
      COLLECTIONS.formDrafts,
      formDrafts,
      stats,
      skippedStats,
      {
        ...upsertBase,
        transform: (doc) => transformDraft(doc, targetOwnerUserId),
      }
    );

    await recordUpsert(
      targetDb,
      COLLECTIONS.workflows,
      workflows,
      stats,
      skippedStats,
      upsertBase
    );

    await recordUpsert(
      targetDb,
      COLLECTIONS.workflowDrafts,
      workflowDrafts,
      stats,
      skippedStats,
      {
        ...upsertBase,
        transform: (doc) => transformDraft(doc, targetOwnerUserId),
      }
    );

    await recordUpsert(
      targetDb,
      COLLECTIONS.projects,
      [project],
      stats,
      skippedStats,
      {
        ...upsertBase,
        uniqueFields: ["name"],
        transform: (doc) => transformProject(doc, targetOwnerUserId),
      }
    );

    if (copySchedules) {
      await recordUpsert(
        targetDb,
        COLLECTIONS.schedules,
        schedules,
        stats,
        skippedStats,
        { ...upsertBase, transform: transformSchedule }
      );
    }

    console.log("\nConcluído.");
    console.log("Escritos:");
    for (const [collection, count] of Object.entries(stats)) {
      console.log(`  ${collection}: ${count}`);
    }

    if (Object.keys(skippedStats).length > 0) {
      console.log("\nIgnorados (SKIP_EXISTING):");
      for (const [collection, count] of Object.entries(skippedStats)) {
        console.log(`  ${collection}: ${count}`);
      }
    }

    if (!targetOwnerUserId) {
      console.log(
        "\nAviso: TARGET_OWNER_USER_ID não definido — drafts mantêm owner da origem " +
          "(pode não existir no destino)."
      );
    }

    await printInstituteReport(targetDb, institutes, forms);

    if (dryRun) {
      console.log("\nExecute novamente sem DRY_RUN=true para aplicar as alterações.");
    }
  } finally {
    await Promise.all([sourceConn.close(), targetConn.close()]);
  }
}

copyProjectConfig().catch((error) => {
  console.error(error);
  process.exit(1);
});
