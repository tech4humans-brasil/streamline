import vm from "node:vm";

export class RunJavaScriptCodeTimeoutError extends Error {
  constructor() {
    super("Run Java Script Code Timeout");
  }
}

export interface RunJavaScriptCodeOptions extends vm.RunningCodeOptions {}

export default function runJavaScriptCode(
  code: string,
  context: object,
  options: RunJavaScriptCodeOptions = {}
) {
  const run = () => vm.runInContext(code, vm.createContext(context), options);

  return run();
}
