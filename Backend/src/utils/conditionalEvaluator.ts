import { IFormDraft } from "../models/client/FormDraft";
import { IConditional } from "../models/client/WorkflowDraft";

export default class ConditionalEvaluator {
  static evaluate(
    answers: { data: IFormDraft }[],
    conditionals: IConditional["conditional"]
  ): boolean {
    return answers
      .filter((el) => !!el.data)
      .some((answer) => {
        return conditionals.every((conditional) => {
          const answerValue = answer.data.fields.find(
            (field) => field.id === conditional.field
          ).value;
          const value = conditional.value;

          switch (conditional.operator) {
            case "eq":
              return answerValue === value;
            case "ne":
              return answerValue !== value;
            case "gt":
              return answerValue > value;
            case "lt":
              return answerValue < value;
            case "gte":
              return answerValue >= value;
            case "lte":
              return answerValue <= value;
            case "in":
              return value.includes(answerValue);
            case "notIn":
              return !value.includes(answerValue);
            case "isNull":
              return !answerValue || answerValue === "";
            case "isNotNull":
              return answerValue && answerValue !== null;
            default:
              return false;
          }
        });
      });
  }
}
