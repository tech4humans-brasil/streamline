import { DEPLOY_DATE_FIELD_ID } from "./activityFormFieldConstants";
import type { ActivityListItem } from "@apis/activity";

export function getActivityFormFieldValue(
  activity: Pick<ActivityListItem, "form_draft">,
  fieldId: string
): unknown {
  const field = activity.form_draft?.fields?.find((f) => f.id === fieldId);
  if (
    field?.value === null ||
    field?.value === undefined ||
    field?.value === ""
  ) {
    return null;
  }
  return field.value;
}

export function getDeployDateFromActivity(
  activity: Pick<ActivityListItem, "form_draft">
): string | null {
  const value = getActivityFormFieldValue(activity, DEPLOY_DATE_FIELD_ID);
  return value === null ? null : String(value);
}
